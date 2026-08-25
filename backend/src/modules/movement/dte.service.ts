import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../database/database.module';
import { document, dte, movement } from '../../database/schema';
import { AccessControlService } from '../../common/services/access-control.service';
import { DomainEvents, EventsService } from '../../common/services/events.service';
import { EstablishmentService } from '../establishment/establishment.service';
import { MovementService } from './movement.service';
import type { AuthenticatedUser } from '../../common/types';
import type { CloseDteDto, CreateDteDto, UpdateDteStatusDto } from './dto/movement.dto';

/**
 * Transiciones del DT-e. CLOSED es terminal: en el circuito informado por SENASA
 * para 2026 el titular del apiario gestiona el DT-e en SIGSA y la sala de
 * extraccion realiza el cierre al recibir el material.
 */
const DTE_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['ISSUED', 'CANCELLED'],
  ISSUED: ['APPROVED', 'REJECTED', 'CANCELLED', 'CLOSED'],
  APPROVED: ['CLOSED', 'REJECTED', 'CANCELLED'],
  CLOSED: [],
  REJECTED: [],
  CANCELLED: [],
};

@Injectable()
export class DteService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly access: AccessControlService,
    private readonly events: EventsService,
    private readonly movements: MovementService,
    private readonly establishments: EstablishmentService,
  ) {}

  /**
   * CU-10. El DT-e se crea como documento asociado a un movimiento existente:
   * nunca al reves. Mientras no exista integracion viva con SIGSA el registro
   * queda PENDING_SYNC, de modo que la operacion no se pierda (arquitectura, seccion 53).
   */
  async create(
    movementId: string,
    dto: CreateDteDto,
    actor: AuthenticatedUser,
    correlationId?: string,
  ) {
    this.access.assertCanWrite(actor);
    const record = await this.movements.findOne(movementId, actor);

    if (record.dte) {
      throw new ConflictException('El movimiento ya tiene un DT-e asociado.');
    }
    if (['RECEIVED', 'REJECTED', 'CANCELLED'].includes(record.status)) {
      throw new ConflictException(
        `No se puede emitir un DT-e para un movimiento en estado ${record.status}.`,
      );
    }

    const [originRenspa, destinationRenspa] = await Promise.all([
      dto.originRenspa
        ? Promise.resolve(dto.originRenspa)
        : this.establishments.activeRenspaNumber(record.originEstablishmentId),
      dto.destinationRenspa
        ? Promise.resolve(dto.destinationRenspa)
        : this.establishments.activeRenspaNumber(record.destinationEstablishmentId),
    ]);

    const issuedAt = dto.issuedAt ? new Date(dto.issuedAt) : new Date();

    return this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(dte)
        .values({
          movementId,
          number: dto.number ?? null,
          status: dto.number ? 'ISSUED' : 'DRAFT',
          issuedAt: dto.number ? issuedAt : null,
          originRenspa,
          destinationRenspa,
          externalSystem: 'SENASA_SIGSA',
          externalId: dto.fromExternalSystem ? (dto.number ?? null) : null,
          // Solo se marca sincronizado si el numero vino del organismo.
          syncStatus: dto.fromExternalSystem ? 'SYNCHRONIZED' : 'PENDING_SYNC',
          lastSyncAt: dto.fromExternalSystem ? new Date() : null,
          payload: {
            movementCode: record.code,
            materialType: record.materialType,
            quantity: record.quantity,
            unit: record.unit,
          } as never,
        })
        .returning();

      await tx.insert(document).values({
        type: 'DTE',
        number: created.number,
        movementId,
        issuedAt: created.issuedAt,
        externalSystem: 'SENASA_SIGSA',
        externalId: created.externalId,
        metadata: { dteId: created.id } as never,
        createdById: actor.id,
      });

      await this.events.publish(
        {
          eventType: DomainEvents.DteCreated,
          entityType: 'movement',
          entityId: movementId,
          actorUserId: actor.id,
          correlationId,
          payload: {
            dteId: created.id,
            number: created.number,
            status: created.status,
            syncStatus: created.syncStatus,
          },
        },
        tx,
      );

      return created;
    });
  }

  async updateStatus(
    movementId: string,
    dto: UpdateDteStatusDto,
    actor: AuthenticatedUser,
    correlationId?: string,
  ) {
    this.access.assertCanWrite(actor);
    const current = await this.getByMovement(movementId, actor);
    this.assertTransition(current.status, dto.status);

    if (dto.status === 'ISSUED' && !dto.number && !current.number) {
      throw new ConflictException('Para pasar a ISSUED se requiere el numero de DT-e.');
    }

    const eventType =
      dto.status === 'ISSUED'
        ? DomainEvents.DteIssued
        : dto.status === 'APPROVED'
          ? DomainEvents.DteApproved
          : DomainEvents.DteRejected;

    return this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(dte)
        .set({
          status: dto.status,
          number: dto.number ?? current.number,
          issuedAt: dto.status === 'ISSUED' ? (current.issuedAt ?? new Date()) : current.issuedAt,
          externalStatus: dto.status,
          errorMessage: dto.status === 'REJECTED' ? (dto.reason ?? null) : null,
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(dte.movementId, movementId))
        .returning();

      if (dto.number) {
        await tx
          .update(document)
          .set({ number: dto.number })
          .where(eq(document.movementId, movementId));
      }

      await this.events.publish(
        {
          eventType,
          entityType: 'movement',
          entityId: movementId,
          actorUserId: actor.id,
          correlationId,
          payload: { dteId: updated.id, number: updated.number, status: updated.status },
        },
        tx,
      );
      return updated;
    });
  }

  /**
   * CU-12. Cierre del DT-e por la sala receptora. Se exige que el movimiento
   * haya sido recibido: cerrar el documento de un material que nunca llego
   * rompe la trazabilidad que el documento pretende garantizar.
   */
  async close(
    movementId: string,
    dto: CloseDteDto,
    actor: AuthenticatedUser,
    correlationId?: string,
  ) {
    this.access.assertCanWrite(actor);
    const current = await this.getByMovement(movementId, actor);
    this.assertTransition(current.status, 'CLOSED');

    const [record] = await this.db
      .select()
      .from(movement)
      .where(eq(movement.id, movementId))
      .limit(1);

    if (!['RECEIVED', 'PARTIALLY_RECEIVED'].includes(record.status)) {
      throw new ConflictException(
        `El DT-e solo puede cerrarse una vez recibido el movimiento. Estado actual: ${record.status}.`,
      );
    }

    const closedAt = dto.closedAt ? new Date(dto.closedAt) : new Date();

    return this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(dte)
        .set({
          status: 'CLOSED',
          closedAt,
          externalStatus: 'CLOSED',
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(dte.movementId, movementId))
        .returning();

      await this.events.publish(
        {
          eventType: DomainEvents.DteClosed,
          entityType: 'movement',
          entityId: movementId,
          actorUserId: actor.id,
          correlationId,
          occurredAt: closedAt,
          payload: { dteId: updated.id, number: updated.number, closedAt: closedAt.toISOString() },
        },
        tx,
      );
      return updated;
    });
  }

  async getByMovement(movementId: string, actor: AuthenticatedUser) {
    await this.movements.findOne(movementId, actor);
    const rows = await this.db.select().from(dte).where(eq(dte.movementId, movementId)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('El movimiento no tiene un DT-e asociado.');
    }
    return rows[0];
  }

  private assertTransition(from: string, to: string): void {
    if (!DTE_TRANSITIONS[from]?.includes(to)) {
      throw new ConflictException(`Transicion invalida del DT-e: ${from} -> ${to}.`);
    }
  }
}
