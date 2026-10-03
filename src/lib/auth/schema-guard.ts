import { sql } from "drizzle-orm";
import { db } from "@/db";

let passwordColumnsReady = false;

/** Safety net if pre-start skipped 0007. Idempotent. */
export async function ensureAccountPasswordColumns() {
  if (passwordColumnsReady) return;
  await db.execute(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS password_hash TEXT`);
  await db.execute(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMPTZ`);
  passwordColumnsReady = true;
}
