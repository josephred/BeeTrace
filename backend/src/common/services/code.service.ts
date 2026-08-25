import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../database/database.module';
import type { DbExecutor } from './types';

export type CodePrefix = 'MOV' | 'LOTE' | 'TAM' | 'EXT' | 'MUE' | 'DTE';

/**
 * Genera codigos legibles y unicos (MOV-2026-000123) con un UPSERT atomico.
 * Evita el patron `select max(...) + 1`, que produce duplicados bajo concurrencia.
 */
@Injectable()
export class CodeService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async next(prefix: CodePrefix, executor: DbExecutor = this.db, at: Date = new Date()): Promise<string> {
    const year = at.getUTCFullYear();
    const result = await executor.execute<{ last_value: number }>(sql`
      INSERT INTO code_sequence (prefix, year, last_value)
      VALUES (${prefix}, ${year}, 1)
      ON CONFLICT (prefix, year)
      DO UPDATE SET last_value = code_sequence.last_value + 1
      RETURNING last_value
    `);
    const value = result.rows?.[0]?.last_value ?? 1;
    return `${prefix}-${year}-${String(value).padStart(6, '0')}`;
  }
}
