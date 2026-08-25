/**
 * Aplica las migraciones pendientes. Se ejecuta antes de arrancar el proceso web
 * en Render (ver package.json -> start:render).
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { join } from 'node:path';

/** TLS obligatorio en proveedores gestionados o si la URL lo pide. */
const needsTls = (url: string): boolean =>
  /\bneon\.tech\b/.test(url) ||
  /\brender\.com\b/.test(url) ||
  /[?&]sslmode=(require|verify-ca|verify-full)\b/.test(url);

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL es obligatoria para ejecutar migraciones.');
  }

  const pool = new Pool({
    connectionString: url,
    max: 1,
    ssl: needsTls(url) ? { rejectUnauthorized: false } : undefined,
    // Neon puede tardar en despertar tras una suspension por inactividad.
    connectionTimeoutMillis: 30_000,
  });

  try {
    const db = drizzle(pool);
    const migrationsFolder = join(__dirname, '..', '..', 'drizzle');
    console.log(`[migrate] Aplicando migraciones desde ${migrationsFolder}`);
    await migrate(db, { migrationsFolder });
    console.log('[migrate] Migraciones aplicadas correctamente.');
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error('[migrate] Error aplicando migraciones:', error);
  process.exit(1);
});
