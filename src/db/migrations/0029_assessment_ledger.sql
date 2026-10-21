ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS product_id VARCHAR(128);
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS issuer_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL;

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
);

CREATE TABLE IF NOT EXISTS ledger_lines (
  id SERIAL PRIMARY KEY,
  entry_id INTEGER NOT NULL REFERENCES ledger_entries(id) ON DELETE CASCADE,
  account VARCHAR(32) NOT NULL,
  party_id INTEGER REFERENCES accounts(id) ON DELETE RESTRICT,
  side VARCHAR(8) NOT NULL,
  amount_irr BIGINT NOT NULL CHECK (amount_irr > 0)
);

CREATE INDEX IF NOT EXISTS ledger_lines_party_account ON ledger_lines (party_id, account);

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
);

CREATE UNIQUE INDEX IF NOT EXISTS assessment_tariffs_one_active
  ON assessment_tariffs (analyzer_slug, service)
  WHERE active = TRUE;

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
);

CREATE UNIQUE INDEX IF NOT EXISTS assessment_orders_open_attempt_service
  ON assessment_orders (buyer_id, attempt_kind, attempt_id, service)
  WHERE state IN ('awaiting_payment_reference', 'awaiting_confirmation', 'captured');

CREATE TABLE IF NOT EXISTS assessment_entitlements (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  attempt_kind VARCHAR(16) NOT NULL,
  attempt_id INTEGER NOT NULL,
  service VARCHAR(32) NOT NULL,
  order_id TEXT NOT NULL REFERENCES assessment_orders(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, attempt_kind, attempt_id, service)
);
