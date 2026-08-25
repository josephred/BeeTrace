import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, sql, type SQL } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../database/database.module';
import { drum, inventoryEvent, lot, sample } from '../../database/schema';
import { AccessControlService } from '../../common/services/access-control.service';
import { CodeService } from '../../common/services/code.service';
import { DomainEvents, EventsService } from '../../common/services/events.service';
import { toNumber } from '../../common/utils/numbers';
import { EstablishmentService } from '../establishment/establishment.service';
import { LotService } from './lot.service';
import type { AuthenticatedUser } from '../../common/types';
import type { PaginationQueryDto } from '../../common/dto/pagination.dto';
import type { CreateDrumDto, CreateSampleDto, TransferDrumDto } from './dto/production.dto';

@Injectable()
export class DrumService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly access: AccessControlService,
    private readonly events: EventsService,
    private readonly codes: CodeService,
    private readonly lots: LotService,
    private readonly establishments: EstablishmentService,
  ) {}

  /**
   * CU-16. El peso neto de los tambores no puede superar la cantidad del lote:
   * el lote es la unidad logica y el tambor la fisica; si la suma se pasa, uno
   * de los dos registros esta mal y la trazabilidad deja de cerrar.
   */
  async create(
    lotId: string,
    dto: CreateDrumDto,
    actor: AuthenticatedUser,
    correlationId?: string,
  ) {
    this.access.assertCanWrite(actor);
    const target = await this.lots.findOne(lotId, actor);

    if (['BLOCKED', 'CONSUMED'].includes(target.status)) {
      throw new ConflictException(`El lote esta ${target.status}; no admite nuevos tambores.`);
    }

    if (dto.grossWeight && dto.tareWeight) {
      const derived = dto.grossWeight - dto.tareWeight;
      if (Math.abs(derived - dto.netWeight) > 0.01) {
        throw new BadRequestException(
          `El peso neto declarado (${dto.netWeight}) no coincide con bruto menos tara (${derived.toFixed(3)}).`,
        );
      }
    }

    const existing = await this.db
      .select({ netWeight: drum.netWeight })
      .from(drum)
      .where(eq(drum.lotId, lotId));
    const already = existing.reduce((sum, row) => sum + toNumber(row.netWeight), 0);
    const lotQuantity = toNumber(target.quantity);

    if (already + dto.netWeight > lotQuantity + 0.001) {
      throw new ConflictException(
        `Los tambores del lote ${target.code} sumarian ${(already + dto.netWeight).toFixed(3)} ${target.unit}, y el lote declara ${lotQuantity}.`,
      );
    }

    return this.db.transaction(async (tx) => {
      const code = dto.code?.trim().toUpperCase() ?? (await this.codes.next('TAM', tx));
      const locationId = dto.locationEstablishmentId ?? target.establishmentId;

      const [created] = await tx
        .insert(drum)
        .values({
          code,
          lotId,
          locationEstablishmentId: locationId,
          tareWeight: dto.tareWeight !== undefined ? String(dto.tareWeight) : null,
          grossWeight: dto.grossWeight !== undefined ? String(dto.grossWeight) : null,
          netWeight: String(dto.netWeight),
          unit: target.unit,
          status: 'FILLED',
          sealNumber: dto.sealNumber ?? null,
          filledAt: dto.filledAt ? new Date(dto.filledAt) : new Date(),
          notes: dto.notes ?? null,
        })
        .returning();

      await tx.insert(inventoryEvent).values({
        eventType: 'CREATED',
        drumId: created.id,
        lotId,
        toEstablishmentId: locationId,
        quantity: String(dto.netWeight),
        unit: target.unit,
        actorUserId: actor.id,
      });

      await this.events.publish(
        {
          eventType: DomainEvents.DrumCreated,
          entityType: 'drum',
          entityId: created.id,
          actorUserId: actor.id,
          organizationId: target.organizationId,
          correlationId,
          payload: {
            code: created.code,
            lotId,
            lotCode: target.code,
            netWeight: dto.netWeight,
            unit: target.unit,
          },
        },
        tx,
      );

      return created;
    });
  }

  async list(
    query: PaginationQueryDto,
    actor: AuthenticatedUser,
    filters: { lotId?: string; status?: string } = {},
  ) {
    const conditions: SQL[] = [];
    const scope = this.access.organizationScope(actor);
    if (scope) {
      conditions.push(sql`${drum.lotId} IN (SELECT id FROM lot WHERE organization_id = ${scope})`);
    }
    if (filters.lotId) conditions.push(eq(drum.lotId, filters.lotId));
    if (filters.status) conditions.push(eq(drum.status, filters.status as never));
    if (query.q) conditions.push(sql`${drum.code} ILIKE ${`%${query.q}%`}`);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select()
        .from(drum)
        .where(where)
        .orderBy(desc(drum.createdAt))
        .limit(query.pageSize)
        .offset(query.offset),
      this.db.select({ count: sql<number>`cast(count(*) as int)` }).from(drum).where(where),
    ]);
    return { rows, total: count };
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const rows = await this.db.select().from(drum).where(eq(drum.id, id)).limit(1);
    if (rows.length === 0) throw new NotFoundException('Tambor no encontrado.');
    await this.lots.findOne(rows[0].lotId, actor);
    return rows[0];
  }

  async findByCode(code: string, actor: AuthenticatedUser) {
    const rows = await this.db.select().from(drum).where(eq(drum.code, code)).limit(1);
    if (rows.length === 0) throw new NotFoundException(`No existe el tambor ${code}.`);
    await this.lots.findOne(rows[0].lotId, actor);
    return rows[0];
  }

  async findOneDetailed(id: string, actor: AuthenticatedUser) {
    const record = await this.findOne(id, actor);
    const [parent, history] = await Promise.all([
      this.db.select().from(lot).where(eq(lot.id, record.lotId)).limit(1),
      this.db
        .select()
        .from(inventoryEvent)
        .where(eq(inventoryEvent.drumId, id))
        .orderBy(asc(inventoryEvent.occurredAt)),
    ]);
    return { ...record, lot: parent[0] ?? null, history };
  }

  /**
   * CU-25: cambia la ubicacion fisica dejando rastro en inventory_event.
   *
   * La custodia fisica y la propiedad logica pueden estar en organizaciones
   * distintas: la sala es duena del lote, pero el tambor puede estar llegando a
   * un acopio. Por eso la autorizacion aqui no mira solo el dueno del lote, sino
   * a las tres partes involucradas en el traslado.
   */
  async transfer(
    id: string,
    dto: TransferDrumDto,
    actor: AuthenticatedUser,
    correlationId?: string,
  ) {
    this.access.assertCanWrite(actor);
    const record = await this.findRaw(id);
    await this.assertCustodyAccess(actor, record, dto.toEstablishmentId);
    if (record.locationEstablishmentId === dto.toEstablishmentId) {
      throw new ConflictException('El tambor ya se encuentra en ese establecimiento.');
    }
    if (['CONSUMED'].includes(record.status)) {
      throw new ConflictException('Un tambor consumido no puede transferirse.');
    }
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();

    return this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(drum)
        .set({
          locationEstablishmentId: dto.toEstablishmentId,
          status: 'IN_STOCK',
          updatedAt: new Date(),
        })
        .where(eq(drum.id, id))
        .returning();

      await tx.insert(inventoryEvent).values({
        eventType: 'MOVED',
        drumId: id,
        lotId: record.lotId,
        fromEstablishmentId: record.locationEstablishmentId,
        toEstablishmentId: dto.toEstablishmentId,
        quantity: record.netWeight,
        unit: record.unit,
        occurredAt,
        actorUserId: actor.id,
        notes: dto.notes ?? null,
      });

      await this.events.publish(
        {
          eventType: DomainEvents.DrumMoved,
          entityType: 'drum',
          entityId: id,
          actorUserId: actor.id,
          correlationId,
          occurredAt,
          payload: {
            code: record.code,
            from: record.locationEstablishmentId,
            to: dto.toEstablishmentId,
          },
        },
        tx,
      );
      return updated;
    });
  }

  /** Lectura sin control de acceso, para resolver la custodia antes de autorizar. */
  private async findRaw(id: string) {
    const rows = await this.db.select().from(drum).where(eq(drum.id, id)).limit(1);
    if (rows.length === 0) throw new NotFoundException('Tambor no encontrado.');
    return rows[0];
  }

  private async assertCustodyAccess(
    actor: AuthenticatedUser,
    record: typeof drum.$inferSelect,
    toEstablishmentId: string,
  ): Promise<void> {
    const destination = await this.establishments.findRaw(toEstablishmentId);
    if (this.access.hasGlobalScope(actor)) return;

    const owner = await this.db
      .select({ organizationId: lot.organizationId })
      .from(lot)
      .where(eq(lot.id, record.lotId))
      .limit(1);

    const current = record.locationEstablishmentId
      ? await this.establishments.findRaw(record.locationEstablishmentId)
      : null;

    const allowed = new Set(
      [
        owner[0]?.organizationId,
        current?.organizationId,
        destination.organizationId,
      ].filter((value): value is string => Boolean(value)),
    );

    if (!actor.organizationId || !allowed.has(actor.organizationId)) {
      throw new ForbiddenException(
        'Para transferir un tambor debe pertenecer a la organizacion duena del lote, a la que lo custodia o a la de destino.',
      );
    }
  }

  /** CU-21 (basico): registrar una muestra asociada a un lote o tambor. */
  async createSample(dto: CreateSampleDto, actor: AuthenticatedUser, correlationId?: string) {
    this.access.assertCanWrite(actor);
    const target = await this.lots.findOne(dto.lotId, actor);

    if (dto.drumId) {
      const rows = await this.db.select().from(drum).where(eq(drum.id, dto.drumId)).limit(1);
      if (rows.length === 0) throw new NotFoundException('El tambor indicado no existe.');
      if (rows[0].lotId !== dto.lotId) {
        throw new BadRequestException('El tambor no pertenece al lote indicado.');
      }
    }

    const takenAt = new Date(dto.takenAt);

    return this.db.transaction(async (tx) => {
      const code = await this.codes.next('MUE', tx, takenAt);
      const [created] = await tx
        .insert(sample)
        .values({
          code,
          lotId: dto.lotId,
          drumId: dto.drumId ?? null,
          laboratoryOrganizationId: dto.laboratoryOrganizationId ?? null,
          takenAt,
          takenBy: dto.takenBy ?? actor.fullName,
          analysisType: dto.analysisType ?? null,
          status: dto.laboratoryOrganizationId ? 'SENT' : 'CREATED',
          sentAt: dto.laboratoryOrganizationId ? new Date() : null,
          notes: dto.notes ?? null,
          createdById: actor.id,
        })
        .returning();

      await this.events.publish(
        {
          eventType: DomainEvents.SampleCreated,
          entityType: 'lot',
          entityId: dto.lotId,
          actorUserId: actor.id,
          organizationId: target.organizationId,
          correlationId,
          occurredAt: takenAt,
          payload: { sampleId: created.id, code: created.code, drumId: created.drumId },
        },
        tx,
      );
      return created;
    });
  }

  async listSamples(lotId: string, actor: AuthenticatedUser) {
    await this.lots.findOne(lotId, actor);
    return this.db
      .select()
      .from(sample)
      .where(eq(sample.lotId, lotId))
      .orderBy(desc(sample.takenAt));
  }
}
