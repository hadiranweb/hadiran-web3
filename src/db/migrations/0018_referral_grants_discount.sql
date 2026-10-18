-- Referral tree, analyzer grants, attempt referrer, discount codes.
-- Does not insert role='author' (that enum value is committed in 0017).

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS referred_by_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS accounts_referred_by_idx ON accounts (referred_by_account_id);

ALTER TABLE analyzer_packs
  ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES accounts(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS analyzer_grants (
  slug VARCHAR(64) NOT NULL REFERENCES analyzer_packs(slug) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  can_edit BOOLEAN NOT NULL DEFAULT TRUE,
  can_read_responses BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (slug, account_id)
);

ALTER TABLE casio_attempts
  ADD COLUMN IF NOT EXISTS referrer_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE casio_attempts
  ADD COLUMN IF NOT EXISTS discount_code VARCHAR(32);

ALTER TABLE analyzer_attempts
  ADD COLUMN IF NOT EXISTS referrer_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE analyzer_attempts
  ADD COLUMN IF NOT EXISTS discount_code VARCHAR(32);

ALTER TABLE bot_chat_sessions
  ADD COLUMN IF NOT EXISTS awaiting_referral BOOLEAN NOT NULL DEFAULT FALSE;

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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT discount_codes_code_format CHECK (code ~ '^[A-Za-z0-9_-]{3,32}$'),
  CONSTRAINT discount_codes_kind_check CHECK (kind IN ('percent', 'amount')),
  CONSTRAINT discount_codes_scope_check CHECK (scope IN ('any', 'analyzer', 'shop'))
);

CREATE TABLE IF NOT EXISTS discount_redemptions (
  id SERIAL PRIMARY KEY,
  discount_id INTEGER NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  source VARCHAR(16) NOT NULL,
  analyzer_slug VARCHAR(64),
  order_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS discount_code VARCHAR(32);
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0;
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS original_amount INTEGER;
