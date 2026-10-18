-- Owner-authored analyzer packs (JSON SoT) and per-slug attempts.
-- casio-ss stays on casio_attempts; questions are not rows.

CREATE TABLE IF NOT EXISTS analyzer_packs (
  slug VARCHAR(64) PRIMARY KEY,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  pack JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
);

CREATE UNIQUE INDEX IF NOT EXISTS analyzer_attempts_open_account_slug
  ON analyzer_attempts (account_id, slug)
  WHERE status = 'in_progress';

CREATE INDEX IF NOT EXISTS analyzer_attempts_account_idx
  ON analyzer_attempts (account_id, slug, created_at DESC);
