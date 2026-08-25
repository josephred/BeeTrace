import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../database/database.module';
import { auditEvent } from '../../database/schema';
import type { DbExecutor } from './types';
import type { AuthenticatedUser } from '../types';

export interface AuditInput {
  action: string;
  entityType: string;
  entityId?: string | null;
  actor?: AuthenticatedUser | null;
  before?: unknown;
  after?: unknown;
  source?: string;
  correlationId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export interface AuditQuery {
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  action?: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}

/**
 * CU-33 / CU-34. La auditoria se escribe en su propia tabla, independiente de
 * las tablas operativas, y nunca debe hacer fallar la operacion de negocio.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async record(input: AuditInput, executor: DbExecutor = this.db): Promise<void> {
    try {
      await executor.insert(auditEvent).values({
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        actorUserId: input.actor?.id ?? null,
        actorEmail: input.actor?.email ?? null,
        before: (input.before ?? null) as never,
        after: (input.after ?? null) as never,
        source: input.source ?? 'API',
        correlationId: input.correlationId ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent?.slice(0, 300) ?? null,
      });
    } catch (error) {
      this.logger.error(
        `No se pudo registrar la auditoria de ${input.action} sobre ${input.entityType}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async search(query: AuditQuery) {
    const conditions: SQL[] = [];
    if (query.entityType) conditions.push(eq(auditEvent.entityType, query.entityType));
    if (query.entityId) conditions.push(eq(auditEvent.entityId, query.entityId));
    if (query.actorUserId) conditions.push(eq(auditEvent.actorUserId, query.actorUserId));
    if (query.action) conditions.push(eq(auditEvent.action, query.action));
    if (query.from) conditions.push(gte(auditEvent.timestamp, query.from));
    if (query.to) conditions.push(lte(auditEvent.timestamp, query.to));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select()
        .from(auditEvent)
        .where(where)
        .orderBy(desc(auditEvent.timestamp))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      this.db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(auditEvent)
        .where(where),
    ]);

    return { rows, total: count };
  }
}
