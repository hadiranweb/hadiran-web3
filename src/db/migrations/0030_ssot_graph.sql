-- HADIRAN-SSOT-2.1.0 — the canonical diagnostic graph as relational rows.
-- PostgreSQL is the source of truth. The repository manifest is only the first insert:
-- it seeds the draft once, then never overwrites it again.
--
-- Shape:
--   ssot_* draft tables   = the working copy, editable from /workspace/graph
--   ssot_graph_revision   = frozen, hashed snapshots; the runtime scores from the newest one
--   analyzer_packs.pack   = a compiled projection of a published snapshot (disposable read model)
--
-- Clean break: the two canonical pack rows are cleared so nothing keeps reading the old
-- code-seeded jsonb. Attempts are user data and survive; each carries its own
-- instrument_version, which already marks a report taken on a previous instrument.

-- ── published snapshots ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ssot_graph_revision (
  id SERIAL PRIMARY KEY,
  domain_code VARCHAR(32) NOT NULL,
  revision INTEGER NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  ssot_version VARCHAR(32) NOT NULL,
  coding_version VARCHAR(32) NOT NULL,
  payload_hash CHAR(64) NOT NULL,
  counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  snapshot JSONB,
  note_fa TEXT,
  created_by INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  CONSTRAINT ssot_graph_revision_domain_check CHECK (domain_code IN ('DOM.CASIO_SS', 'DOM.MINDSET_GATE')),
  CONSTRAINT ssot_graph_revision_status_check CHECK (status IN ('draft', 'published', 'retired')),
  CONSTRAINT ssot_graph_revision_published_shape CHECK (
    (status = 'published' AND snapshot IS NOT NULL AND published_at IS NOT NULL)
    OR (status <> 'published')
  ),
  CONSTRAINT ssot_graph_revision_revision_positive CHECK (revision >= 1),
  UNIQUE (domain_code, revision)
);

-- One open draft per domain; publishing freezes it and the next edit opens a new one.
CREATE UNIQUE INDEX IF NOT EXISTS ssot_graph_revision_one_draft
  ON ssot_graph_revision (domain_code)
  WHERE status = 'draft';

CREATE INDEX IF NOT EXISTS ssot_graph_revision_latest_published
  ON ssot_graph_revision (domain_code, revision DESC)
  WHERE status = 'published';

-- ── declared research sources: S001..S055 ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS ssot_source (
  canonical_code VARCHAR(24) PRIMARY KEY,
  legacy_id VARCHAR(24) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  authors TEXT,
  year INTEGER,
  kind VARCHAR(24) NOT NULL DEFAULT 'paper',
  locator TEXT,
  claim_fa TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ssot_source_kind_check CHECK (kind IN ('paper', 'book', 'framework', 'tool', 'report', 'dataset')),
  CONSTRAINT ssot_source_code_check CHECK (canonical_code ~ '^SRC\.S[0-9]{3}$'),
  CONSTRAINT ssot_source_year_check CHECK (year IS NULL OR (year BETWEEN 1800 AND 2200))
);

