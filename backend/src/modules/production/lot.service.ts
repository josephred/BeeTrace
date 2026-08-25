import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../database/database.module';
import {
  drum,
  extraction,
  extractionInput,
  lot,
  lotInput,
  movement,
} from '../../database/schema';
import { AccessControlService } from '../../common/services/access-control.service';
import { CodeService } from '../../common/services/code.service';
import { DomainEvents, EventsService } from '../../common/services/events.service';
import { toNumber } from '../../common/utils/numbers';
import { EstablishmentService } from '../establishment/establishment.service';
import type { DbExecutor } from '../../common/services/types';
import type { AuthenticatedUser } from '../../common/types';
import type { PaginationQueryDto } from '../../common/dto/pagination.dto';
import type {
  AddLotInputsDto,
  CreateLotDto,
  LotInputDto,
  UpdateLotStatusDto,
} from './dto/production.dto';

/** Estados desde los que un lote todavia admite composicion o extraccion de tambores. */
const MUTABLE_STATUSES = ['OPEN'];

@Injectable()
export class LotService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly access: AccessControlService,
    private readonly events: EventsService,
    private readonly codes: CodeService,
    private readonly establishments: EstablishmentService,
  ) {}

  /** CU-14 (+ CU-15 cuando se envian entradas en el alta). */
  async create(dto: CreateLotDto, actor: AuthenticatedUser, correlationId?: string) {
    this.access.assertCanWrite(actor);
    const site = await this.establishments.findOne(dto.establishmentId, actor);

    let inputs = dto.inputs ?? [];

    if (dto.extractionId) {
      const source = await this.db
        .select()
        .from(extraction)
        .where(eq(extraction.id, dto.extractionId))
        .limit(1);
      if (source.length === 0) throw new NotFoundException('La extraccion indicada no existe.');
      if (source[0].establishmentId !== dto.establishmentId) {
        throw new BadRequestException(
          'La extraccion pertenece a otro establecimiento que el indicado para el lote.',
        );
      }
      // Un lote nacido de una extraccion hereda su trazabilidad: la arista se
      // agrega sola para que nunca quede un lote de sala sin origen.
      if (!inputs.some((input) => input.sourceExtractionId === dto.extractionId)) {
        inputs = [
          ...inputs,
          {
            sourceType: 'EXTRACTION',
            sourceExtractionId: dto.extractionId,
            quantity: dto.quantity,
            unit: dto.unit ?? 'KG',
          },
        ];
      }
    }

    const productionDate = new Date(dto.productionDate);

    return this.db.transaction(async (tx) => {
      const code = await this.codes.next('LOTE', tx, productionDate);
      const [created] = await tx
        .insert(lot)
        .values({
          code,
          organizationId: site.organizationId,
          establishmentId: dto.establishmentId,
          extractionId: dto.extractionId ?? null,
          lotType: dto.lotType ?? (dto.extractionId ? 'EXTRACCION' : 'ACOPIO'),
          productionDate,
          quantity: String(dto.quantity),
          availableQuantity: String(dto.quantity),
          unit: dto.unit ?? 'KG',
          honeyType: dto.honeyType ?? null,
          moisturePercent:
            dto.moisturePercent !== undefined ? String(dto.moisturePercent) : null,
          color: dto.color ?? null,
          notes: dto.notes ?? null,
          createdById: actor.id,
        })
        .returning();

      if (inputs.length > 0) {
        await this.attachInputs(tx, created.id, inputs, dto.unit ?? 'KG', actor, correlationId);
      }

      await this.events.publish(
        {
          eventType: DomainEvents.LotCreated,
          entityType: 'lot',
          entityId: created.id,
          actorUserId: actor.id,
          organizationId: site.organizationId,
          correlationId,
          payload: {
            code: created.code,
            lotType: created.lotType,
            productionDate: productionDate.toISOString(),
            quantity: created.quantity,
            unit: created.unit,
            extractionId: created.extractionId,
            inputCount: inputs.length,
          },
        },
        tx,
      );

      return created;
    });
  }

  /** CU-15: asociar entradas a un lote existente. */
  async addInputs(
    lotId: string,
    dto: AddLotInputsDto,
    actor: AuthenticatedUser,
    correlationId?: string,
  ) {
    this.access.assertCanWrite(actor);
    const target = await this.findOne(lotId, actor);
    if (!MUTABLE_STATUSES.includes(target.status)) {
      throw new ConflictException(
        `El lote esta ${target.status}; solo un lote OPEN admite nuevas entradas.`,
      );
    }

    return this.db.transaction(async (tx) => {
      const created = await this.attachInputs(
        tx,
        lotId,
        dto.inputs,
        target.unit,
        actor,
        correlationId,
      );
      return created;
    });
  }

  /**
   * Valida y persiste las aristas hacia atras del grafo.
   * Un lote origen se descuenta de su cantidad disponible: sin ese control, la
   * misma miel podria repartirse en lotes que sumen mas de lo que existio.
   */
  private async attachInputs(
    tx: DbExecutor,
    lotId: string,
    inputs: LotInputDto[],
    defaultUnit: string,
    actor: AuthenticatedUser,
    correlationId?: string,
  ) {
    const values: (typeof lotInput.$inferInsert)[] = [];

    for (const input of inputs) {
      switch (input.sourceType) {
        case 'MOVEMENT': {
          if (!input.sourceMovementId) {
            throw new BadRequestException('sourceMovementId es obligatorio para sourceType MOVEMENT.');
          }
          const rows = await tx
            .select()
            .from(movement)
            .where(eq(movement.id, input.sourceMovementId))
            .limit(1);
          if (rows.length === 0) throw new NotFoundException('El movimiento de origen no existe.');
          if (!['RECEIVED', 'PARTIALLY_RECEIVED'].includes(rows[0].status)) {
            throw new ConflictException(
              `El movimiento ${rows[0].code} no fue recibido; no puede componer un lote.`,
            );
          }
          break;
        }
        case 'LOT': {
          if (!input.sourceLotId) {
            throw new BadRequestException('sourceLotId es obligatorio para sourceType LOT.');
          }
          if (input.sourceLotId === lotId) {
            throw new BadRequestException('Un lote no puede ser origen de si mismo.');
          }
          const rows = await tx.select().from(lot).where(eq(lot.id, input.sourceLotId)).limit(1);
          if (rows.length === 0) throw new NotFoundException('El lote de origen no existe.');
          const source = rows[0];
          if (source.status === 'BLOCKED') {
            throw new ConflictException(`El lote ${source.code} esta bloqueado.`);
          }
          const available = toNumber(source.availableQuantity);
          if (input.quantity > available + 0.001) {
            throw new ConflictException(
              `El lote ${source.code} solo tiene ${available} ${source.unit} disponibles y se solicitan ${input.quantity}.`,
            );
          }
          const remaining = available - input.quantity;
          await tx
            .update(lot)
            .set({
              availableQuantity: String(remaining.toFixed(3)),
              status: remaining <= 0.001 ? 'CONSUMED' : source.status,
              updatedAt: new Date(),
            })
            .where(eq(lot.id, input.sourceLotId));
          break;
        }
        case 'EXTRACTION': {
          if (!input.sourceExtractionId) {
            throw new BadRequestException(
              'sourceExtractionId es obligatorio para sourceType EXTRACTION.',
            );
          }
          const rows = await tx
            .select({ id: extraction.id })
            .from(extraction)
            .where(eq(extraction.id, input.sourceExtractionId))
            .limit(1);
          if (rows.length === 0) throw new NotFoundException('La extraccion de origen no existe.');
          break;
        }
        case 'MANUAL':
          break;
      }

      values.push({
        lotId,
        sourceType: input.sourceType,
        sourceMovementId: input.sourceMovementId ?? null,
        sourceLotId: input.sourceLotId ?? null,
        sourceExtractionId: input.sourceExtractionId ?? null,
        quantity: String(input.quantity),
        unit: (input.unit ?? defaultUnit) as never,
        notes: input.notes ?? null,
      });
    }

    const created = await tx.insert(lotInput).values(values).returning();

    await this.events.publish(
      {
        eventType: DomainEvents.LotInputAdded,
        entityType: 'lot',
        entityId: lotId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          inputs: created.map((row) => ({
            sourceType: row.sourceType,
            sourceMovementId: row.sourceMovementId,
            sourceLotId: row.sourceLotId,
            sourceExtractionId: row.sourceExtractionId,
            quantity: row.quantity,
          })),
        },
      },
      tx,
    );

    return created;
  }

  async list(
    query: PaginationQueryDto,
    actor: AuthenticatedUser,
    filters: { status?: string; establishmentId?: string } = {},
  ) {
    const conditions: SQL[] = [];
    const scope = this.access.organizationScope(actor);
    if (scope) conditions.push(eq(lot.organizationId, scope));
    if (filters.status) conditions.push(eq(lot.status, filters.status as never));
    if (filters.establishmentId) conditions.push(eq(lot.establishmentId, filters.establishmentId));
    if (query.q) conditions.push(sql`${lot.code} ILIKE ${`%${query.q}%`}`);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select()
        .from(lot)
        .where(where)
        .orderBy(desc(lot.productionDate))
        .limit(query.pageSize)
        .offset(query.offset),
      this.db.select({ count: sql<number>`cast(count(*) as int)` }).from(lot).where(where),
    ]);
    return { rows, total: count };
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const rows = await this.db.select().from(lot).where(eq(lot.id, id)).limit(1);
    if (rows.length === 0) throw new NotFoundException('Lote no encontrado.');
    this.access.assertOrganizationAccess(actor, rows[0].organizationId);
    return rows[0];
  }

  async findByCode(code: string, actor: AuthenticatedUser) {
    const rows = await this.db.select().from(lot).where(eq(lot.code, code)).limit(1);
    if (rows.length === 0) throw new NotFoundException(`No existe el lote ${code}.`);
    this.access.assertOrganizationAccess(actor, rows[0].organizationId);
    return rows[0];
  }

  async findOneDetailed(id: string, actor: AuthenticatedUser) {
    const record = await this.findOne(id, actor);
    const [inputs, drums] = await Promise.all([
      this.db.select().from(lotInput).where(eq(lotInput.lotId, id)).orderBy(asc(lotInput.createdAt)),
      this.db.select().from(drum).where(eq(drum.lotId, id)).orderBy(asc(drum.code)),
    ]);
    const netInDrums = drums.reduce((sum, row) => sum + toNumber(row.netWeight), 0);
    return {
      ...record,
      inputs,
      drums,
      summary: {
        drumCount: drums.length,
        netWeightInDrums: Number(netInDrums.toFixed(3)),
        quantity: toNumber(record.quantity),
        availableQuantity: toNumber(record.availableQuantity),
      },
    };
  }

  async updateStatus(
    id: string,
    dto: UpdateLotStatusDto,
    actor: AuthenticatedUser,
    correlationId?: string,
  ) {
    this.access.assertCanWrite(actor);
    const record = await this.findOne(id, actor);
    if (record.status === dto.status) return record;

    return this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(lot)
        .set({
          status: dto.status,
          notes: dto.reason
            ? `${record.notes ?? ''}\n[${dto.status}] ${dto.reason}`.trim().slice(0, 1000)
            : record.notes,
          updatedAt: new Date(),
        })
        .where(eq(lot.id, id))
        .returning();

      if (dto.status === 'CLOSED') {
        await this.events.publish(
          {
            eventType: DomainEvents.LotClosed,
            entityType: 'lot',
            entityId: id,
            actorUserId: actor.id,
            correlationId,
            payload: { code: record.code, previousStatus: record.status },
          },
          tx,
        );
      }
      return updated;
    });
  }

  /** Movimientos recibidos que aun no fueron consumidos por ninguna extraccion. */
  async availableInputsAt(establishmentId: string, actor: AuthenticatedUser) {
    await this.establishments.findOne(establishmentId, actor);
    const consumed = await this.db
      .select({ movementId: extractionInput.movementId })
      .from(extractionInput);
    const consumedIds = consumed.map((row) => row.movementId);

    const conditions: SQL[] = [
      eq(movement.destinationEstablishmentId, establishmentId),
      inArray(movement.status, ['RECEIVED', 'PARTIALLY_RECEIVED']),
    ];
    if (consumedIds.length > 0) {
      conditions.push(sql`${movement.id} NOT IN ${consumedIds}`);
    }

    return this.db
      .select()
      .from(movement)
      .where(and(...conditions))
      .orderBy(desc(movement.receivedAt));
  }
}
