import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

function createDb(pool: Pool) {
  return drizzle(pool, { schema });
}

type HadiranDb = ReturnType<typeof createDb>;

const globalForDb = globalThis as typeof globalThis & {
  __hadiranPool?: Pool;
  __hadiranDb?: HadiranDb;
};

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  if (!globalForDb.__hadiranPool) {
    globalForDb.__hadiranPool = new Pool({
      connectionString: url,
      connectionTimeoutMillis: 8000,
    });
  }
  return globalForDb.__hadiranPool;
}

function getDb(): HadiranDb {
  if (!globalForDb.__hadiranDb) {
    globalForDb.__hadiranDb = createDb(getPool());
  }
  return globalForDb.__hadiranDb;
}

export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const real = getPool();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(real) : value;
  },
});

export const db = new Proxy({} as HadiranDb, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(real) : value;
  },
});
