import { sql } from "drizzle-orm";
import { db } from "@/db";

let passwordColumnsReady = false;
let profileSchemaReady = false;
let casioAttemptsReady = false;

/** Safety net if pre-start skipped 0007. Idempotent. */
export async function ensureAccountPasswordColumns() {
  if (passwordColumnsReady) return;
  await db.execute(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS password_hash TEXT`);
  await db.execute(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMPTZ`);
  passwordColumnsReady = true;
}

/** Safety net if pre-start skipped 0009. Idempotent. Does not backfill codes. */
export async function ensureAccountProfileSchema() {
  if (profileSchemaReady) return;
  await db.execute(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS given_name VARCHAR(64)`);
  await db.execute(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS family_name VARCHAR(64)`);
  await db.execute(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS email VARCHAR(254)`);
  await db.execute(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ`);
  await db.execute(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS telegram_user_id VARCHAR(32)`);
  await db.execute(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMPTZ`);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS accounts_email_unique
    ON accounts (email) WHERE email IS NOT NULL
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS accounts_telegram_user_id_unique
    ON accounts (telegram_user_id) WHERE telegram_user_id IS NOT NULL
  `);
  await db.execute(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS policies_accepted_at TIMESTAMPTZ`);
  await db.execute(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS policies_version VARCHAR(64)`);
  await db.execute(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS account_public_codes (
      account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
      code VARCHAR(8) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT account_public_codes_code_digits CHECK (code ~ '^[0-9]{8}$')
    )
  `);
  profileSchemaReady = true;
}

/** Safety net if pre-start skipped 0012. Idempotent. */
export async function ensureCasioAttemptsSchema() {
  if (casioAttemptsReady) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS casio_attempts (
      id SERIAL PRIMARY KEY,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      instrument_version VARCHAR(64) NOT NULL,
      consent_at TIMESTAMPTZ,
      answers JSONB NOT NULL DEFAULT '{}'::jsonb,
      status VARCHAR(16) NOT NULL DEFAULT 'in_progress',
      submitted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS casio_attempts_open_account
    ON casio_attempts (account_id)
    WHERE status = 'in_progress'
  `);
  casioAttemptsReady = true;
}
