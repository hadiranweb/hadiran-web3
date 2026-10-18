-- Owner-connected bots (Telegram first). Not a login channel. Tokens are cipher text.

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
);

CREATE INDEX IF NOT EXISTS bots_owner_idx ON bots (owner_id, created_at DESC);
