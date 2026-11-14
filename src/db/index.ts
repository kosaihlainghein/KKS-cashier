import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

export type SqlDriverType = 'cloud-sql' | 'postgres-url' | 'local-json';

declare global {
  var _postgresPool: Pool | undefined;
}

export function getSqlDriverType(): SqlDriverType {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0) {
    return 'postgres-url';
  }
  if (
    process.env.SQL_HOST &&
    process.env.SQL_USER &&
    process.env.SQL_DB_NAME
  ) {
    return 'cloud-sql';
  }
  return 'local-json';
}

export function isSqlConfigured(): boolean {
  return getSqlDriverType() !== 'local-json';
}

function buildPoolConfig() {
  const driver = getSqlDriverType();
  if (driver === 'postgres-url') {
    const connStr = process.env.DATABASE_URL!.trim();
    const useSsl =
      process.env.SQL_SSL === 'true' ||
      connStr.includes('sslmode=require') ||
      connStr.includes('neon.tech') ||
      connStr.includes('supabase.');
    return {
      connectionString: connStr,
      max: 10,
      connectionTimeoutMillis: 15000,
      ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    };
  }

  return {
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    max: 10,
    connectionTimeoutMillis: 15000,
    ...(process.env.SQL_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

export const createPool = (): Pool | null => {
  if (!isSqlConfigured()) {
    return null;
  }
  if (!global._postgresPool) {
    global._postgresPool = new Pool(buildPoolConfig());
    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db: NodePgDatabase<typeof schema> | null = pool
  ? drizzle(pool, { schema })
  : null;

export async function getDatabaseHealth(): Promise<{
  driver: SqlDriverType;
  connected: boolean;
  latencyMs?: number;
}> {
  const driver = getSqlDriverType();
  if (!pool) {
    return { driver: 'local-json', connected: true, latencyMs: 0 };
  }
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    return {
      driver,
      connected: true,
      latencyMs: Date.now() - start,
    };
  } catch {
    return {
      driver,
      connected: false,
      latencyMs: Date.now() - start,
    };
  }
}
