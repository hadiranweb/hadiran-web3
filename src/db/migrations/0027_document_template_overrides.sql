CREATE TABLE IF NOT EXISTS analyzer_document_template_overrides (
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  template_id VARCHAR(64) NOT NULL REFERENCES analyzer_document_templates(id) ON DELETE CASCADE,
  chrome JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (account_id, template_id)
);

ALTER TABLE analyzer_reports ADD COLUMN IF NOT EXISTS chrome_snapshot JSONB;
