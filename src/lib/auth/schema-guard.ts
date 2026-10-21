import { sql } from "drizzle-orm";
import { db } from "@/db";

let passwordColumnsReady = false;
let profileSchemaReady = false;
let casioAttemptsReady = false;
let analyzerAuthoringReady = false;
let botsReady = false;
let accessReady = false;
let interpretationDocumentsReady = false;

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
    ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS referred_by_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL
  `);
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
  await db.execute(sql`ALTER TABLE casio_attempts ADD COLUMN IF NOT EXISTS results JSONB`);
  await db.execute(sql`
    ALTER TABLE casio_attempts
    ADD COLUMN IF NOT EXISTS referrer_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL
  `);
  await db.execute(sql`ALTER TABLE casio_attempts ADD COLUMN IF NOT EXISTS discount_code VARCHAR(32)`);
  casioAttemptsReady = true;
}

/** Safety net if pre-start skipped 0014. Idempotent. */
export async function ensureAnalyzerAuthoringSchema() {
  if (analyzerAuthoringReady) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS analyzer_packs (
      slug VARCHAR(64) PRIMARY KEY,
      status VARCHAR(16) NOT NULL DEFAULT 'draft',
      pack JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    ALTER TABLE analyzer_packs
    ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES accounts(id) ON DELETE SET NULL
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS analyzer_attempts (
      id SERIAL PRIMARY KEY,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      slug VARCHAR(64) NOT NULL,
      instrument_version VARCHAR(64) NOT NULL,
      consent_at TIMESTAMPTZ,
      answers JSONB NOT NULL DEFAULT '{}'::jsonb,
      results JSONB,
      status VARCHAR(16) NOT NULL DEFAULT 'in_progress',
      submitted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS analyzer_attempts_open_account_slug
    ON analyzer_attempts (account_id, slug)
    WHERE status = 'in_progress'
  `);
  await db.execute(sql`
    ALTER TABLE analyzer_attempts
    ADD COLUMN IF NOT EXISTS referrer_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL
  `);
  await db.execute(sql`ALTER TABLE analyzer_attempts ADD COLUMN IF NOT EXISTS discount_code VARCHAR(32)`);
  analyzerAuthoringReady = true;
}