-- ── ontology concepts lifted from the research vaults ──────────────────────────
CREATE TABLE IF NOT EXISTS ssot_concept (
  canonical_code VARCHAR(40) PRIMARY KEY,
  -- The label the graph authors against. It is not always the display title
  -- ("مدیریت فضای خالی" is titled "مدیریت فضای خالی نمودار سازمانی"), and the ontology resolves
  -- concepts by this key, so storing only label_fa would silently drop those edges on reload.
  legacy_id TEXT NOT NULL UNIQUE,
  label_fa TEXT NOT NULL,
  summary_fa TEXT,
  model VARCHAR(40),
  source_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── solo-org core processes C1..C9 ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ssot_process (
  canonical_code VARCHAR(24) PRIMARY KEY,
  legacy_id VARCHAR(16) NOT NULL UNIQUE,
  label_fa TEXT NOT NULL,
  summary_fa TEXT,
  keyword_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── the five layers (also the prose the report prints) ─────────────────────────
CREATE TABLE IF NOT EXISTS ssot_layer (
  canonical_code VARCHAR(24) PRIMARY KEY,
  legacy_id VARCHAR(32) NOT NULL UNIQUE,
  domain_code VARCHAR(32) NOT NULL,
  layer_no INTEGER NOT NULL,
  yaml_key VARCHAR(48),
  title_fa TEXT NOT NULL,
  construct_fa TEXT,
  as_is_fa TEXT,
  to_be_fa TEXT,
  actions_fa TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ssot_layer_code_check CHECK (canonical_code ~ '^LYR\.L[1-5]$'),
  CONSTRAINT ssot_layer_no_check CHECK (layer_no BETWEEN 1 AND 5)
);

-- ── keywords (15) ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ssot_keyword (
  canonical_code VARCHAR(24) PRIMARY KEY,
  legacy_id VARCHAR(24) NOT NULL,
  domain_code VARCHAR(32) NOT NULL,
  layer_code VARCHAR(24) REFERENCES ssot_layer(canonical_code) ON DELETE SET NULL,
  layer_no INTEGER NOT NULL,
  keyword_no INTEGER NOT NULL,
  label_fa TEXT NOT NULL,
  construct_fa TEXT,
  owner_role_fa TEXT,
  horizon_fa VARCHAR(24),
  why_fa TEXT,
  as_is_weak_fa TEXT,
  as_is_growing_fa TEXT,
  as_is_strong_fa TEXT,
  to_be_fa TEXT,
  action_step_fa TEXT,
  rummler_level VARCHAR(32),
  rummler_need VARCHAR(16),
  rummler_cell_label_fa TEXT,
  nadler_pair_fa TEXT,
  -- Concept references as the layer authored them, kept verbatim. A copy field must survive a
  -- round trip character for character; resolving it to an id and back is what changed the text.
  vault_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  ism_level INTEGER,
  micmac_quadrant VARCHAR(32),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ssot_keyword_code_check CHECK (canonical_code ~ '^KW\.L[1-5]\.K[0-9]+$'),
  CONSTRAINT ssot_keyword_layer_check CHECK (layer_no BETWEEN 1 AND 5),
  CONSTRAINT ssot_keyword_no_check CHECK (keyword_no >= 1),
  CONSTRAINT ssot_keyword_ism_check CHECK (ism_level IS NULL OR ism_level BETWEEN 1 AND 5),
  CONSTRAINT ssot_keyword_rummler_level_check
    CHECK (rummler_level IS NULL OR rummler_level IN ('organization', 'process_whitespace', 'job_performer')),
  CONSTRAINT ssot_keyword_rummler_need_check
    CHECK (rummler_need IS NULL OR rummler_need IN ('goals', 'design', 'management')),
  CONSTRAINT ssot_keyword_micmac_check
    CHECK (micmac_quadrant IS NULL OR micmac_quadrant IN
      ('independent_driver', 'linkage_lever', 'dependent_outcome', 'autonomous'))
);

CREATE UNIQUE INDEX IF NOT EXISTS ssot_keyword_legacy_unique ON ssot_keyword (legacy_id);
CREATE INDEX IF NOT EXISTS ssot_keyword_layer_idx ON ssot_keyword (domain_code, layer_no, sort_order);

-- ── ontology facts per keyword ─────────────────────────────────────────────────
-- Kept apart from `ssot_keyword` on purpose. The engine prefers an ontology assertion over
-- the layer's display copy (a keyword is classified by its Rummler cell and Nadler pair, and
-- those citations are what the source registry is for), so the two must be stored — and
-- edited — as different things rather than merged into whichever was written last.
CREATE TABLE IF NOT EXISTS ssot_keyword_ontology (
  keyword_code VARCHAR(24) PRIMARY KEY REFERENCES ssot_keyword(canonical_code) ON DELETE CASCADE,
  rummler_level VARCHAR(32),
  rummler_need VARCHAR(16),
  rummler_cell_label_fa TEXT,
  nadler_pair_fa TEXT,
  vault_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ssot_keyword_ontology_rummler_level_check
    CHECK (rummler_level IS NULL OR rummler_level IN ('organization', 'process_whitespace', 'job_performer')),
  CONSTRAINT ssot_keyword_ontology_rummler_need_check
    CHECK (rummler_need IS NULL OR rummler_need IN ('goals', 'design', 'management'))
);

-- ── weighted sub-keywords (75) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ssot_sub_keyword (
  canonical_code VARCHAR(32) PRIMARY KEY,
  legacy_id VARCHAR(32) NOT NULL UNIQUE,
  keyword_code VARCHAR(24) NOT NULL REFERENCES ssot_keyword(canonical_code) ON DELETE CASCADE,
  sub_no INTEGER NOT NULL,
  label_fa TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ssot_sub_keyword_code_check CHECK (canonical_code ~ '^SKW\.L[1-5]\.K[0-9]+\.S[0-9]+$'),
  CONSTRAINT ssot_sub_keyword_no_check CHECK (sub_no >= 1)
);

CREATE INDEX IF NOT EXISTS ssot_sub_keyword_keyword_idx ON ssot_sub_keyword (keyword_code, sort_order);

-- ── items (107 across both domains) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ssot_item (
  canonical_code VARCHAR(32) PRIMARY KEY,
  legacy_id VARCHAR(32) NOT NULL,
  axis VARCHAR(8) NOT NULL,
  tier VARCHAR(8) NOT NULL,
  domain_code VARCHAR(32) NOT NULL,
  layer_no INTEGER,
  dimension_code VARCHAR(24),
  section_id VARCHAR(64) NOT NULL,
  section_title_fa TEXT,
  section_intro_fa TEXT,
  text_fa TEXT NOT NULL,
  help_fa TEXT,
  reverse BOOLEAN NOT NULL DEFAULT FALSE,
  kind VARCHAR(16) NOT NULL DEFAULT 'range',
  scale_min INTEGER NOT NULL DEFAULT 0,
  scale_max INTEGER NOT NULL DEFAULT 10,
  critical BOOLEAN NOT NULL DEFAULT FALSE,
  anchors JSONB,
  options JSONB,
  max_length INTEGER,
  routing JSONB,
  source_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ssot_item_axis_check CHECK (axis IN ('CTX', 'ITM')),
  CONSTRAINT ssot_item_tier_check CHECK (tier IN ('BIZ', 'FL', 'SCR', 'DIAG', 'MND')),
  CONSTRAINT ssot_item_kind_check CHECK (kind IN ('range', 'text', 'choice')),
  CONSTRAINT ssot_item_scale_check CHECK (scale_max > scale_min),
  CONSTRAINT ssot_item_layer_check CHECK (layer_no IS NULL OR layer_no BETWEEN 1 AND 5),
  CONSTRAINT ssot_item_code_shape CHECK (canonical_code ~ '^(CTX|ITM)\.[A-Z]{2,4}\.[A-Za-z0-9.]+$')
);

CREATE UNIQUE INDEX IF NOT EXISTS ssot_item_legacy_unique ON ssot_item (legacy_id);
CREATE INDEX IF NOT EXISTS ssot_item_domain_tier_idx ON ssot_item (domain_code, tier, sort_order);

-- ── the many-to-many measurement network ───────────────────────────────────────
-- One table for every undirected loading: item ⇄ keyword, keyword ⇄ sub-keyword,
-- keyword -> layer, dimension -> keyword. Ordering is preserved by sort_order because
-- the compiled weight vectors must match the published instrument exactly.
CREATE TABLE IF NOT EXISTS ssot_graph_edge (
  id SERIAL PRIMARY KEY,
  domain_code VARCHAR(32) NOT NULL,
  edge_kind VARCHAR(24) NOT NULL,
  source_code VARCHAR(32) NOT NULL,
  source_kind VARCHAR(16) NOT NULL,
  target_code VARCHAR(32) NOT NULL,
  target_kind VARCHAR(16) NOT NULL,
  weight NUMERIC(6, 4) NOT NULL DEFAULT 1,
  transform VARCHAR(16) NOT NULL DEFAULT 'identity',
  sort_order INTEGER NOT NULL DEFAULT 0,
  rationale_fa TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ssot_graph_edge_kind_check CHECK (edge_kind IN
    ('item_keyword', 'keyword_sub_keyword', 'sub_keyword_item', 'keyword_layer', 'dimension_keyword')),
  CONSTRAINT ssot_graph_edge_source_kind_check CHECK (source_kind IN ('ITM', 'KW', 'SKW', 'DIM')),
  CONSTRAINT ssot_graph_edge_target_kind_check CHECK (target_kind IN ('KW', 'SKW', 'LAYER', 'ITM')),
  CONSTRAINT ssot_graph_edge_transform_check CHECK (transform IN ('identity', 'reverse')),
  CONSTRAINT ssot_graph_edge_weight_check CHECK (weight >= 0 AND weight <= 10),
  CONSTRAINT ssot_graph_edge_unique UNIQUE (domain_code, edge_kind, source_code, target_code)
);

CREATE INDEX IF NOT EXISTS ssot_graph_edge_target_idx ON ssot_graph_edge (domain_code, edge_kind, target_code);
CREATE INDEX IF NOT EXISTS ssot_graph_edge_source_idx ON ssot_graph_edge (domain_code, edge_kind, source_code, sort_order);

-- ── directed causal graph: influencer -> influenced (DEMATEL / ISM / MICMAC / FCM)
CREATE TABLE IF NOT EXISTS ssot_causal_edge (
  id SERIAL PRIMARY KEY,
  edge_key VARCHAR(80) NOT NULL UNIQUE,
  domain_code VARCHAR(32) NOT NULL DEFAULT 'DOM.CASIO_SS',
  from_code VARCHAR(24) NOT NULL REFERENCES ssot_keyword(canonical_code) ON DELETE CASCADE,
  to_code VARCHAR(24) NOT NULL REFERENCES ssot_keyword(canonical_code) ON DELETE CASCADE,
  weight NUMERIC(6, 4) NOT NULL,
  edge_type VARCHAR(24) NOT NULL,
  ism_level INTEGER,
  mechanism_fa TEXT,
  source_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ssot_causal_edge_weight_check CHECK (weight > 0 AND weight <= 1),
  CONSTRAINT ssot_causal_edge_type_check
    CHECK (edge_type IN ('prerequisite', 'cybernetic_feedback', 'reinforcing')),
  CONSTRAINT ssot_causal_edge_not_self CHECK (from_code <> to_code),
  CONSTRAINT ssot_causal_edge_ism_check CHECK (ism_level IS NULL OR ism_level BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS ssot_causal_edge_from_idx ON ssot_causal_edge (from_code);
CREATE INDEX IF NOT EXISTS ssot_causal_edge_to_idx ON ssot_causal_edge (to_code);

-- ── context modulation tensor as rows: size x type weights ─────────────────────
CREATE TABLE IF NOT EXISTS ssot_context_rule (
  id SERIAL PRIMARY KEY,
  rule_kind VARCHAR(16) NOT NULL,
  context_code VARCHAR(24) NOT NULL,
  target_code VARCHAR(24) NOT NULL REFERENCES ssot_keyword(canonical_code) ON DELETE CASCADE,
  factor NUMERIC(6, 4) NOT NULL,
  note_fa TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ssot_context_rule_kind_check CHECK (rule_kind IN ('size', 'type')),
  CONSTRAINT ssot_context_rule_factor_check CHECK (factor >= 0 AND factor <= 4),
  CONSTRAINT ssot_context_rule_unique UNIQUE (rule_kind, context_code, target_code)
);

CREATE INDEX IF NOT EXISTS ssot_context_rule_target_idx ON ssot_context_rule (target_code);

-- ── append-only audit journal ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ssot_graph_audit (
  id BIGSERIAL PRIMARY KEY,
  domain_code VARCHAR(32) NOT NULL,
  action VARCHAR(32) NOT NULL,
  entity VARCHAR(32) NOT NULL,
  entity_code TEXT,
  actor_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  actor_role TEXT,
  diff JSONB,
  payload_hash CHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ssot_graph_audit_domain_idx ON ssot_graph_audit (domain_code, created_at DESC, id DESC);

CREATE OR REPLACE FUNCTION ssot_audit_is_append_only()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'ssot_graph_audit is append-only: % is forbidden', TG_OP;
END;
$$;

DROP TRIGGER IF EXISTS ssot_graph_audit_no_mutation ON ssot_graph_audit;
CREATE TRIGGER ssot_graph_audit_no_mutation
  BEFORE UPDATE OR DELETE ON ssot_graph_audit
  FOR EACH ROW EXECUTE FUNCTION ssot_audit_is_append_only();

-- A published snapshot is the record of what a respondent was scored against.
-- UPDATE/DELETE of a frozen revision is refused in the database, not in the app.
CREATE OR REPLACE FUNCTION ssot_revision_is_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.status = 'published' THEN
    RAISE EXCEPTION 'published ssot revision % is immutable', OLD.revision;
  END IF;
  IF OLD.status = 'published' THEN
    RAISE EXCEPTION 'published ssot revision % is immutable', OLD.revision;
  END IF;
  IF NEW.status = 'published' AND NEW.snapshot IS NULL THEN
    RAISE EXCEPTION 'publishing an ssot revision requires a frozen snapshot';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ssot_graph_revision_no_republish ON ssot_graph_revision;
CREATE TRIGGER ssot_graph_revision_no_republish
  BEFORE UPDATE OR DELETE ON ssot_graph_revision
  FOR EACH ROW EXECUTE FUNCTION ssot_revision_is_immutable();

-- The two canonical rows were code-seeded projections. Clear them: publishing rewrites
-- them from the graph tables, so the database keeps the only authoritative copy.
DELETE FROM analyzer_packs WHERE slug IN ('casio-ss', 'mindset-gate');
