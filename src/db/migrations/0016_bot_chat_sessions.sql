-- Telegram quiz chat: consent before phone. Not a login session.

CREATE TABLE IF NOT EXISTS bot_chat_sessions (
  bot_id VARCHAR(32) NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  telegram_user_id VARCHAR(32) NOT NULL,
  chat_id VARCHAR(32) NOT NULL,
  consented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (bot_id, telegram_user_id)
);

CREATE INDEX IF NOT EXISTS bot_chat_sessions_chat_idx ON bot_chat_sessions (bot_id, chat_id);
