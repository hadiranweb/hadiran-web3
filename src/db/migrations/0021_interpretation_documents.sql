CREATE TABLE IF NOT EXISTS analyzer_document_templates (
  id VARCHAR(64) PRIMARY KEY,
  title_fa VARCHAR(128) NOT NULL,
  layout_key VARCHAR(64) NOT NULL,
  brand_name_fa VARCHAR(128) NOT NULL DEFAULT 'هادیران',
  chrome JSONB NOT NULL DEFAULT '{}'::jsonb,
  system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO analyzer_document_templates (id, title_fa, layout_key, brand_name_fa, system)
VALUES
  ('hadiran', 'هادیران', 'hadiran', 'هادیران', TRUE),
  ('casio-research', 'پژوهش پنج‌لایه', 'casio-research', 'هادیران', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS analyzer_reports (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(64) NOT NULL,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  attempt_id INTEGER NOT NULL,
  attempt_kind VARCHAR(16) NOT NULL,
  template_id VARCHAR(64) NOT NULL REFERENCES analyzer_document_templates(id),
  schema_version VARCHAR(16) NOT NULL DEFAULT '1.0',
  instrument_version VARCHAR(64) NOT NULL DEFAULT '',
  cover_title VARCHAR(256) NOT NULL,
  total_score DOUBLE PRECISION,
  total_score_max DOUBLE PRECISION,
  maturity_label VARCHAR(128),
  bottleneck_id VARCHAR(64),
  bottleneck_name VARCHAR(256),
  bottleneck_score DOUBLE PRECISION,
  person_name_snapshot VARCHAR(256),
  business_name_snapshot VARCHAR(256),
  report_date TIMESTAMPTZ,
  closing_fa TEXT,
  context JSONB NOT NULL DEFAULT '[]'::jsonb,
  patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS analyzer_reports_attempt_unique
  ON analyzer_reports (attempt_kind, attempt_id);

CREATE INDEX IF NOT EXISTS analyzer_reports_account_slug
  ON analyzer_reports (account_id, slug);

CREATE TABLE IF NOT EXISTS analyzer_report_layers (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL REFERENCES analyzer_reports(id) ON DELETE CASCADE,
  layer_id VARCHAR(64) NOT NULL,
  layer_name VARCHAR(256) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  score DOUBLE PRECISION,
  score_max DOUBLE PRECISION,
  status VARCHAR(128),
  construct_fa TEXT,
  as_is_text TEXT,
  to_be_text TEXT,
  is_bottleneck BOOLEAN NOT NULL DEFAULT FALSE,
  keywords JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS analyzer_report_actions (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL REFERENCES analyzer_reports(id) ON DELETE CASCADE,
  layer_id VARCHAR(64) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  action_title TEXT NOT NULL
);
