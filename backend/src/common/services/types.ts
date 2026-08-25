import type { Database } from '../../database/database.module';

/** Ejecutor de consultas: la conexion principal o una transaccion en curso. */
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
export type DbExecutor = Database | Transaction;
