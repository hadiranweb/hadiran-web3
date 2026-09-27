-- Out-of-band shop: listings, orders, payout snapshot, entitlements.
-- Single seller = owner. No PSP, no fee ledger.

CREATE TABLE IF NOT EXISTS shop_payout_destinations (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  account_handle TEXT NOT NULL,
  account_alias TEXT,
  updated_by INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_listings (
  id TEXT PRIMARY KEY,
  slug VARCHAR(128) NOT NULL UNIQUE,
  title_fa VARCHAR(256) NOT NULL,
  title_en VARCHAR(256),
  summary_fa TEXT,
  body_fa TEXT,
  access_body_fa TEXT,
  kind TEXT NOT NULL DEFAULT 'digital_entitlement',
  amount INTEGER NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'IRR',
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shop_listings_published_idx ON shop_listings (published, created_at DESC);

CREATE TABLE IF NOT EXISTS shop_orders (
  id TEXT PRIMARY KEY,
  buyer_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES shop_listings(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'IRR',
  state TEXT NOT NULL DEFAULT 'awaiting_payment_reference',
  payment_reference TEXT,
  decline_reason TEXT,
  payout_handle_snapshot TEXT,
  payout_alias_snapshot TEXT,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shop_orders_buyer_idx ON shop_orders (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS shop_orders_state_idx ON shop_orders (state, updated_at DESC);
CREATE INDEX IF NOT EXISTS shop_orders_listing_idx ON shop_orders (listing_id);

CREATE TABLE IF NOT EXISTS shop_entitlements (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES shop_listings(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (account_id, listing_id)
);

CREATE INDEX IF NOT EXISTS shop_entitlements_account_idx ON shop_entitlements (account_id);
