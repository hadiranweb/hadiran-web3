CREATE TABLE IF NOT EXISTS assessment_authoring_plans (
  listing_id text PRIMARY KEY REFERENCES shop_listings(id) ON DELETE RESTRICT,
  quota_per_period integer NOT NULL CHECK (quota_per_period > 0),
  duration_days integer NOT NULL CHECK (duration_days > 0),
  renewal_policy varchar(24) NOT NULL CHECK (renewal_policy IN ('immediate', 'after_current')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessment_authoring_plan_orders (
  order_id text PRIMARY KEY REFERENCES shop_orders(id) ON DELETE CASCADE,
  listing_id text NOT NULL REFERENCES assessment_authoring_plans(listing_id) ON DELETE RESTRICT,
  quota_snapshot integer NOT NULL CHECK (quota_snapshot > 0),
  duration_days_snapshot integer NOT NULL CHECK (duration_days_snapshot > 0),
  renewal_policy_snapshot varchar(24) NOT NULL CHECK (renewal_policy_snapshot IN ('immediate', 'after_current')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessment_authoring_subscriptions (
  id serial PRIMARY KEY,
  account_id integer NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  listing_id text NOT NULL REFERENCES assessment_authoring_plans(listing_id) ON DELETE RESTRICT,
  order_id text NOT NULL UNIQUE REFERENCES shop_orders(id) ON DELETE RESTRICT,
  quota_total integer NOT NULL CHECK (quota_total > 0),
  quota_used integer NOT NULL DEFAULT 0 CHECK (quota_used >= 0 AND quota_used <= quota_total),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assessment_authoring_subscriptions_account_window_idx
  ON assessment_authoring_subscriptions (account_id, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS assessment_authoring_usage (
  id serial PRIMARY KEY,
  subscription_id integer NOT NULL REFERENCES assessment_authoring_subscriptions(id) ON DELETE RESTRICT,
  account_id integer NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  pack_slug varchar(64) NOT NULL REFERENCES analyzer_packs(slug) ON DELETE RESTRICT,
  event_key varchar(200) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subscription_id, pack_slug)
);

CREATE INDEX IF NOT EXISTS assessment_authoring_usage_account_created_idx
  ON assessment_authoring_usage (account_id, created_at DESC);
