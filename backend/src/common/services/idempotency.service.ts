import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { eq, lt } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../database/database.module';
import { idempotencyKey } from '../../database/schema';

export interface IdempotentHit {
  status: number;
  body: unknown;
}

/**
 * Idempotencia de comandos (arquitectura, seccion 38). Un reintento de red
 * nunca debe generar dos movimientos ni dos DT-e.
 */
@Injectable()
export class IdempotencyService {
  private static readonly TTL_HOURS = 24;

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  hashRequest(body: unknown): string {
    return createHash('sha256').update(JSON.stringify(body ?? {})).digest('hex');
  }

  /**
   * Reserva la clave. Devuelve la respuesta previa si la misma clave y el mismo
   * cuerpo ya se procesaron; lanza 409 si la clave se reutiliza con otro cuerpo.
   */
  async begin(
    key: string,
    endpoint: string,
    body: unknown,
    userId?: string | null,
  ): Promise<IdempotentHit | null> {
    const requestHash = this.hashRequest(body);
    const existing = await this.db
      .select()
      .from(idempotencyKey)
      .where(eq(idempotencyKey.key, key))
      .limit(1);

    if (existing.length > 0) {
      const record = existing[0];
      if (record.requestHash !== requestHash) {
        throw new ConflictException(
          'La clave de idempotencia ya fue usada con un cuerpo distinto.',
        );
      }
      if (record.responseStatus === null) {
        throw new ConflictException('Hay una solicitud con esa clave todavia en curso.');
      }
      return { status: record.responseStatus, body: record.responseBody };
    }

    const expiresAt = new Date(Date.now() + IdempotencyService.TTL_HOURS * 3_600_000);
    await this.db.insert(idempotencyKey).values({
      key,
      endpoint,
      requestHash,
      userId: userId ?? null,
      expiresAt,
    });
    return null;
  }

  async complete(key: string, status: number, body: unknown): Promise<void> {
    await this.db
      .update(idempotencyKey)
      .set({ responseStatus: status, responseBody: (body ?? null) as never })
      .where(eq(idempotencyKey.key, key));
  }

  async release(key: string): Promise<void> {
    await this.db.delete(idempotencyKey).where(eq(idempotencyKey.key, key));
  }

  async purgeExpired(): Promise<void> {
    await this.db.delete(idempotencyKey).where(lt(idempotencyKey.expiresAt, new Date()));
  }
}
