-- Casio-ss attempt store: answers JSON, one in-progress per account.
-- Scoring/PDF tables are not this cut.

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
);

CREATE UNIQUE INDEX IF NOT EXISTS casio_attempts_open_account
  ON casio_attempts (account_id)
  WHERE status = 'in_progress';

CREATE INDEX IF NOT EXISTS casio_attempts_account_idx
  ON casio_attempts (account_id, created_at DESC);