/** Safety net if pre-start skipped 0015. Idempotent. */
export async function ensureBotsSchema() {
  if (botsReady) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bots (
      id VARCHAR(32) PRIMARY KEY,
      owner_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      channel VARCHAR(16) NOT NULL DEFAULT 'telegram',
      title_fa VARCHAR(128) NOT NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'disconnected',
      analyzer_slug VARCHAR(64),
      telegram_bot_id VARCHAR(32),
      telegram_username VARCHAR(64),
      telegram_first_name VARCHAR(128),
      token_cipher TEXT,
      token_hint VARCHAR(8),
      webhook_secret_cipher TEXT,
      last_error TEXT,
      last_webhook_at TIMESTAMPTZ,
      last_update_kind VARCHAR(32),
      connected_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS bots_owner_idx ON bots (owner_id, created_at DESC)`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bot_chat_sessions (
      bot_id VARCHAR(32) NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
      telegram_user_id VARCHAR(32) NOT NULL,
      chat_id VARCHAR(32) NOT NULL,
      consented_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (bot_id, telegram_user_id)
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS bot_chat_sessions_chat_idx ON bot_chat_sessions (bot_id, chat_id)`);
  await db.execute(sql`
    ALTER TABLE bot_chat_sessions
    ADD COLUMN IF NOT EXISTS awaiting_referral BOOLEAN NOT NULL DEFAULT FALSE
  `);
  await db.execute(sql`ALTER TABLE bots ADD COLUMN IF NOT EXISTS last_inbound_status INTEGER`);
  await db.execute(sql`ALTER TABLE bots ADD COLUMN IF NOT EXISTS telegram_pending_count INTEGER`);
  await db.execute(sql`ALTER TABLE bots ADD COLUMN IF NOT EXISTS telegram_last_error TEXT`);
  await db.execute(sql`ALTER TABLE bot_chat_sessions ADD COLUMN IF NOT EXISTS step VARCHAR(32) NOT NULL DEFAULT 'start'`);
  await db.execute(sql`ALTER TABLE bot_chat_sessions ADD COLUMN IF NOT EXISTS analyzer_slug VARCHAR(64)`);
  await db.execute(sql`ALTER TABLE bot_chat_sessions ADD COLUMN IF NOT EXISTS pending_phone VARCHAR(16)`);
  await db.execute(sql`ALTER TABLE bot_chat_sessions ADD COLUMN IF NOT EXISTS via_contact BOOLEAN NOT NULL DEFAULT FALSE`);
  await db.execute(sql`ALTER TABLE bot_chat_sessions ADD COLUMN IF NOT EXISTS awaiting_discount BOOLEAN NOT NULL DEFAULT FALSE`);
  await db.execute(sql`ALTER TABLE bot_chat_sessions ADD COLUMN IF NOT EXISTS password_link_sent_at TIMESTAMPTZ`);
  await db.execute(sql`ALTER TABLE bots ADD COLUMN IF NOT EXISTS service VARCHAR(32) NOT NULL DEFAULT 'analyzers'`);
  await db.execute(sql`ALTER TABLE bots ADD COLUMN IF NOT EXISTS script JSONB`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS password_setup_tokens (
      id SERIAL PRIMARY KEY,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      token_hash VARCHAR(64) NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  botsReady = true;
}

/** Safety net if pre-start skipped 0017/0018. Idempotent. */
export async function ensureAccessSchema() {
  if (accessReady) return;
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TYPE account_role ADD VALUE 'author';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
  await ensureAccountProfileSchema();
  await ensureAnalyzerAuthoringSchema();
  await ensureCasioAttemptsSchema();
  await ensureBotsSchema();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS analyzer_grants (
      slug VARCHAR(64) NOT NULL REFERENCES analyzer_packs(slug) ON DELETE CASCADE,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      can_edit BOOLEAN NOT NULL DEFAULT TRUE,
      can_read_responses BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (slug, account_id)
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS discount_codes (
      id SERIAL PRIMARY KEY,
      code VARCHAR(32) NOT NULL UNIQUE,
      kind VARCHAR(16) NOT NULL DEFAULT 'percent',
      value INTEGER NOT NULL,
      scope VARCHAR(16) NOT NULL DEFAULT 'any',
      analyzer_slug VARCHAR(64),
      listing_id TEXT,
      max_uses INTEGER,
      used_count INTEGER NOT NULL DEFAULT 0,
      starts_at TIMESTAMPTZ,
      ends_at TIMESTAMPTZ,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_by INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS discount_redemptions (
      id SERIAL PRIMARY KEY,
      discount_id INTEGER NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      source VARCHAR(16) NOT NULL,
      analyzer_slug VARCHAR(64),
      order_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS discount_code VARCHAR(32)`);
  await db.execute(sql`ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0`);
  await db.execute(sql`ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS original_amount INTEGER`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS shop_order_events (
      id SERIAL PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
      actor_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
      actor_role TEXT NOT NULL,
      kind TEXT NOT NULL,
      from_state TEXT,
      to_state TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS shop_order_events_order_time_idx
    ON shop_order_events (order_id, created_at, id)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS shop_orders_settled_time_idx
    ON shop_orders (settled_at, id) WHERE state = 'settled'
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS shop_orders_buyer_created_idx
    ON shop_orders (buyer_id, created_at, id)
  `);
  accessReady = true;
}

/** Safety net if pre-start skipped 0021. Idempotent. */
export async function ensureInterpretationDocumentsSchema() {
  if (interpretationDocumentsReady) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS analyzer_document_templates (
      id VARCHAR(64) PRIMARY KEY,
      title_fa VARCHAR(128) NOT NULL,
      layout_key VARCHAR(64) NOT NULL,
      brand_name_fa VARCHAR(128) NOT NULL DEFAULT 'هادیران',
      chrome JSONB NOT NULL DEFAULT '{}'::jsonb,
      system BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    INSERT INTO analyzer_document_templates (id, title_fa, layout_key, brand_name_fa, system)
    VALUES
      ('hadiran', 'هادیران', 'hadiran', 'هادیران', TRUE),
      ('casio-research', 'پژوهش پنج‌لایه', 'casio-ss', 'کاسیو', TRUE),
      ('casio-ss', 'کاسیو · پنج‌لایه', 'casio-ss', 'کاسیو', TRUE)
    ON CONFLICT (id) DO NOTHING
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS analyzer_reports (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(64) NOT NULL,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      attempt_id INTEGER NOT NULL,
      attempt_kind VARCHAR(16) NOT NULL,
      template_id VARCHAR(64) NOT NULL REFERENCES analyzer_document_templates(id),
      schema_version VARCHAR(16) NOT NULL DEFAULT '1.0',
      instrument_version VARCHAR(64) NOT NULL DEFAULT '',
      cover_title VARCHAR(256) NOT NULL,
      total_score DOUBLE PRECISION,
      total_score_max DOUBLE PRECISION,
      maturity_label VARCHAR(128),
      bottleneck_id VARCHAR(64),
      bottleneck_name VARCHAR(256),
      bottleneck_score DOUBLE PRECISION,
      person_name_snapshot VARCHAR(256),
      business_name_snapshot VARCHAR(256),
      report_date TIMESTAMPTZ,
      closing_fa TEXT,
      context JSONB NOT NULL DEFAULT '[]'::jsonb,
      patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS analyzer_reports_attempt_unique
    ON analyzer_reports (attempt_kind, attempt_id)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS analyzer_reports_account_slug
    ON analyzer_reports (account_id, slug)
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS analyzer_report_layers (
      id SERIAL PRIMARY KEY,
      report_id INTEGER NOT NULL REFERENCES analyzer_reports(id) ON DELETE CASCADE,
      layer_id VARCHAR(64) NOT NULL,
      layer_name VARCHAR(256) NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      score DOUBLE PRECISION,
      score_max DOUBLE PRECISION,
      status VARCHAR(128),
      construct_fa TEXT,
      as_is_text TEXT,
      to_be_text TEXT,
      is_bottleneck BOOLEAN NOT NULL DEFAULT FALSE,
      keywords JSONB NOT NULL DEFAULT '[]'::jsonb
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS analyzer_report_actions (
      id SERIAL PRIMARY KEY,
      report_id INTEGER NOT NULL REFERENCES analyzer_reports(id) ON DELETE CASCADE,
      layer_id VARCHAR(64) NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      action_title TEXT NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS analyzer_document_template_overrides (
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      template_id VARCHAR(64) NOT NULL REFERENCES analyzer_document_templates(id) ON DELETE CASCADE,
      chrome JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (account_id, template_id)
    )
  `);
  await db.execute(sql`
    ALTER TABLE analyzer_reports ADD COLUMN IF NOT EXISTS chrome_snapshot JSONB
  `);
  interpretationDocumentsReady = true;
}

let assessmentLedgerReady = false;

/** Safety net if pre-start skipped 0029. Idempotent. */
export async function ensureAssessmentLedgerSchema() {
  if (assessmentLedgerReady) return;
  await db.execute(sql`ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS product_id VARCHAR(128)`);
  await db.execute(
    sql`ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS issuer_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL`,
  );
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ledger_entries (
      id SERIAL PRIMARY KEY,
      event_key VARCHAR(200) NOT NULL UNIQUE,
      kind VARCHAR(32) NOT NULL,
      source_type VARCHAR(32) NOT NULL,
      source_id VARCHAR(120) NOT NULL,
      description VARCHAR(500) NOT NULL,
      currency VARCHAR(8) NOT NULL DEFAULT 'IRR',
      payload_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ledger_lines (
      id SERIAL PRIMARY KEY,
      entry_id INTEGER NOT NULL REFERENCES ledger_entries(id) ON DELETE CASCADE,
      account VARCHAR(32) NOT NULL,
      party_id INTEGER REFERENCES accounts(id) ON DELETE RESTRICT,
      side VARCHAR(8) NOT NULL,
      amount_irr BIGINT NOT NULL CHECK (amount_irr > 0)
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS ledger_lines_party_account ON ledger_lines (party_id, account)`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS assessment_tariffs (
      id TEXT PRIMARY KEY,
      analyzer_slug VARCHAR(64) NOT NULL,
      service VARCHAR(32) NOT NULL,
      creator_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
      price_irr BIGINT NOT NULL CHECK (price_irr > 0),
      commission_bps INTEGER CHECK (commission_bps IS NULL OR (commission_bps >= 0 AND commission_bps <= 10000)),
      rounding VARCHAR(8),
      version INTEGER NOT NULL DEFAULT 1,
      active BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (analyzer_slug, service, version)
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS assessment_tariffs_one_active
      ON assessment_tariffs (analyzer_slug, service)
      WHERE active = TRUE
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS assessment_orders (
      id TEXT PRIMARY KEY,
      buyer_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      creator_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
      analyzer_slug VARCHAR(64) NOT NULL,
      attempt_kind VARCHAR(16) NOT NULL,
      attempt_id INTEGER NOT NULL,
      service VARCHAR(32) NOT NULL,
      tariff_id TEXT NOT NULL REFERENCES assessment_tariffs(id) ON DELETE RESTRICT,
      tariff_version INTEGER NOT NULL,
      price_irr BIGINT NOT NULL,
      discount_irr BIGINT NOT NULL DEFAULT 0,
      payable_irr BIGINT NOT NULL,
      platform_fee_irr BIGINT NOT NULL,
      author_credit_irr BIGINT NOT NULL,
      author_net_irr BIGINT NOT NULL,
      commission_bps INTEGER NOT NULL,
      rounding VARCHAR(8),
      currency VARCHAR(8) NOT NULL DEFAULT 'IRR',
      state VARCHAR(32) NOT NULL,
      discount_code VARCHAR(32),
      discount_id INTEGER,
      payment_reference TEXT,
      captured_at TIMESTAMPTZ,
      delivered_at TIMESTAMPTZ,
      refunded_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS assessment_orders_open_attempt_service
      ON assessment_orders (buyer_id, attempt_kind, attempt_id, service)
      WHERE state IN ('awaiting_payment_reference', 'awaiting_confirmation', 'captured')
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS assessment_entitlements (
      id SERIAL PRIMARY KEY,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      attempt_kind VARCHAR(16) NOT NULL,
      attempt_id INTEGER NOT NULL,
      service VARCHAR(32) NOT NULL,
      order_id TEXT NOT NULL REFERENCES assessment_orders(id) ON DELETE CASCADE,
      granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (account_id, attempt_kind, attempt_id, service)
    )
  `);
  assessmentLedgerReady = true;
}
