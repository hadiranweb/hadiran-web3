-- Parallel canonical knowledge layer (knowledge-base-transfer-v0.1).
-- Does not drop existing world tables.

ALTER TABLE knowledge ADD COLUMN IF NOT EXISTS memory_item_id VARCHAR(64);

CREATE TABLE IF NOT EXISTS semantic_records (
  id TEXT PRIMARY KEY,
  record_type TEXT NOT NULL DEFAULT 'semantic_record',
  kind TEXT NOT NULL DEFAULT 'observation',
  title_fa VARCHAR(256) NOT NULL,
  title_en VARCHAR(256),
  slug VARCHAR(128),
  status TEXT NOT NULL DEFAULT 'captured',
  visibility TEXT NOT NULL DEFAULT 'private',
  intent TEXT,
  summary_fa TEXT,
  body_fa TEXT,
  language TEXT NOT NULL DEFAULT 'fa',
  owner_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  promoted_memory_id TEXT,
  schema_version TEXT NOT NULL DEFAULT '0.1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS semantic_records_owner_idx
  ON semantic_records (owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS knowledge_claims (
  id TEXT PRIMARY KEY,
  record_type TEXT NOT NULL DEFAULT 'knowledge_claim',
  subject TEXT,
  predicate TEXT NOT NULL DEFAULT 'asserts',
  object_value TEXT,
  statement_fa TEXT,
  statement_en TEXT,
  lifecycle TEXT NOT NULL DEFAULT 'candidate',
  confidence TEXT NOT NULL DEFAULT 'hypothesis',
  source_record_id TEXT REFERENCES semantic_records(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_reviews (
  id TEXT PRIMARY KEY,
  record_type TEXT NOT NULL DEFAULT 'knowledge_review',
  claim_id TEXT REFERENCES knowledge_claims(id) ON DELETE SET NULL,
  reviewer_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  decision TEXT NOT NULL DEFAULT 'approve',
  rationale_fa TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memory_items (
  id TEXT PRIMARY KEY,
  record_type TEXT NOT NULL DEFAULT 'memory_item',
  kind TEXT NOT NULL DEFAULT 'validated_pattern',
  title_fa VARCHAR(256) NOT NULL,
  title_en VARCHAR(256),
  summary_fa TEXT,
  body_fa TEXT,
  lifecycle TEXT NOT NULL DEFAULT 'approved',
  visibility TEXT NOT NULL DEFAULT 'public',
  confidence TEXT NOT NULL DEFAULT 'validated',
  source_claim_id TEXT REFERENCES knowledge_claims(id) ON DELETE SET NULL,
  source_record_id TEXT REFERENCES semantic_records(id) ON DELETE SET NULL,
  promotion_id TEXT,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_promotions (
  id TEXT PRIMARY KEY,
  record_type TEXT NOT NULL DEFAULT 'knowledge_promotion',
  claim_id TEXT REFERENCES knowledge_claims(id) ON DELETE SET NULL,
  review_id TEXT REFERENCES knowledge_reviews(id) ON DELETE SET NULL,
  target_memory_id TEXT REFERENCES memory_items(id) ON DELETE SET NULL,
  target_kind TEXT NOT NULL DEFAULT 'validated_pattern',
  promoted_by INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  rationale_fa TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS graph_edges (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  edge_class TEXT NOT NULL DEFAULT 'publication',
  status TEXT NOT NULL DEFAULT 'active',
  confidence TEXT NOT NULL DEFAULT 'validated',
  created_by INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS graph_edges_source_idx ON graph_edges (source_type, source_id);
CREATE INDEX IF NOT EXISTS graph_edges_target_idx ON graph_edges (target_type, target_id);

CREATE TABLE IF NOT EXISTS evidence_sources (
  id TEXT PRIMARY KEY,
  record_type TEXT NOT NULL DEFAULT 'evidence_source',
  source_type TEXT NOT NULL DEFAULT 'human_input',
  source_id TEXT,
  title_fa TEXT,
  locator TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provenance_records (
  id TEXT PRIMARY KEY,
  record_type TEXT NOT NULL DEFAULT 'provenance_record',
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'human_input',
  actor_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  transformation TEXT,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  schema_version TEXT NOT NULL DEFAULT '0.1'
);

DO $$ BEGIN
  ALTER TABLE knowledge
    ADD CONSTRAINT knowledge_memory_item_id_fkey
    FOREIGN KEY (memory_item_id) REFERENCES memory_items(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS knowledge_memory_item_idx ON knowledge (memory_item_id);

DO $$ BEGIN
  ALTER TABLE semantic_records
    ADD CONSTRAINT semantic_records_promoted_memory_id_fkey
    FOREIGN KEY (promoted_memory_id) REFERENCES memory_items(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
