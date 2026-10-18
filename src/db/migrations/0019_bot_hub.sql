-- Hub bot chat + webhook diagnostics. Password setup tokens are not a Telegram login.

ALTER TABLE bots ADD COLUMN IF NOT EXISTS last_inbound_status INTEGER;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS telegram_pending_count INTEGER;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS telegram_last_error TEXT;

ALTER TABLE bot_chat_sessions ADD COLUMN IF NOT EXISTS step VARCHAR(32) NOT NULL DEFAULT 'start';
ALTER TABLE bot_chat_sessions ADD COLUMN IF NOT EXISTS analyzer_slug VARCHAR(64);
ALTER TABLE bot_chat_sessions ADD COLUMN IF NOT EXISTS pending_phone VARCHAR(16);
ALTER TABLE bot_chat_sessions ADD COLUMN IF NOT EXISTS via_contact BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bot_chat_sessions ADD COLUMN IF NOT EXISTS awaiting_discount BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bot_chat_sessions ADD COLUMN IF NOT EXISTS password_link_sent_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS password_setup_tokens (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS password_setup_tokens_account_idx ON password_setup_tokens (account_id, created_at DESC);
