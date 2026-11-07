-- Relational, versioned authoring for generic analyzers.
-- The existing analyzer_packs.pack JSONB is retained as a compatibility projection
-- and bounded legacy/unmigrated fallback while relational reads/writes are rolled out.

CREATE TABLE analyzer_pack_versions (
  id SERIAL PRIMARY KEY,
  pack_slug VARCHAR(64) NOT NULL REFERENCES analyzer_packs(slug) ON DELETE CASCADE,
  version VARCHAR(64) NOT NULL,
  lifecycle_state VARCHAR(16) NOT NULL DEFAULT 'draft',
  name_fa VARCHAR(120) NOT NULL,
  summary_fa TEXT NOT NULL DEFAULT '',
  scale_config JSONB NOT NULL DEFAULT '{"kind":"range-0-10","min":0,"max":10}'::jsonb,
  consent_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  bot_display_config JSONB,
  created_by INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  CONSTRAINT analyzer_pack_versions_lifecycle_check
    CHECK (lifecycle_state IN ('draft', 'published')),
  CONSTRAINT analyzer_pack_versions_published_at_check
    CHECK (
      (lifecycle_state = 'draft' AND published_at IS NULL)
      OR (lifecycle_state = 'published' AND published_at IS NOT NULL)
    ),
  CONSTRAINT analyzer_pack_versions_pack_version_unique UNIQUE (pack_slug, version),
  CONSTRAINT analyzer_pack_versions_pack_id_unique UNIQUE (pack_slug, id)
);

CREATE UNIQUE INDEX analyzer_pack_versions_one_draft_per_pack_idx
  ON analyzer_pack_versions (pack_slug)
  WHERE lifecycle_state = 'draft';
CREATE INDEX analyzer_pack_versions_pack_created_idx
  ON analyzer_pack_versions (pack_slug, created_at DESC);

-- One explicit pointer to the version currently served to public test takers.
CREATE TABLE analyzer_pack_releases (
  pack_slug VARCHAR(64) PRIMARY KEY REFERENCES analyzer_packs(slug) ON DELETE CASCADE,
  version_id INTEGER NOT NULL UNIQUE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT analyzer_pack_releases_version_fk
    FOREIGN KEY (pack_slug, version_id)
    REFERENCES analyzer_pack_versions(pack_slug, id) ON DELETE RESTRICT
);

CREATE TABLE analyzer_pack_sections (
  version_id INTEGER NOT NULL REFERENCES analyzer_pack_versions(id) ON DELETE CASCADE,
  section_id VARCHAR(64) NOT NULL,
  title_fa VARCHAR(120) NOT NULL,
  intro_fa VARCHAR(500),
  role VARCHAR(24),
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (version_id, section_id),
  CONSTRAINT analyzer_pack_sections_role_check
    CHECK (role IS NULL OR role IN ('core', 'gate', 'context'))
);

CREATE TABLE analyzer_pack_questions (
  version_id INTEGER NOT NULL,
  question_id VARCHAR(64) NOT NULL,
  section_id VARCHAR(64) NOT NULL,
  kind VARCHAR(16) NOT NULL,
  prompt_fa VARCHAR(500) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  reverse BOOLEAN NOT NULL DEFAULT FALSE,
  min_value DOUBLE PRECISION,
  max_value DOUBLE PRECISION,
  max_length INTEGER,
  anchors JSONB NOT NULL DEFAULT '{}'::jsonb,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (version_id, question_id),
  CONSTRAINT analyzer_pack_questions_section_fk
    FOREIGN KEY (version_id, section_id)
    REFERENCES analyzer_pack_sections(version_id, section_id) ON DELETE CASCADE,
  CONSTRAINT analyzer_pack_questions_kind_check
    CHECK (kind IN ('range', 'text', 'choice')),
  CONSTRAINT analyzer_pack_questions_shape_check CHECK (
    (kind = 'range' AND min_value IS NOT NULL AND max_value IS NOT NULL AND max_value > min_value AND max_length IS NULL)
    OR (kind = 'text' AND min_value IS NULL AND max_value IS NULL AND max_length BETWEEN 8 AND 500)
    OR (kind = 'choice' AND min_value IS NULL AND max_value IS NULL AND max_length IS NULL)
  ),
  CONSTRAINT analyzer_pack_questions_finite_check CHECK (
    (min_value IS NULL OR (min_value > '-Infinity'::double precision AND min_value < 'Infinity'::double precision))
    AND (max_value IS NULL OR (max_value > '-Infinity'::double precision AND max_value < 'Infinity'::double precision))
  )
);
CREATE INDEX analyzer_pack_questions_section_order_idx
  ON analyzer_pack_questions (version_id, section_id, sort_order);

CREATE TABLE analyzer_pack_choice_options (
  version_id INTEGER NOT NULL,
  question_id VARCHAR(64) NOT NULL,
  value VARCHAR(64) NOT NULL,
  label VARCHAR(120) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (version_id, question_id, value),
  CONSTRAINT analyzer_pack_choice_options_question_fk
    FOREIGN KEY (version_id, question_id)
    REFERENCES analyzer_pack_questions(version_id, question_id) ON DELETE CASCADE
);

CREATE TABLE analyzer_pack_parameters (
  version_id INTEGER NOT NULL REFERENCES analyzer_pack_versions(id) ON DELETE CASCADE,
  parameter_id VARCHAR(64) NOT NULL,
  label_fa VARCHAR(160) NOT NULL,
  value_kind VARCHAR(16) NOT NULL DEFAULT 'numeric',
  min_value DOUBLE PRECISION,
  max_value DOUBLE PRECISION,
  unit VARCHAR(64),
  sort_order INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (version_id, parameter_id),
  CONSTRAINT analyzer_pack_parameters_value_kind_check
    CHECK (value_kind IN ('numeric', 'category', 'reference', 'boolean', 'text')),
  CONSTRAINT analyzer_pack_parameters_bounds_check
    CHECK (min_value IS NULL OR max_value IS NULL OR min_value <= max_value),
  CONSTRAINT analyzer_pack_parameters_finite_check CHECK (
    (min_value IS NULL OR (min_value > '-Infinity'::double precision AND min_value < 'Infinity'::double precision))
    AND (max_value IS NULL OR (max_value > '-Infinity'::double precision AND max_value < 'Infinity'::double precision))
  )
);

CREATE TABLE analyzer_pack_response_rules (
  version_id INTEGER NOT NULL,
  question_id VARCHAR(64) NOT NULL,
  rule_id VARCHAR(64) NOT NULL,
  match_kind VARCHAR(20) NOT NULL,
  option_value VARCHAR(64),
  exact_value TEXT,
  range_min DOUBLE PRECISION,
  range_max DOUBLE PRECISION,
  min_inclusive BOOLEAN NOT NULL DEFAULT TRUE,
  max_inclusive BOOLEAN NOT NULL DEFAULT TRUE,
  label_fa VARCHAR(160),
  sort_order INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (version_id, question_id, rule_id),
  CONSTRAINT analyzer_pack_response_rules_question_fk
    FOREIGN KEY (version_id, question_id)
    REFERENCES analyzer_pack_questions(version_id, question_id) ON DELETE CASCADE,
  CONSTRAINT analyzer_pack_response_rules_option_fk
    FOREIGN KEY (version_id, question_id, option_value)
    REFERENCES analyzer_pack_choice_options(version_id, question_id, value) ON DELETE CASCADE,
  CONSTRAINT analyzer_pack_response_rules_match_kind_check
    CHECK (match_kind IN ('option', 'numeric_range', 'exact_value', 'fallback')),
  CONSTRAINT analyzer_pack_response_rules_shape_check CHECK (
    (match_kind = 'option' AND option_value IS NOT NULL AND exact_value IS NULL AND range_min IS NULL AND range_max IS NULL)
    OR (match_kind = 'numeric_range' AND option_value IS NULL AND exact_value IS NULL AND (range_min IS NOT NULL OR range_max IS NOT NULL) AND (range_min IS NULL OR range_max IS NULL OR range_min < range_max))
    OR (match_kind = 'exact_value' AND option_value IS NULL AND exact_value IS NOT NULL AND range_min IS NULL AND range_max IS NULL)
    OR (match_kind = 'fallback' AND option_value IS NULL AND exact_value IS NULL AND range_min IS NULL AND range_max IS NULL)
  ),
  CONSTRAINT analyzer_pack_response_rules_finite_check CHECK (
    (range_min IS NULL OR (range_min > '-Infinity'::double precision AND range_min < 'Infinity'::double precision))
    AND (range_max IS NULL OR (range_max > '-Infinity'::double precision AND range_max < 'Infinity'::double precision))
  )
);
CREATE INDEX analyzer_pack_response_rules_question_order_idx
  ON analyzer_pack_response_rules (version_id, question_id, sort_order);

CREATE TABLE analyzer_pack_response_effects (
  version_id INTEGER NOT NULL,
  effect_id VARCHAR(64) NOT NULL,
  question_id VARCHAR(64) NOT NULL,
  rule_id VARCHAR(64),
  parameter_id VARCHAR(64) NOT NULL,
  operation VARCHAR(24) NOT NULL,
  -- JSONB value is restricted to scalar number/string/boolean by CHECK below.
  value JSONB,
  coefficient DOUBLE PRECISION,
  sort_order INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (version_id, effect_id),
  CONSTRAINT analyzer_pack_response_effects_question_fk
    FOREIGN KEY (version_id, question_id)
    REFERENCES analyzer_pack_questions(version_id, question_id) ON DELETE CASCADE,
  CONSTRAINT analyzer_pack_response_effects_rule_fk
    FOREIGN KEY (version_id, question_id, rule_id)
    REFERENCES analyzer_pack_response_rules(version_id, question_id, rule_id) ON DELETE CASCADE,
  CONSTRAINT analyzer_pack_response_effects_parameter_fk
    FOREIGN KEY (version_id, parameter_id)
    REFERENCES analyzer_pack_parameters(version_id, parameter_id) ON DELETE RESTRICT,
  CONSTRAINT analyzer_pack_response_effects_operation_check
    CHECK (operation IN ('identity', 'reverse', 'set_value', 'add', 'multiply', 'weighted_value')),
  CONSTRAINT analyzer_pack_response_effects_value_check CHECK (
    (operation IN ('identity', 'reverse') AND value IS NULL AND coefficient IS NULL)
    OR (operation = 'set_value' AND value IS NOT NULL AND jsonb_typeof(value) IN ('number', 'string', 'boolean') AND coefficient IS NULL)
    OR (operation = 'add' AND value IS NOT NULL AND jsonb_typeof(value) = 'number' AND coefficient IS NULL)
    OR (operation IN ('multiply', 'weighted_value') AND value IS NULL AND coefficient IS NOT NULL)
  ),
  CONSTRAINT analyzer_pack_response_effects_coefficient_finite_check
    CHECK (coefficient IS NULL OR (coefficient > '-Infinity'::double precision AND coefficient < 'Infinity'::double precision))
);
CREATE INDEX analyzer_pack_response_effects_question_idx
  ON analyzer_pack_response_effects (version_id, question_id, rule_id, sort_order);
CREATE INDEX analyzer_pack_response_effects_parameter_idx
  ON analyzer_pack_response_effects (version_id, parameter_id);

CREATE TABLE analyzer_pack_formulas (
  version_id INTEGER NOT NULL,
  formula_id VARCHAR(64) NOT NULL,
  output_parameter_id VARCHAR(64) NOT NULL,
  operation VARCHAR(24) NOT NULL,
  divisor DOUBLE PRECISION,
  sort_order INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (version_id, formula_id),
  CONSTRAINT analyzer_pack_formulas_output_parameter_fk
    FOREIGN KEY (version_id, output_parameter_id)
    REFERENCES analyzer_pack_parameters(version_id, parameter_id) ON DELETE RESTRICT,
  CONSTRAINT analyzer_pack_formulas_operation_check
    CHECK (operation IN ('reverse', 'mean', 'sum', 'sum_div', 'weighted_sum', 'argmin', 'band', 'cap_if', 'matmul')),
  CONSTRAINT analyzer_pack_formulas_divisor_check
    CHECK ((operation = 'sum_div' AND divisor IS NOT NULL AND divisor <> 0) OR (operation <> 'sum_div')),
  CONSTRAINT analyzer_pack_formulas_divisor_finite_check
    CHECK (divisor IS NULL OR (divisor > '-Infinity'::double precision AND divisor < 'Infinity'::double precision))
);

CREATE TABLE analyzer_pack_formula_inputs (
  version_id INTEGER NOT NULL,
  formula_id VARCHAR(64) NOT NULL,
  input_kind VARCHAR(16) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  source_kind VARCHAR(16) NOT NULL,
  question_ref VARCHAR(64),
  parameter_ref VARCHAR(64),
  dimension_parameter_id VARCHAR(64),
  weight DOUBLE PRECISION,
  PRIMARY KEY (version_id, formula_id, input_kind, sort_order),
  CONSTRAINT analyzer_pack_formula_inputs_formula_fk
    FOREIGN KEY (version_id, formula_id)
    REFERENCES analyzer_pack_formulas(version_id, formula_id) ON DELETE CASCADE,
  CONSTRAINT analyzer_pack_formula_inputs_question_fk
    FOREIGN KEY (version_id, question_ref)
    REFERENCES analyzer_pack_questions(version_id, question_id) ON DELETE RESTRICT,
  CONSTRAINT analyzer_pack_formula_inputs_parameter_fk
    FOREIGN KEY (version_id, parameter_ref)
    REFERENCES analyzer_pack_parameters(version_id, parameter_id) ON DELETE RESTRICT,
  CONSTRAINT analyzer_pack_formula_inputs_dimension_fk
    FOREIGN KEY (version_id, dimension_parameter_id)
    REFERENCES analyzer_pack_parameters(version_id, parameter_id) ON DELETE RESTRICT,
  CONSTRAINT analyzer_pack_formula_inputs_kind_check
    CHECK (input_kind IN ('of', 'weighted', 'watch')),
  CONSTRAINT analyzer_pack_formula_inputs_source_check CHECK (
    (source_kind = 'question' AND question_ref IS NOT NULL AND parameter_ref IS NULL)
    OR (source_kind = 'parameter' AND question_ref IS NULL AND parameter_ref IS NOT NULL)
  ),
  CONSTRAINT analyzer_pack_formula_inputs_role_check CHECK (
    (input_kind = 'weighted' AND weight IS NOT NULL)
    OR (input_kind IN ('of', 'watch') AND weight IS NULL AND dimension_parameter_id IS NULL)
  ),
  CONSTRAINT analyzer_pack_formula_inputs_watch_check
    CHECK (input_kind <> 'watch' OR source_kind = 'question'),
  CONSTRAINT analyzer_pack_formula_inputs_weight_finite_check
    CHECK (weight IS NULL OR (weight > '-Infinity'::double precision AND weight < 'Infinity'::double precision))
);

CREATE TABLE analyzer_pack_formula_bands (
  version_id INTEGER NOT NULL,
  formula_id VARCHAR(64) NOT NULL,
  band_id VARCHAR(64) NOT NULL,
  label_fa VARCHAR(160) NOT NULL,
  gte_value DOUBLE PRECISION,
  lt_value DOUBLE PRECISION,
  lte_value DOUBLE PRECISION,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (version_id, formula_id, band_id),
  CONSTRAINT analyzer_pack_formula_bands_formula_fk
    FOREIGN KEY (version_id, formula_id)
    REFERENCES analyzer_pack_formulas(version_id, formula_id) ON DELETE CASCADE,
  CONSTRAINT analyzer_pack_formula_bands_bounds_check CHECK (
    (gte_value IS NULL OR lt_value IS NULL OR gte_value < lt_value)
    AND (gte_value IS NULL OR lte_value IS NULL OR gte_value <= lte_value)
    AND (lt_value IS NULL OR lte_value IS NULL OR lt_value <= lte_value)
  ),
  CONSTRAINT analyzer_pack_formula_bands_finite_check CHECK (
    (gte_value IS NULL OR (gte_value > '-Infinity'::double precision AND gte_value < 'Infinity'::double precision))
    AND (lt_value IS NULL OR (lt_value > '-Infinity'::double precision AND lt_value < 'Infinity'::double precision))
    AND (lte_value IS NULL OR (lte_value > '-Infinity'::double precision AND lte_value < 'Infinity'::double precision))
  )
);

CREATE TABLE analyzer_pack_formula_rules (
  version_id INTEGER NOT NULL,
  formula_id VARCHAR(64) NOT NULL,
  rule_kind VARCHAR(16) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  threshold_lte DOUBLE PRECISION NOT NULL,
  set_value VARCHAR(64),
  from_value VARCHAR(64),
  to_value VARCHAR(64),
  PRIMARY KEY (version_id, formula_id, rule_kind, sort_order),
  CONSTRAINT analyzer_pack_formula_rules_formula_fk
    FOREIGN KEY (version_id, formula_id)
    REFERENCES analyzer_pack_formulas(version_id, formula_id) ON DELETE CASCADE,
  CONSTRAINT analyzer_pack_formula_rules_kind_check CHECK (
    (rule_kind = 'cap' AND set_value IS NOT NULL AND from_value IS NULL AND to_value IS NULL)
    OR (rule_kind = 'demote' AND set_value IS NULL AND from_value IS NOT NULL AND to_value IS NOT NULL)
  ),
  CONSTRAINT analyzer_pack_formula_rules_threshold_finite_check
    CHECK (threshold_lte > '-Infinity'::double precision AND threshold_lte < 'Infinity'::double precision)
);

CREATE TABLE analyzer_pack_findings (
  version_id INTEGER NOT NULL REFERENCES analyzer_pack_versions(id) ON DELETE CASCADE,
  finding_id VARCHAR(64) NOT NULL,
  title_fa VARCHAR(120) NOT NULL,
  kind VARCHAR(16) NOT NULL,
  parent_finding_id VARCHAR(64),
  construct_fa VARCHAR(400),
  as_is_fa VARCHAR(400),
  to_be_fa VARCHAR(400),
  actions_fa VARCHAR(400),
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (version_id, finding_id),
  CONSTRAINT analyzer_pack_findings_parent_fk
    FOREIGN KEY (version_id, parent_finding_id)
    REFERENCES analyzer_pack_findings(version_id, finding_id) ON DELETE RESTRICT,
  CONSTRAINT analyzer_pack_findings_kind_check
    CHECK (kind IN ('group', 'dimension', 'layer', 'symptom')),
  CONSTRAINT analyzer_pack_findings_not_self_parent_check
    CHECK (parent_finding_id IS NULL OR parent_finding_id <> finding_id)
);

CREATE TABLE analyzer_pack_keywords (
  version_id INTEGER NOT NULL REFERENCES analyzer_pack_versions(id) ON DELETE CASCADE,
  keyword_id VARCHAR(64) NOT NULL,
  label_fa VARCHAR(160) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (version_id, keyword_id)
);

CREATE TABLE analyzer_pack_keyword_children (
  version_id INTEGER NOT NULL,
  keyword_id VARCHAR(64) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  label_fa VARCHAR(160) NOT NULL,
  PRIMARY KEY (version_id, keyword_id, sort_order),
  CONSTRAINT analyzer_pack_keyword_children_keyword_fk
    FOREIGN KEY (version_id, keyword_id)
    REFERENCES analyzer_pack_keywords(version_id, keyword_id) ON DELETE CASCADE
);

CREATE TABLE analyzer_pack_edges (
  id SERIAL PRIMARY KEY,
  version_id INTEGER NOT NULL,
  source_kind VARCHAR(20) NOT NULL,
  source_question_id VARCHAR(64),
  source_parameter_id VARCHAR(64),
  source_keyword_id VARCHAR(64),
  source_finding_id VARCHAR(64),
  target_kind VARCHAR(20) NOT NULL,
  target_parameter_id VARCHAR(64),
  target_keyword_id VARCHAR(64),
  target_finding_id VARCHAR(64),
  weight DOUBLE PRECISION NOT NULL DEFAULT 1,
  transform VARCHAR(16) NOT NULL DEFAULT 'identity',
  sort_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT analyzer_pack_edges_source_question_fk
    FOREIGN KEY (version_id, source_question_id)
    REFERENCES analyzer_pack_questions(version_id, question_id) ON DELETE CASCADE,
  CONSTRAINT analyzer_pack_edges_source_parameter_fk
    FOREIGN KEY (version_id, source_parameter_id)
    REFERENCES analyzer_pack_parameters(version_id, parameter_id) ON DELETE CASCADE,
  CONSTRAINT analyzer_pack_edges_source_keyword_fk
    FOREIGN KEY (version_id, source_keyword_id)
    REFERENCES analyzer_pack_keywords(version_id, keyword_id) ON DELETE CASCADE,
  CONSTRAINT analyzer_pack_edges_source_finding_fk
    FOREIGN KEY (version_id, source_finding_id)
    REFERENCES analyzer_pack_findings(version_id, finding_id) ON DELETE CASCADE,
  CONSTRAINT analyzer_pack_edges_parameter_fk
    FOREIGN KEY (version_id, target_parameter_id)
    REFERENCES analyzer_pack_parameters(version_id, parameter_id) ON DELETE RESTRICT,
  CONSTRAINT analyzer_pack_edges_keyword_fk
    FOREIGN KEY (version_id, target_keyword_id)
    REFERENCES analyzer_pack_keywords(version_id, keyword_id) ON DELETE RESTRICT,
  CONSTRAINT analyzer_pack_edges_finding_fk
    FOREIGN KEY (version_id, target_finding_id)
    REFERENCES analyzer_pack_findings(version_id, finding_id) ON DELETE RESTRICT,
  CONSTRAINT analyzer_pack_edges_source_check CHECK (
    (source_kind = 'question' AND source_question_id IS NOT NULL AND source_parameter_id IS NULL AND source_keyword_id IS NULL AND source_finding_id IS NULL)
    OR (source_kind = 'parameter' AND source_question_id IS NULL AND source_parameter_id IS NOT NULL AND source_keyword_id IS NULL AND source_finding_id IS NULL)
    OR (source_kind = 'keyword' AND source_question_id IS NULL AND source_parameter_id IS NULL AND source_keyword_id IS NOT NULL AND source_finding_id IS NULL)
    OR (source_kind = 'finding' AND source_question_id IS NULL AND source_parameter_id IS NULL AND source_keyword_id IS NULL AND source_finding_id IS NOT NULL)
  ),
  CONSTRAINT analyzer_pack_edges_target_check CHECK (
    (target_kind = 'parameter' AND target_parameter_id IS NOT NULL AND target_keyword_id IS NULL AND target_finding_id IS NULL)
    OR (target_kind = 'keyword' AND target_keyword_id IS NOT NULL AND target_parameter_id IS NULL AND target_finding_id IS NULL)
    OR (target_kind = 'finding' AND target_finding_id IS NOT NULL AND target_parameter_id IS NULL AND target_keyword_id IS NULL)
  ),
  CONSTRAINT analyzer_pack_edges_transform_check CHECK (transform IN ('identity', 'reverse')),
  CONSTRAINT analyzer_pack_edges_weight_check
    CHECK (weight > 0 AND weight > '-Infinity'::double precision AND weight < 'Infinity'::double precision)
);
CREATE INDEX analyzer_pack_edges_source_question_idx ON analyzer_pack_edges (version_id, source_question_id, sort_order);
CREATE INDEX analyzer_pack_edges_source_parameter_idx ON analyzer_pack_edges (version_id, source_parameter_id, sort_order);
CREATE INDEX analyzer_pack_edges_source_keyword_idx ON analyzer_pack_edges (version_id, source_keyword_id, sort_order);
CREATE INDEX analyzer_pack_edges_source_finding_idx ON analyzer_pack_edges (version_id, source_finding_id, sort_order);
CREATE INDEX analyzer_pack_edges_parameter_idx ON analyzer_pack_edges (version_id, target_parameter_id);
CREATE INDEX analyzer_pack_edges_keyword_idx ON analyzer_pack_edges (version_id, target_keyword_id);

CREATE TABLE analyzer_pack_report_configs (
  version_id INTEGER PRIMARY KEY REFERENCES analyzer_pack_versions(id) ON DELETE CASCADE,
  hide_gate_scores BOOLEAN,
  interpretation_version VARCHAR(64),
  closing_fa VARCHAR(400),
  user_summary_template_fa TEXT,
  document_template_id VARCHAR(64),
  business_name_question_id VARCHAR(64),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT analyzer_pack_report_configs_business_question_fk
    FOREIGN KEY (version_id, business_name_question_id)
    REFERENCES analyzer_pack_questions(version_id, question_id) ON DELETE RESTRICT
);

CREATE TABLE analyzer_pack_report_context_fields (
  version_id INTEGER NOT NULL,
  field_id VARCHAR(64) NOT NULL,
  question_id VARCHAR(64) NOT NULL,
  label_fa VARCHAR(80) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (version_id, field_id),
  CONSTRAINT analyzer_pack_report_context_question_fk
    FOREIGN KEY (version_id, question_id)
    REFERENCES analyzer_pack_questions(version_id, question_id) ON DELETE RESTRICT
);

CREATE TABLE analyzer_pack_report_layer_bands (
  version_id INTEGER NOT NULL REFERENCES analyzer_pack_versions(id) ON DELETE CASCADE,
  band_id VARCHAR(64) NOT NULL,
  parameter_id VARCHAR(64),
  label_fa VARCHAR(80) NOT NULL,
  meaning_fa VARCHAR(400) NOT NULL DEFAULT '',
  min_value DOUBLE PRECISION NOT NULL,
  max_value DOUBLE PRECISION NOT NULL,
  max_inclusive BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (version_id, band_id),
  CONSTRAINT analyzer_pack_report_layer_bands_parameter_fk
    FOREIGN KEY (version_id, parameter_id)
    REFERENCES analyzer_pack_parameters(version_id, parameter_id) ON DELETE RESTRICT,
  CONSTRAINT analyzer_pack_report_layer_bands_range_check
    CHECK (min_value <= max_value),
  CONSTRAINT analyzer_pack_report_layer_bands_finite_check CHECK (
    min_value > '-Infinity'::double precision AND min_value < 'Infinity'::double precision
    AND max_value > '-Infinity'::double precision AND max_value < 'Infinity'::double precision
  )
);

CREATE TABLE analyzer_pack_report_cross_patterns (
  version_id INTEGER NOT NULL REFERENCES analyzer_pack_versions(id) ON DELETE CASCADE,
  pattern_id VARCHAR(64) NOT NULL,
  meaning_fa VARCHAR(400) NOT NULL,
  action_fa VARCHAR(400) NOT NULL DEFAULT '',
  strong_parameter_id VARCHAR(64),
  weak_parameter_id VARCHAR(64),
  also_weak_parameter_id VARCHAR(64),
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (version_id, pattern_id),
  CONSTRAINT analyzer_pack_report_pattern_strong_fk
    FOREIGN KEY (version_id, strong_parameter_id)
    REFERENCES analyzer_pack_parameters(version_id, parameter_id) ON DELETE RESTRICT,
  CONSTRAINT analyzer_pack_report_pattern_weak_fk
    FOREIGN KEY (version_id, weak_parameter_id)
    REFERENCES analyzer_pack_parameters(version_id, parameter_id) ON DELETE RESTRICT,
  CONSTRAINT analyzer_pack_report_pattern_also_weak_fk
    FOREIGN KEY (version_id, also_weak_parameter_id)
    REFERENCES analyzer_pack_parameters(version_id, parameter_id) ON DELETE RESTRICT
);

CREATE TABLE analyzer_pack_report_pattern_parameters (
  version_id INTEGER NOT NULL,
  pattern_id VARCHAR(64) NOT NULL,
  parameter_id VARCHAR(64) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (version_id, pattern_id, sort_order),
  CONSTRAINT analyzer_pack_report_pattern_parameters_pattern_fk
    FOREIGN KEY (version_id, pattern_id)
    REFERENCES analyzer_pack_report_cross_patterns(version_id, pattern_id) ON DELETE CASCADE,
  CONSTRAINT analyzer_pack_report_pattern_parameters_parameter_fk
    FOREIGN KEY (version_id, parameter_id)
    REFERENCES analyzer_pack_parameters(version_id, parameter_id) ON DELETE RESTRICT
);

CREATE TABLE analyzer_pack_authoring_issues (
  id SERIAL PRIMARY KEY,
  version_id INTEGER NOT NULL REFERENCES analyzer_pack_versions(id) ON DELETE CASCADE,
  component VARCHAR(32) NOT NULL,
  entity_id VARCHAR(256) NOT NULL,
  issue_code VARCHAR(64) NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT analyzer_pack_authoring_issues_unique
    UNIQUE (version_id, component, entity_id, issue_code)
);
CREATE INDEX analyzer_pack_authoring_issues_version_idx
  ON analyzer_pack_authoring_issues (version_id, component);

-- Add nullable version references first. Legacy history without a matching stored
-- pack version remains intact and is deliberately not assigned a guessed version.
ALTER TABLE analyzer_attempts ADD COLUMN pack_version_id INTEGER;
ALTER TABLE analyzer_reports ADD COLUMN pack_version_id INTEGER;
ALTER TABLE analyzer_reports ADD COLUMN report_config_snapshot JSONB;

-- One initial relational version per current JSON pack. Rows are made draft first so
-- all child data can be backfilled before any published-version guard is installed.
INSERT INTO analyzer_pack_versions (
  pack_slug, version, lifecycle_state, name_fa, summary_fa,
  scale_config, consent_config, bot_display_config, created_by, created_at
)
SELECT
  p.slug,
  LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64),
  'draft',
  LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'nameFa'), ''), p.slug), 120),
  COALESCE(p.pack ->> 'summaryFa', ''),
  COALESCE(p.pack -> 'scale', '{"kind":"range-0-10","min":0,"max":10}'::jsonb),
  COALESCE(p.pack -> 'consent', '{}'::jsonb),
  p.pack -> 'botDisplay',
  p.created_by,
  COALESCE(p.created_at, NOW())
FROM analyzer_packs p
WHERE jsonb_typeof(p.pack) = 'object'
ON CONFLICT (pack_slug, version) DO NOTHING;

-- Sections.
INSERT INTO analyzer_pack_sections (version_id, section_id, title_fa, intro_fa, role, sort_order)
SELECT
  v.id,
  section_doc ->> 'id',
  LEFT(section_doc ->> 'titleFa', 120),
  LEFT(section_doc ->> 'introFa', 500),
  CASE WHEN section_doc ->> 'role' IN ('core', 'gate', 'context') THEN section_doc ->> 'role' ELSE NULL END,
  (section_ord - 1)::INTEGER
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'sections') = 'array' THEN p.pack -> 'sections' ELSE '[]'::jsonb END
) WITH ORDINALITY AS section_rows(section_doc, section_ord)
WHERE NULLIF(section_doc ->> 'id', '') IS NOT NULL
  AND NULLIF(section_doc ->> 'titleFa', '') IS NOT NULL
ON CONFLICT (version_id, section_id) DO NOTHING;

-- Questions and their answer-kind-specific fields. The old scale is retained per
-- question as min/max; text and option data remain in dedicated fields/tables.
INSERT INTO analyzer_pack_questions (
  version_id, question_id, section_id, kind, prompt_fa, sort_order,
  required, reverse, min_value, max_value, max_length, anchors, config
)
SELECT
  v.id,
  item_doc ->> 'id',
  section_doc ->> 'id',
  item_doc ->> 'kind',
  LEFT(item_doc ->> 'text', 500),
  (item_ord - 1)::INTEGER,
  TRUE,
  COALESCE((item_doc ->> 'reverse')::BOOLEAN, FALSE),
  CASE
    WHEN item_doc ->> 'kind' = 'range' AND (v.scale_config ->> 'min') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
      THEN (v.scale_config ->> 'min')::DOUBLE PRECISION
    WHEN item_doc ->> 'kind' = 'range' THEN 0::DOUBLE PRECISION
    ELSE NULL
  END,
  CASE
    WHEN item_doc ->> 'kind' = 'range' AND (v.scale_config ->> 'max') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
      THEN (v.scale_config ->> 'max')::DOUBLE PRECISION
    WHEN item_doc ->> 'kind' = 'range' THEN 10::DOUBLE PRECISION
    ELSE NULL
  END,
  CASE
    WHEN item_doc ->> 'kind' = 'text' AND (item_doc ->> 'maxLength') ~ '^[0-9]+$'
      THEN LEAST(GREATEST((item_doc ->> 'maxLength')::INTEGER, 8), 500)
    WHEN item_doc ->> 'kind' = 'text' THEN 128
    ELSE NULL
  END,
  CASE WHEN item_doc ->> 'kind' = 'range' THEN COALESCE(item_doc -> 'anchors', '{}'::jsonb) ELSE '{}'::jsonb END,
  item_doc - 'id' - 'kind' - 'text' - 'reverse' - 'anchors' - 'maxLength' - 'options'
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'sections') = 'array' THEN p.pack -> 'sections' ELSE '[]'::jsonb END
) WITH ORDINALITY AS section_rows(section_doc, section_ord)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(section_doc -> 'items') = 'array' THEN section_doc -> 'items' ELSE '[]'::jsonb END
) WITH ORDINALITY AS item_rows(item_doc, item_ord)
JOIN analyzer_pack_sections s
  ON s.version_id = v.id
 AND s.section_id = section_doc ->> 'id'
WHERE item_doc ->> 'kind' IN ('range', 'text', 'choice')
  AND NULLIF(item_doc ->> 'id', '') IS NOT NULL
  AND NULLIF(item_doc ->> 'text', '') IS NOT NULL
ON CONFLICT (version_id, question_id) DO NOTHING;

-- Choice options.
INSERT INTO analyzer_pack_choice_options (version_id, question_id, value, label, sort_order)
SELECT
  v.id,
  item_doc ->> 'id',
  LEFT(regexp_replace(BTRIM(option_doc ->> 'value'), '[[:space:]]+', ' ', 'g'), 64),
  LEFT(regexp_replace(BTRIM(option_doc ->> 'label'), '[[:space:]]+', ' ', 'g'), 120),
  (option_ord - 1)::INTEGER
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'sections') = 'array' THEN p.pack -> 'sections' ELSE '[]'::jsonb END
) AS section_rows(section_doc)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(section_doc -> 'items') = 'array' THEN section_doc -> 'items' ELSE '[]'::jsonb END
) AS item_rows(item_doc)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(item_doc -> 'options') = 'array' THEN item_doc -> 'options' ELSE '[]'::jsonb END
) WITH ORDINALITY AS option_rows(option_doc, option_ord)
JOIN analyzer_pack_questions q
  ON q.version_id = v.id
 AND q.question_id = item_doc ->> 'id'
 AND q.kind = 'choice'
WHERE jsonb_typeof(option_doc -> 'value') = 'string'
  AND jsonb_typeof(option_doc -> 'label') = 'string'
  AND NULLIF(BTRIM(option_doc ->> 'value'), '') IS NOT NULL
  AND NULLIF(BTRIM(option_doc ->> 'label'), '') IS NOT NULL
ON CONFLICT (version_id, question_id, value) DO NOTHING;

-- Interpretive findings stay separate from score parameters.
INSERT INTO analyzer_pack_findings (
  version_id, finding_id, title_fa, kind, parent_finding_id,
  construct_fa, as_is_fa, to_be_fa, actions_fa, sort_order
)
SELECT
  v.id,
  finding_doc ->> 'id',
  LEFT(finding_doc ->> 'titleFa', 120),
  finding_doc ->> 'kind',
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(p.pack -> 'findings') = 'array' THEN p.pack -> 'findings' ELSE '[]'::jsonb END
      ) parent_doc
      WHERE parent_doc ->> 'id' = finding_doc ->> 'parentId'
    ) THEN finding_doc ->> 'parentId'
    ELSE NULL
  END,
  LEFT(finding_doc ->> 'constructFa', 400),
  LEFT(finding_doc ->> 'asIsFa', 400),
  LEFT(finding_doc ->> 'toBeFa', 400),
  LEFT(finding_doc ->> 'actionsFa', 400),
  (finding_ord - 1)::INTEGER
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'findings') = 'array' THEN p.pack -> 'findings' ELSE '[]'::jsonb END
) WITH ORDINALITY AS finding_rows(finding_doc, finding_ord)
WHERE finding_doc ->> 'kind' IN ('group', 'dimension', 'layer', 'symptom')
  AND NULLIF(finding_doc ->> 'id', '') IS NOT NULL
  AND NULLIF(finding_doc ->> 'titleFa', '') IS NOT NULL
ON CONFLICT (version_id, finding_id) DO NOTHING;

-- Keywords and their ordered child labels.
INSERT INTO analyzer_pack_keywords (version_id, keyword_id, label_fa, sort_order)
SELECT v.id, keyword_doc ->> 'id', LEFT(keyword_doc ->> 'labelFa', 160), (keyword_ord - 1)::INTEGER
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'keywords') = 'array' THEN p.pack -> 'keywords' ELSE '[]'::jsonb END
) WITH ORDINALITY AS keyword_rows(keyword_doc, keyword_ord)
WHERE NULLIF(keyword_doc ->> 'id', '') IS NOT NULL
  AND NULLIF(keyword_doc ->> 'labelFa', '') IS NOT NULL
ON CONFLICT (version_id, keyword_id) DO NOTHING;

INSERT INTO analyzer_pack_keyword_children (version_id, keyword_id, sort_order, label_fa)
SELECT v.id, keyword_doc ->> 'id', (child_ord - 1)::INTEGER, LEFT(child_label, 160)
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'keywords') = 'array' THEN p.pack -> 'keywords' ELSE '[]'::jsonb END
) AS keyword_rows(keyword_doc)
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE WHEN jsonb_typeof(keyword_doc -> 'children') = 'array' THEN keyword_doc -> 'children' ELSE '[]'::jsonb END
) WITH ORDINALITY AS child_rows(child_label, child_ord)
JOIN analyzer_pack_keywords k
  ON k.version_id = v.id
 AND k.keyword_id = keyword_doc ->> 'id'
WHERE NULLIF(BTRIM(child_label), '') IS NOT NULL
ON CONFLICT (version_id, keyword_id, sort_order) DO NOTHING;

-- Explicit author-authored parameters take precedence over inferred formula outputs.
INSERT INTO analyzer_pack_parameters (
  version_id, parameter_id, label_fa, value_kind, min_value, max_value, unit, sort_order, config
)
SELECT
  v.id,
  BTRIM(parameter_doc ->> 'id'),
  regexp_replace(BTRIM(parameter_doc ->> 'labelFa'), '[[:space:]]+', ' ', 'g'),
  CASE WHEN parameter_doc ->> 'valueKind' IN ('numeric', 'category', 'reference', 'boolean', 'text')
    THEN parameter_doc ->> 'valueKind' ELSE 'numeric' END,
  CASE WHEN jsonb_typeof(parameter_doc -> 'minValue') = 'number'
    THEN CASE WHEN (parameter_doc ->> 'minValue')::NUMERIC BETWEEN -1.7976931348623157e308::NUMERIC AND 1.7976931348623157e308::NUMERIC
      THEN (parameter_doc ->> 'minValue')::DOUBLE PRECISION ELSE NULL END
    ELSE NULL END,
  CASE WHEN jsonb_typeof(parameter_doc -> 'maxValue') = 'number'
    THEN CASE WHEN (parameter_doc ->> 'maxValue')::NUMERIC BETWEEN -1.7976931348623157e308::NUMERIC AND 1.7976931348623157e308::NUMERIC
      THEN (parameter_doc ->> 'maxValue')::DOUBLE PRECISION ELSE NULL END
    ELSE NULL END,
  CASE WHEN jsonb_typeof(parameter_doc -> 'unit') = 'string'
        AND length(regexp_replace(BTRIM(parameter_doc ->> 'unit'), '[[:space:]]+', ' ', 'g')) BETWEEN 1 AND 64
    THEN regexp_replace(BTRIM(parameter_doc ->> 'unit'), '[[:space:]]+', ' ', 'g') ELSE NULL END,
  (parameter_ord - 1)::INTEGER,
  CASE WHEN jsonb_typeof(parameter_doc -> 'config') = 'object' THEN parameter_doc -> 'config' ELSE '{}'::jsonb END
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'parameters') = 'array' THEN p.pack -> 'parameters' ELSE '[]'::jsonb END
) WITH ORDINALITY AS parameter_rows(parameter_doc, parameter_ord)
WHERE jsonb_typeof(parameter_doc -> 'id') = 'string'
  AND jsonb_typeof(parameter_doc -> 'labelFa') = 'string'
  AND BTRIM(COALESCE(parameter_doc ->> 'id', '')) ~ '^[A-Za-z][A-Za-z0-9._-]{0,63}$'
  AND length(regexp_replace(BTRIM(COALESCE(parameter_doc ->> 'labelFa', '')), '[[:space:]]+', ' ', 'g')) BETWEEN 1 AND 160
  AND (parameter_doc ->> 'valueKind' IS NULL OR parameter_doc ->> 'valueKind' IN ('numeric', 'category', 'reference', 'boolean', 'text'))
  AND (
    COALESCE(parameter_doc ->> 'valueKind', 'numeric') = 'numeric'
    OR (jsonb_typeof(parameter_doc -> 'minValue') IS DISTINCT FROM 'number'
        AND jsonb_typeof(parameter_doc -> 'maxValue') IS DISTINCT FROM 'number')
  )
  AND CASE
    WHEN jsonb_typeof(parameter_doc -> 'minValue') = 'number' AND jsonb_typeof(parameter_doc -> 'maxValue') = 'number'
      THEN (parameter_doc ->> 'minValue')::NUMERIC <= (parameter_doc ->> 'maxValue')::NUMERIC
    ELSE TRUE
  END
ON CONFLICT (version_id, parameter_id) DO NOTHING;

-- Numeric/category/reference outputs are first-class score parameters. A matching
-- Finding row is only a label source; it does not turn the Finding into a score.
INSERT INTO analyzer_pack_parameters (version_id, parameter_id, label_fa, value_kind, sort_order)
SELECT
  v.id,
  formula_doc ->> 'id',
  LEFT(COALESCE(
    (SELECT fd ->> 'titleFa'
     FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.pack -> 'findings') = 'array' THEN p.pack -> 'findings' ELSE '[]'::jsonb END) fd
     WHERE fd ->> 'id' = formula_doc ->> 'id' LIMIT 1),
    (SELECT sd ->> 'titleFa'
     FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.pack -> 'sections') = 'array' THEN p.pack -> 'sections' ELSE '[]'::jsonb END) sd
     WHERE sd ->> 'id' = formula_doc ->> 'id' LIMIT 1),
    formula_doc ->> 'id'
  ), 160),
  CASE formula_doc ->> 'op'
    WHEN 'band' THEN 'category'
    WHEN 'argmin' THEN 'reference'
    WHEN 'cap_if' THEN 'category'
    ELSE 'numeric'
  END,
  (formula_ord - 1)::INTEGER
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'formulas') = 'array' THEN p.pack -> 'formulas' ELSE '[]'::jsonb END
) WITH ORDINALITY AS formula_rows(formula_doc, formula_ord)
WHERE formula_doc ->> 'op' IN ('reverse', 'mean', 'sum', 'sum_div', 'weighted_sum', 'argmin', 'band', 'cap_if', 'matmul')
  AND NULLIF(formula_doc ->> 'id', '') IS NOT NULL
ON CONFLICT (version_id, parameter_id) DO NOTHING;

-- A legacy edge targeting a scored section represents a dimension parameter.
INSERT INTO analyzer_pack_parameters (version_id, parameter_id, label_fa, value_kind, sort_order)
SELECT DISTINCT v.id, s.section_id, LEFT(s.title_fa, 160), 'numeric', s.sort_order
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
JOIN analyzer_pack_sections s ON s.version_id = v.id
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.pack -> 'edges') = 'array' THEN p.pack -> 'edges' ELSE '[]'::jsonb END) edge_doc
  WHERE edge_doc ->> 'to' = s.section_id
)
ON CONFLICT (version_id, parameter_id) DO NOTHING;

-- Dimensions used by a legacy matmul formula are also named score parameters.
INSERT INTO analyzer_pack_parameters (version_id, parameter_id, label_fa, value_kind, sort_order)
SELECT DISTINCT v.id, weight_doc ->> 'dimension', LEFT(weight_doc ->> 'dimension', 160), 'numeric', 0
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'formulas') = 'array' THEN p.pack -> 'formulas' ELSE '[]'::jsonb END
) AS formula_rows(formula_doc)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(formula_doc -> 'weights') = 'array' THEN formula_doc -> 'weights' ELSE '[]'::jsonb END
) AS weight_rows(weight_doc)
WHERE NULLIF(weight_doc ->> 'dimension', '') IS NOT NULL
ON CONFLICT (version_id, parameter_id) DO NOTHING;

-- A legacy response effect may introduce a parameter not otherwise referenced by a formula or edge.
INSERT INTO analyzer_pack_parameters (version_id, parameter_id, label_fa, value_kind, sort_order)
SELECT DISTINCT
  v.id,
  BTRIM(effect_doc ->> 'parameterId'),
  LEFT(COALESCE(finding_row.title_fa, section_row.title_fa, BTRIM(effect_doc ->> 'parameterId')), 160),
  CASE
    WHEN effect_doc ->> 'operation' = 'set_value' AND jsonb_typeof(effect_doc -> 'value') = 'boolean' THEN 'boolean'
    WHEN effect_doc ->> 'operation' = 'set_value' AND jsonb_typeof(effect_doc -> 'value') = 'string' THEN 'category'
    WHEN effect_doc ->> 'operation' = 'identity' AND question_row.kind = 'choice' THEN 'category'
    WHEN effect_doc ->> 'operation' = 'identity' AND question_row.kind = 'text' THEN 'text'
    ELSE 'numeric'
  END,
  0
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'responseEffects') = 'array' THEN p.pack -> 'responseEffects' ELSE '[]'::jsonb END
) AS effect_rows(effect_doc)
JOIN analyzer_pack_questions question_row
  ON question_row.version_id = v.id AND question_row.question_id = BTRIM(effect_doc ->> 'questionId')
LEFT JOIN analyzer_pack_findings finding_row
  ON finding_row.version_id = v.id AND finding_row.finding_id = BTRIM(effect_doc ->> 'parameterId')
LEFT JOIN analyzer_pack_sections section_row
  ON section_row.version_id = v.id AND section_row.section_id = BTRIM(effect_doc ->> 'parameterId')
WHERE BTRIM(COALESCE(effect_doc ->> 'parameterId', '')) ~ '^[A-Za-z][A-Za-z0-9._-]{0,63}$'
ON CONFLICT (version_id, parameter_id) DO NOTHING;

-- Response rules are backfilled only when their question-specific match shape is valid.
INSERT INTO analyzer_pack_response_rules (
  version_id, question_id, rule_id, match_kind, option_value, exact_value,
  range_min, range_max, min_inclusive, max_inclusive, label_fa, sort_order, config
)
SELECT
  v.id,
  q.question_id,
  BTRIM(rule_doc ->> 'id'),
  rule_doc ->> 'matchKind',
  CASE WHEN rule_doc ->> 'matchKind' = 'option' AND jsonb_typeof(rule_doc -> 'optionValue') = 'string'
    THEN regexp_replace(BTRIM(rule_doc ->> 'optionValue'), '[[:space:]]+', ' ', 'g') ELSE NULL END,
  CASE WHEN rule_doc ->> 'matchKind' = 'exact_value' AND jsonb_typeof(rule_doc -> 'exactValue') = 'string'
    THEN LEFT(regexp_replace(BTRIM(rule_doc ->> 'exactValue'), '[[:space:]]+', ' ', 'g'), 500) ELSE NULL END,
  CASE WHEN rule_doc ->> 'matchKind' = 'numeric_range' AND jsonb_typeof(rule_doc -> 'rangeMin') = 'number'
    THEN CASE WHEN (rule_doc ->> 'rangeMin')::NUMERIC BETWEEN 0 AND 10 THEN (rule_doc ->> 'rangeMin')::DOUBLE PRECISION ELSE NULL END
    ELSE NULL END,
  CASE WHEN rule_doc ->> 'matchKind' = 'numeric_range' AND jsonb_typeof(rule_doc -> 'rangeMax') = 'number'
    THEN CASE WHEN (rule_doc ->> 'rangeMax')::NUMERIC BETWEEN 0 AND 10 THEN (rule_doc ->> 'rangeMax')::DOUBLE PRECISION ELSE NULL END
    ELSE NULL END,
  CASE WHEN jsonb_typeof(rule_doc -> 'minInclusive') = 'boolean' THEN (rule_doc ->> 'minInclusive')::BOOLEAN ELSE TRUE END,
  CASE WHEN jsonb_typeof(rule_doc -> 'maxInclusive') = 'boolean' THEN (rule_doc ->> 'maxInclusive')::BOOLEAN ELSE TRUE END,
  CASE WHEN jsonb_typeof(rule_doc -> 'labelFa') = 'string'
        AND length(regexp_replace(BTRIM(rule_doc ->> 'labelFa'), '[[:space:]]+', ' ', 'g')) BETWEEN 1 AND 160
    THEN regexp_replace(BTRIM(rule_doc ->> 'labelFa'), '[[:space:]]+', ' ', 'g') ELSE NULL END,
  (rule_ord - 1)::INTEGER,
  CASE WHEN jsonb_typeof(rule_doc -> 'config') = 'object' THEN rule_doc -> 'config' ELSE '{}'::jsonb END
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'responseRules') = 'array' THEN p.pack -> 'responseRules' ELSE '[]'::jsonb END
) WITH ORDINALITY AS rule_rows(rule_doc, rule_ord)
JOIN analyzer_pack_questions q
  ON q.version_id = v.id AND q.question_id = BTRIM(rule_doc ->> 'questionId')
LEFT JOIN analyzer_pack_choice_options option_row
  ON option_row.version_id = v.id
 AND option_row.question_id = q.question_id
 AND option_row.value = CASE WHEN rule_doc ->> 'matchKind' = 'exact_value'
   THEN regexp_replace(BTRIM(rule_doc ->> 'exactValue'), '[[:space:]]+', ' ', 'g')
   ELSE regexp_replace(BTRIM(rule_doc ->> 'optionValue'), '[[:space:]]+', ' ', 'g') END
WHERE jsonb_typeof(rule_doc -> 'id') = 'string'
  AND jsonb_typeof(rule_doc -> 'questionId') = 'string'
  AND BTRIM(COALESCE(rule_doc ->> 'id', '')) ~ '^[A-Za-z][A-Za-z0-9._-]{0,63}$'
  AND rule_doc ->> 'matchKind' IN ('option', 'numeric_range', 'exact_value', 'fallback')
  AND CASE rule_doc ->> 'matchKind'
    WHEN 'option' THEN q.kind = 'choice'
      AND jsonb_typeof(rule_doc -> 'optionValue') = 'string'
      AND length(regexp_replace(BTRIM(COALESCE(rule_doc ->> 'optionValue', '')), '[[:space:]]+', ' ', 'g')) BETWEEN 1 AND 64
      AND option_row.value IS NOT NULL
      AND COALESCE(jsonb_typeof(rule_doc -> 'exactValue'), 'null') = 'null'
      AND COALESCE(jsonb_typeof(rule_doc -> 'rangeMin'), 'null') = 'null'
      AND COALESCE(jsonb_typeof(rule_doc -> 'rangeMax'), 'null') = 'null'
    WHEN 'numeric_range' THEN q.kind = 'range'
      AND (jsonb_typeof(rule_doc -> 'rangeMin') = 'number' OR jsonb_typeof(rule_doc -> 'rangeMax') = 'number')
      AND (COALESCE(jsonb_typeof(rule_doc -> 'rangeMin'), 'null') = 'null' OR CASE WHEN jsonb_typeof(rule_doc -> 'rangeMin') = 'number' THEN (rule_doc ->> 'rangeMin')::NUMERIC BETWEEN 0 AND 10 ELSE FALSE END)
      AND (COALESCE(jsonb_typeof(rule_doc -> 'rangeMax'), 'null') = 'null' OR CASE WHEN jsonb_typeof(rule_doc -> 'rangeMax') = 'number' THEN (rule_doc ->> 'rangeMax')::NUMERIC BETWEEN 0 AND 10 ELSE FALSE END)
      AND CASE WHEN jsonb_typeof(rule_doc -> 'rangeMin') = 'number' AND jsonb_typeof(rule_doc -> 'rangeMax') = 'number'
        THEN (rule_doc ->> 'rangeMin')::NUMERIC < (rule_doc ->> 'rangeMax')::NUMERIC ELSE TRUE END
      AND COALESCE(jsonb_typeof(rule_doc -> 'optionValue'), 'null') = 'null'
      AND COALESCE(jsonb_typeof(rule_doc -> 'exactValue'), 'null') = 'null'
    WHEN 'exact_value' THEN q.kind IN ('choice', 'text')
      AND jsonb_typeof(rule_doc -> 'exactValue') = 'string'
      AND length(BTRIM(COALESCE(rule_doc ->> 'exactValue', ''))) BETWEEN 1 AND 500
      AND (q.kind <> 'choice' OR option_row.value IS NOT NULL)
      AND COALESCE(jsonb_typeof(rule_doc -> 'optionValue'), 'null') = 'null'
      AND COALESCE(jsonb_typeof(rule_doc -> 'rangeMin'), 'null') = 'null'
      AND COALESCE(jsonb_typeof(rule_doc -> 'rangeMax'), 'null') = 'null'
    WHEN 'fallback' THEN COALESCE(jsonb_typeof(rule_doc -> 'optionValue'), 'null') = 'null'
      AND COALESCE(jsonb_typeof(rule_doc -> 'exactValue'), 'null') = 'null'
      AND COALESCE(jsonb_typeof(rule_doc -> 'rangeMin'), 'null') = 'null'
      AND COALESCE(jsonb_typeof(rule_doc -> 'rangeMax'), 'null') = 'null'
    ELSE FALSE
  END
ON CONFLICT (version_id, question_id, rule_id) DO NOTHING;

-- Response effects are literal, allowlisted operations; no executable payload is read.
INSERT INTO analyzer_pack_response_effects (
  version_id, effect_id, question_id, rule_id, parameter_id, operation,
  value, coefficient, sort_order, config
)
SELECT
  v.id,
  BTRIM(effect_doc ->> 'id'),
  q.question_id,
  CASE WHEN effect_doc ->> 'ruleId' IS NULL OR effect_doc ->> 'ruleId' = '' THEN NULL ELSE BTRIM(effect_doc ->> 'ruleId') END,
  parameter_row.parameter_id,
  effect_doc ->> 'operation',
  CASE
    WHEN effect_doc ->> 'operation' = 'add' THEN effect_doc -> 'value'
    WHEN effect_doc ->> 'operation' = 'set_value' AND jsonb_typeof(effect_doc -> 'value') = 'string'
      THEN to_jsonb(LEFT(effect_doc ->> 'value', 1000))
    WHEN effect_doc ->> 'operation' = 'set_value' AND jsonb_typeof(effect_doc -> 'value') IN ('number', 'boolean')
      THEN effect_doc -> 'value'
    ELSE NULL
  END,
  CASE WHEN effect_doc ->> 'operation' IN ('multiply', 'weighted_value')
      AND jsonb_typeof(effect_doc -> 'coefficient') = 'number'
    THEN CASE WHEN (effect_doc ->> 'coefficient')::NUMERIC BETWEEN -1.7976931348623157e308::NUMERIC AND 1.7976931348623157e308::NUMERIC
      THEN (effect_doc ->> 'coefficient')::DOUBLE PRECISION ELSE NULL END
    ELSE NULL END,
  (effect_ord - 1)::INTEGER,
  CASE WHEN jsonb_typeof(effect_doc -> 'config') = 'object' THEN effect_doc -> 'config' ELSE '{}'::jsonb END
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'responseEffects') = 'array' THEN p.pack -> 'responseEffects' ELSE '[]'::jsonb END
) WITH ORDINALITY AS effect_rows(effect_doc, effect_ord)
JOIN analyzer_pack_questions q
  ON q.version_id = v.id AND q.question_id = BTRIM(effect_doc ->> 'questionId')
JOIN analyzer_pack_parameters parameter_row
  ON parameter_row.version_id = v.id AND parameter_row.parameter_id = BTRIM(effect_doc ->> 'parameterId')
LEFT JOIN analyzer_pack_response_rules rule_row
  ON rule_row.version_id = v.id
 AND rule_row.question_id = q.question_id
 AND rule_row.rule_id = BTRIM(effect_doc ->> 'ruleId')
WHERE jsonb_typeof(effect_doc -> 'id') = 'string'
  AND jsonb_typeof(effect_doc -> 'questionId') = 'string'
  AND jsonb_typeof(effect_doc -> 'parameterId') = 'string'
  AND BTRIM(COALESCE(effect_doc ->> 'id', '')) ~ '^[A-Za-z][A-Za-z0-9._-]{0,63}$'
  AND effect_doc ->> 'operation' IN ('identity', 'reverse', 'set_value', 'add', 'multiply', 'weighted_value')
  AND length(BTRIM(COALESCE(effect_doc ->> 'parameterId', ''))) BETWEEN 1 AND 64
  AND ((effect_doc ->> 'ruleId' IS NULL OR effect_doc ->> 'ruleId' = '') OR rule_row.rule_id IS NOT NULL)
  AND CASE effect_doc ->> 'operation'
    WHEN 'identity' THEN
      ((parameter_row.value_kind = 'numeric' AND q.kind = 'range')
        OR (parameter_row.value_kind IN ('category', 'reference', 'text') AND q.kind IN ('choice', 'text')))
      AND (effect_doc -> 'value' IS NULL OR jsonb_typeof(effect_doc -> 'value') = 'null')
      AND (effect_doc -> 'coefficient' IS NULL OR jsonb_typeof(effect_doc -> 'coefficient') = 'null')
    WHEN 'reverse' THEN parameter_row.value_kind = 'numeric' AND q.kind = 'range'
      AND (effect_doc -> 'value' IS NULL OR jsonb_typeof(effect_doc -> 'value') = 'null')
      AND (effect_doc -> 'coefficient' IS NULL OR jsonb_typeof(effect_doc -> 'coefficient') = 'null')
    WHEN 'set_value' THEN (
      (parameter_row.value_kind = 'numeric' AND jsonb_typeof(effect_doc -> 'value') = 'number'
        AND CASE WHEN jsonb_typeof(effect_doc -> 'value') = 'number'
          THEN (effect_doc ->> 'value')::NUMERIC BETWEEN -1.7976931348623157e308::NUMERIC AND 1.7976931348623157e308::NUMERIC ELSE FALSE END)
      OR (parameter_row.value_kind = 'boolean' AND jsonb_typeof(effect_doc -> 'value') = 'boolean')
      OR (parameter_row.value_kind IN ('category', 'reference', 'text') AND jsonb_typeof(effect_doc -> 'value') = 'string'
        AND length(BTRIM(effect_doc ->> 'value')) >= 1)
    ) AND (effect_doc -> 'coefficient' IS NULL OR jsonb_typeof(effect_doc -> 'coefficient') = 'null')
    WHEN 'add' THEN parameter_row.value_kind = 'numeric' AND jsonb_typeof(effect_doc -> 'value') = 'number'
      AND CASE WHEN jsonb_typeof(effect_doc -> 'value') = 'number'
        THEN (effect_doc ->> 'value')::NUMERIC BETWEEN -1.7976931348623157e308::NUMERIC AND 1.7976931348623157e308::NUMERIC ELSE FALSE END
      AND (effect_doc -> 'coefficient' IS NULL OR jsonb_typeof(effect_doc -> 'coefficient') = 'null')
    WHEN 'multiply' THEN parameter_row.value_kind = 'numeric'
      AND (effect_doc -> 'value' IS NULL OR jsonb_typeof(effect_doc -> 'value') = 'null')
      AND jsonb_typeof(effect_doc -> 'coefficient') = 'number'
      AND CASE WHEN jsonb_typeof(effect_doc -> 'coefficient') = 'number'
        THEN (effect_doc ->> 'coefficient')::NUMERIC BETWEEN -1.7976931348623157e308::NUMERIC AND 1.7976931348623157e308::NUMERIC ELSE FALSE END
    WHEN 'weighted_value' THEN parameter_row.value_kind = 'numeric' AND q.kind = 'range'
      AND (effect_doc -> 'value' IS NULL OR jsonb_typeof(effect_doc -> 'value') = 'null')
      AND jsonb_typeof(effect_doc -> 'coefficient') = 'number'
      AND CASE WHEN jsonb_typeof(effect_doc -> 'coefficient') = 'number'
        THEN (effect_doc ->> 'coefficient')::NUMERIC BETWEEN -1.7976931348623157e308::NUMERIC AND 1.7976931348623157e308::NUMERIC ELSE FALSE END
    ELSE FALSE
  END
ON CONFLICT (version_id, effect_id) DO NOTHING;

-- Formula definitions and ordered inputs.
INSERT INTO analyzer_pack_formulas (version_id, formula_id, output_parameter_id, operation, divisor, sort_order, config)
SELECT
  v.id,
  formula_doc ->> 'id',
  formula_doc ->> 'id',
  formula_doc ->> 'op',
  CASE WHEN (formula_doc ->> 'divisor') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$' THEN (formula_doc ->> 'divisor')::DOUBLE PRECISION ELSE NULL END,
  (formula_ord - 1)::INTEGER,
  formula_doc - 'id' - 'op' - 'of' - 'divisor' - 'weights' - 'bands' - 'watch' - 'capAt' - 'demote'
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'formulas') = 'array' THEN p.pack -> 'formulas' ELSE '[]'::jsonb END
) WITH ORDINALITY AS formula_rows(formula_doc, formula_ord)
JOIN analyzer_pack_parameters parameter_row
  ON parameter_row.version_id = v.id
 AND parameter_row.parameter_id = formula_doc ->> 'id'
WHERE formula_doc ->> 'op' IN ('reverse', 'mean', 'sum', 'sum_div', 'weighted_sum', 'argmin', 'band', 'cap_if', 'matmul')
  AND NULLIF(formula_doc ->> 'id', '') IS NOT NULL
  AND (
    formula_doc ->> 'op' <> 'sum_div'
    OR CASE
      WHEN (formula_doc ->> 'divisor') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
        THEN (formula_doc ->> 'divisor')::DOUBLE PRECISION <> 0
      ELSE FALSE
    END
  )
ON CONFLICT (version_id, formula_id) DO NOTHING;

-- Formula.of inputs: resolve to questions first, then derived parameters.
INSERT INTO analyzer_pack_formula_inputs (
  version_id, formula_id, input_kind, sort_order, source_kind, question_ref, parameter_ref
)
SELECT
  v.id,
  formula_doc ->> 'id',
  'of',
  (input_ord - 1)::INTEGER,
  CASE WHEN q.question_id IS NOT NULL THEN 'question' ELSE 'parameter' END,
  q.question_id,
  CASE WHEN q.question_id IS NULL THEN parameter_row.parameter_id ELSE NULL END
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'formulas') = 'array' THEN p.pack -> 'formulas' ELSE '[]'::jsonb END
) AS formula_rows(formula_doc)
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE WHEN jsonb_typeof(formula_doc -> 'of') = 'array' THEN formula_doc -> 'of' ELSE '[]'::jsonb END
) WITH ORDINALITY AS input_rows(input_ref, input_ord)
JOIN analyzer_pack_formulas f ON f.version_id = v.id AND f.formula_id = formula_doc ->> 'id'
LEFT JOIN analyzer_pack_questions q ON q.version_id = v.id AND q.question_id = input_ref
LEFT JOIN analyzer_pack_parameters parameter_row ON parameter_row.version_id = v.id AND parameter_row.parameter_id = input_ref
WHERE q.question_id IS NOT NULL OR parameter_row.parameter_id IS NOT NULL
ON CONFLICT (version_id, formula_id, input_kind, sort_order) DO NOTHING;

-- Formula weighted inputs and optional dimension target.
INSERT INTO analyzer_pack_formula_inputs (
  version_id, formula_id, input_kind, sort_order, source_kind,
  question_ref, parameter_ref, dimension_parameter_id, weight
)
SELECT
  v.id,
  formula_doc ->> 'id',
  'weighted',
  (weight_ord - 1)::INTEGER,
  CASE WHEN q.question_id IS NOT NULL THEN 'question' ELSE 'parameter' END,
  q.question_id,
  CASE WHEN q.question_id IS NULL THEN parameter_row.parameter_id ELSE NULL END,
  dimension_parameter.parameter_id,
  CASE WHEN (weight_doc ->> 'weight') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$' THEN (weight_doc ->> 'weight')::DOUBLE PRECISION ELSE 1::DOUBLE PRECISION END
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'formulas') = 'array' THEN p.pack -> 'formulas' ELSE '[]'::jsonb END
) AS formula_rows(formula_doc)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(formula_doc -> 'weights') = 'array' THEN formula_doc -> 'weights' ELSE '[]'::jsonb END
) WITH ORDINALITY AS weight_rows(weight_doc, weight_ord)
JOIN analyzer_pack_formulas f ON f.version_id = v.id AND f.formula_id = formula_doc ->> 'id'
LEFT JOIN analyzer_pack_questions q ON q.version_id = v.id AND q.question_id = weight_doc ->> 'item'
LEFT JOIN analyzer_pack_parameters parameter_row ON parameter_row.version_id = v.id AND parameter_row.parameter_id = weight_doc ->> 'item'
LEFT JOIN analyzer_pack_parameters dimension_parameter
  ON dimension_parameter.version_id = v.id
 AND dimension_parameter.parameter_id = weight_doc ->> 'dimension'
WHERE (q.question_id IS NOT NULL OR parameter_row.parameter_id IS NOT NULL)
  AND (NULLIF(weight_doc ->> 'dimension', '') IS NULL OR dimension_parameter.parameter_id IS NOT NULL)
ON CONFLICT (version_id, formula_id, input_kind, sort_order) DO NOTHING;

-- Watched refs are range-question refs in the current scorer.
INSERT INTO analyzer_pack_formula_inputs (
  version_id, formula_id, input_kind, sort_order, source_kind, question_ref
)
SELECT v.id, formula_doc ->> 'id', 'watch', (watch_ord - 1)::INTEGER, 'question', q.question_id
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'formulas') = 'array' THEN p.pack -> 'formulas' ELSE '[]'::jsonb END
) AS formula_rows(formula_doc)
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE WHEN jsonb_typeof(formula_doc -> 'watch') = 'array' THEN formula_doc -> 'watch' ELSE '[]'::jsonb END
) WITH ORDINALITY AS watch_rows(watch_ref, watch_ord)
JOIN analyzer_pack_formulas f ON f.version_id = v.id AND f.formula_id = formula_doc ->> 'id'
JOIN analyzer_pack_questions q ON q.version_id = v.id AND q.question_id = watch_ref
ON CONFLICT (version_id, formula_id, input_kind, sort_order) DO NOTHING;

-- Formula bands and cap/demotion rules are structured rows, not hidden in formula JSON.
INSERT INTO analyzer_pack_formula_bands (
  version_id, formula_id, band_id, label_fa, gte_value, lt_value, lte_value, sort_order
)
SELECT
  v.id,
  formula_doc ->> 'id',
  band_doc ->> 'id',
  LEFT(band_doc ->> 'labelFa', 160),
  CASE WHEN (band_doc ->> 'gte') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$' THEN (band_doc ->> 'gte')::DOUBLE PRECISION ELSE NULL END,
  CASE WHEN (band_doc ->> 'lt') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$' THEN (band_doc ->> 'lt')::DOUBLE PRECISION ELSE NULL END,
  CASE WHEN (band_doc ->> 'lte') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$' THEN (band_doc ->> 'lte')::DOUBLE PRECISION ELSE NULL END,
  (band_ord - 1)::INTEGER
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'formulas') = 'array' THEN p.pack -> 'formulas' ELSE '[]'::jsonb END
) AS formula_rows(formula_doc)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(formula_doc -> 'bands') = 'array' THEN formula_doc -> 'bands' ELSE '[]'::jsonb END
) WITH ORDINALITY AS band_rows(band_doc, band_ord)
JOIN analyzer_pack_formulas f ON f.version_id = v.id AND f.formula_id = formula_doc ->> 'id'
WHERE NULLIF(band_doc ->> 'id', '') IS NOT NULL
  AND NULLIF(band_doc ->> 'labelFa', '') IS NOT NULL
  AND CASE
    WHEN (band_doc ->> 'gte') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
     AND (band_doc ->> 'lt') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
      THEN (band_doc ->> 'gte')::DOUBLE PRECISION < (band_doc ->> 'lt')::DOUBLE PRECISION
    ELSE TRUE
  END
  AND CASE
    WHEN (band_doc ->> 'gte') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
     AND (band_doc ->> 'lte') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
      THEN (band_doc ->> 'gte')::DOUBLE PRECISION <= (band_doc ->> 'lte')::DOUBLE PRECISION
    ELSE TRUE
  END
  AND CASE
    WHEN (band_doc ->> 'lt') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
     AND (band_doc ->> 'lte') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
      THEN (band_doc ->> 'lt')::DOUBLE PRECISION <= (band_doc ->> 'lte')::DOUBLE PRECISION
    ELSE TRUE
  END
ON CONFLICT (version_id, formula_id, band_id) DO NOTHING;

INSERT INTO analyzer_pack_formula_rules (
  version_id, formula_id, rule_kind, sort_order, threshold_lte, set_value
)
SELECT
  v.id,
  formula_doc ->> 'id',
  'cap',
  (rule_ord - 1)::INTEGER,
  CASE WHEN (rule_doc ->> 'lte') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$' THEN (rule_doc ->> 'lte')::DOUBLE PRECISION ELSE 0::DOUBLE PRECISION END,
  LEFT(rule_doc ->> 'set', 64)
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'formulas') = 'array' THEN p.pack -> 'formulas' ELSE '[]'::jsonb END
) AS formula_rows(formula_doc)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(formula_doc -> 'capAt') = 'array' THEN formula_doc -> 'capAt' ELSE '[]'::jsonb END
) WITH ORDINALITY AS rule_rows(rule_doc, rule_ord)
JOIN analyzer_pack_formulas f ON f.version_id = v.id AND f.formula_id = formula_doc ->> 'id'
WHERE NULLIF(rule_doc ->> 'set', '') IS NOT NULL
ON CONFLICT (version_id, formula_id, rule_kind, sort_order) DO NOTHING;

INSERT INTO analyzer_pack_formula_rules (
  version_id, formula_id, rule_kind, sort_order, threshold_lte, from_value, to_value
)
SELECT
  v.id,
  formula_doc ->> 'id',
  'demote',
  (rule_ord - 1)::INTEGER,
  CASE WHEN (rule_doc ->> 'lte') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$' THEN (rule_doc ->> 'lte')::DOUBLE PRECISION ELSE 0::DOUBLE PRECISION END,
  LEFT(rule_doc ->> 'from', 64),
  LEFT(rule_doc ->> 'to', 64)
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'formulas') = 'array' THEN p.pack -> 'formulas' ELSE '[]'::jsonb END
) AS formula_rows(formula_doc)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(formula_doc -> 'demote') = 'array' THEN formula_doc -> 'demote' ELSE '[]'::jsonb END
) WITH ORDINALITY AS rule_rows(rule_doc, rule_ord)
JOIN analyzer_pack_formulas f ON f.version_id = v.id AND f.formula_id = formula_doc ->> 'id'
WHERE NULLIF(rule_doc ->> 'from', '') IS NOT NULL
  AND NULLIF(rule_doc ->> 'to', '') IS NOT NULL
ON CONFLICT (version_id, formula_id, rule_kind, sort_order) DO NOTHING;

-- Preserve the existing graph links without guessing them into response effects.
-- Both source and target are typed references so keyword-to-parameter edges survive backfill.
INSERT INTO analyzer_pack_edges (
  version_id, source_kind, source_question_id, source_parameter_id, source_keyword_id, source_finding_id,
  target_kind, target_parameter_id, target_keyword_id, target_finding_id, weight, transform, sort_order
)
SELECT
  v.id,
  CASE
    WHEN source_question.question_id IS NOT NULL THEN 'question'
    WHEN source_keyword.keyword_id IS NOT NULL THEN 'keyword'
    WHEN source_finding.finding_id IS NOT NULL THEN 'finding'
    ELSE 'parameter'
  END,
  source_question.question_id,
  CASE WHEN source_question.question_id IS NULL AND source_keyword.keyword_id IS NULL AND source_finding.finding_id IS NULL THEN source_parameter.parameter_id ELSE NULL END,
  CASE WHEN source_question.question_id IS NULL AND source_keyword.keyword_id IS NOT NULL THEN source_keyword.keyword_id ELSE NULL END,
  CASE WHEN source_question.question_id IS NULL AND source_keyword.keyword_id IS NULL AND source_finding.finding_id IS NOT NULL THEN source_finding.finding_id ELSE NULL END,
  CASE
    WHEN target_keyword.keyword_id IS NOT NULL THEN 'keyword'
    WHEN target_finding.finding_id IS NOT NULL THEN 'finding'
    ELSE 'parameter'
  END,
  CASE WHEN target_keyword.keyword_id IS NULL AND target_finding.finding_id IS NULL THEN target_parameter.parameter_id ELSE NULL END,
  CASE WHEN target_keyword.keyword_id IS NOT NULL THEN target_keyword.keyword_id ELSE NULL END,
  CASE WHEN target_keyword.keyword_id IS NULL AND target_finding.finding_id IS NOT NULL THEN target_finding.finding_id ELSE NULL END,
  CASE WHEN (edge_doc ->> 'weight') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$' THEN (edge_doc ->> 'weight')::DOUBLE PRECISION ELSE 1::DOUBLE PRECISION END,
  CASE WHEN edge_doc ->> 'transform' = 'reverse' THEN 'reverse' ELSE 'identity' END,
  (edge_ord - 1)::INTEGER
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'edges') = 'array' THEN p.pack -> 'edges' ELSE '[]'::jsonb END
) WITH ORDINALITY AS edge_rows(edge_doc, edge_ord)
LEFT JOIN analyzer_pack_questions source_question
  ON source_question.version_id = v.id AND source_question.question_id = edge_doc ->> 'from'
LEFT JOIN analyzer_pack_keywords source_keyword
  ON source_keyword.version_id = v.id AND source_keyword.keyword_id = edge_doc ->> 'from'
LEFT JOIN analyzer_pack_findings source_finding
  ON source_finding.version_id = v.id AND source_finding.finding_id = edge_doc ->> 'from'
LEFT JOIN analyzer_pack_parameters source_parameter
  ON source_parameter.version_id = v.id AND source_parameter.parameter_id = edge_doc ->> 'from'
LEFT JOIN analyzer_pack_keywords target_keyword
  ON target_keyword.version_id = v.id AND target_keyword.keyword_id = edge_doc ->> 'to'
LEFT JOIN analyzer_pack_findings target_finding
  ON target_finding.version_id = v.id AND target_finding.finding_id = edge_doc ->> 'to'
LEFT JOIN analyzer_pack_parameters target_parameter
  ON target_parameter.version_id = v.id AND target_parameter.parameter_id = edge_doc ->> 'to'
WHERE (source_question.question_id IS NOT NULL OR source_keyword.keyword_id IS NOT NULL OR source_finding.finding_id IS NOT NULL OR source_parameter.parameter_id IS NOT NULL)
  AND (target_keyword.keyword_id IS NOT NULL OR target_finding.finding_id IS NOT NULL OR target_parameter.parameter_id IS NOT NULL);

-- Report settings are a first-class configuration with separately addressable children.
INSERT INTO analyzer_pack_report_configs (
  version_id, hide_gate_scores, interpretation_version, closing_fa,
  user_summary_template_fa, document_template_id, business_name_question_id, config
)
SELECT
  v.id,
  CASE lower(report_doc ->> 'hideGateScores') WHEN 'true' THEN TRUE WHEN 'false' THEN FALSE ELSE NULL END,
  LEFT(report_doc ->> 'interpretationVersion', 64),
  LEFT(report_doc ->> 'closingFa', 400),
  report_doc ->> 'userSummaryTemplateFa',
  LEFT(report_doc ->> 'documentTemplateId', 64),
  CASE WHEN q.question_id IS NOT NULL THEN q.question_id ELSE NULL END,
  report_doc - 'hideGateScores' - 'interpretationVersion' - 'closingFa' - 'userSummaryTemplateFa'
    - 'documentTemplateId' - 'businessNameItemId' - 'contextFields' - 'layerBands' - 'crossPatterns'
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL (SELECT p.pack -> 'report' AS report_doc) report_row
LEFT JOIN analyzer_pack_questions q
  ON q.version_id = v.id
 AND q.question_id = report_doc ->> 'businessNameItemId'
WHERE jsonb_typeof(report_doc) = 'object'
ON CONFLICT (version_id) DO NOTHING;

INSERT INTO analyzer_pack_report_context_fields (version_id, field_id, question_id, label_fa, sort_order)
SELECT v.id, field_doc ->> 'id', q.question_id, LEFT(field_doc ->> 'labelFa', 80), (field_ord - 1)::INTEGER
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'report' -> 'contextFields') = 'array' THEN p.pack -> 'report' -> 'contextFields' ELSE '[]'::jsonb END
) WITH ORDINALITY AS field_rows(field_doc, field_ord)
JOIN analyzer_pack_questions q
  ON q.version_id = v.id
 AND q.question_id = field_doc ->> 'id'
WHERE NULLIF(field_doc ->> 'labelFa', '') IS NOT NULL
ON CONFLICT (version_id, field_id) DO NOTHING;

INSERT INTO analyzer_pack_report_layer_bands (
  version_id, band_id, parameter_id, label_fa, meaning_fa, min_value, max_value, max_inclusive, sort_order
)
SELECT
  v.id,
  band_doc ->> 'id',
  parameter_row.parameter_id,
  LEFT(band_doc ->> 'labelFa', 80),
  LEFT(COALESCE(band_doc ->> 'meaningFa', ''), 400),
  CASE WHEN (band_doc ->> 'min') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$' THEN (band_doc ->> 'min')::DOUBLE PRECISION ELSE 0::DOUBLE PRECISION END,
  CASE WHEN (band_doc ->> 'max') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$' THEN (band_doc ->> 'max')::DOUBLE PRECISION ELSE 0::DOUBLE PRECISION END,
  COALESCE((band_doc ->> 'maxInclusive')::BOOLEAN, FALSE),
  (band_ord - 1)::INTEGER
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'report' -> 'layerBands') = 'array' THEN p.pack -> 'report' -> 'layerBands' ELSE '[]'::jsonb END
) WITH ORDINALITY AS band_rows(band_doc, band_ord)
LEFT JOIN analyzer_pack_parameters parameter_row
  ON parameter_row.version_id = v.id
 AND parameter_row.parameter_id = band_doc ->> 'parameterId'
WHERE NULLIF(band_doc ->> 'id', '') IS NOT NULL
  AND NULLIF(band_doc ->> 'labelFa', '') IS NOT NULL
  AND CASE
    WHEN (band_doc ->> 'min') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
     AND (band_doc ->> 'max') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
      THEN (band_doc ->> 'min')::DOUBLE PRECISION <= (band_doc ->> 'max')::DOUBLE PRECISION
    ELSE FALSE
  END
ON CONFLICT (version_id, band_id) DO NOTHING;

INSERT INTO analyzer_pack_authoring_issues (version_id, component, entity_id, issue_code, detail)
SELECT v.id, 'report_band', LEFT(band_doc ->> 'id', 256), 'invalid_bounds',
       jsonb_build_object('band', band_doc)
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'report' -> 'layerBands') = 'array' THEN p.pack -> 'report' -> 'layerBands' ELSE '[]'::jsonb END
) AS band_rows(band_doc)
WHERE NULLIF(band_doc ->> 'id', '') IS NOT NULL
  AND (
    COALESCE(band_doc ->> 'min', '') !~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
    OR COALESCE(band_doc ->> 'max', '') !~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
    OR CASE
      WHEN (band_doc ->> 'min') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
       AND (band_doc ->> 'max') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
        THEN (band_doc ->> 'min')::DOUBLE PRECISION > (band_doc ->> 'max')::DOUBLE PRECISION
      ELSE FALSE
    END
  )
ON CONFLICT (version_id, component, entity_id, issue_code) DO NOTHING;

INSERT INTO analyzer_pack_report_cross_patterns (
  version_id, pattern_id, meaning_fa, action_fa,
  strong_parameter_id, weak_parameter_id, also_weak_parameter_id, sort_order
)
SELECT
  v.id,
  pattern_doc ->> 'id',
  LEFT(pattern_doc ->> 'meaningFa', 400),
  LEFT(COALESCE(pattern_doc ->> 'actionFa', ''), 400),
  strong_parameter.parameter_id,
  weak_parameter.parameter_id,
  also_weak_parameter.parameter_id,
  (pattern_ord - 1)::INTEGER
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'report' -> 'crossPatterns') = 'array' THEN p.pack -> 'report' -> 'crossPatterns' ELSE '[]'::jsonb END
) WITH ORDINALITY AS pattern_rows(pattern_doc, pattern_ord)
LEFT JOIN analyzer_pack_parameters strong_parameter
  ON strong_parameter.version_id = v.id AND strong_parameter.parameter_id = pattern_doc -> 'when' ->> 'strong'
LEFT JOIN analyzer_pack_parameters weak_parameter
  ON weak_parameter.version_id = v.id AND weak_parameter.parameter_id = pattern_doc -> 'when' ->> 'weak'
LEFT JOIN analyzer_pack_parameters also_weak_parameter
  ON also_weak_parameter.version_id = v.id AND also_weak_parameter.parameter_id = pattern_doc -> 'when' ->> 'alsoWeak'
WHERE NULLIF(pattern_doc ->> 'id', '') IS NOT NULL
  AND NULLIF(pattern_doc ->> 'meaningFa', '') IS NOT NULL
ON CONFLICT (version_id, pattern_id) DO NOTHING;

INSERT INTO analyzer_pack_report_pattern_parameters (version_id, pattern_id, parameter_id, sort_order)
SELECT v.id, pattern_doc ->> 'id', parameter_row.parameter_id, (weak_ord - 1)::INTEGER
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'report' -> 'crossPatterns') = 'array' THEN p.pack -> 'report' -> 'crossPatterns' ELSE '[]'::jsonb END
) AS pattern_rows(pattern_doc)
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE WHEN jsonb_typeof(pattern_doc -> 'when' -> 'weakAny') = 'array' THEN pattern_doc -> 'when' -> 'weakAny' ELSE '[]'::jsonb END
) WITH ORDINALITY AS weak_rows(weak_ref, weak_ord)
JOIN analyzer_pack_report_cross_patterns pattern_row
  ON pattern_row.version_id = v.id AND pattern_row.pattern_id = pattern_doc ->> 'id'
JOIN analyzer_pack_parameters parameter_row
  ON parameter_row.version_id = v.id AND parameter_row.parameter_id = weak_ref
ON CONFLICT (version_id, pattern_id, sort_order) DO NOTHING;

-- Contradictory legacy numeric bands are kept in the JSON compatibility column,
-- omitted from normalized rows, and block automatic publication pending review.
INSERT INTO analyzer_pack_authoring_issues (version_id, component, entity_id, issue_code, detail)
SELECT v.id, 'formula_band', LEFT((formula_doc ->> 'id') || ':' || (band_doc ->> 'id'), 256), 'invalid_bounds',
       jsonb_build_object('formulaId', formula_doc ->> 'id', 'band', band_doc)
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'formulas') = 'array' THEN p.pack -> 'formulas' ELSE '[]'::jsonb END
) AS formula_rows(formula_doc)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(formula_doc -> 'bands') = 'array' THEN formula_doc -> 'bands' ELSE '[]'::jsonb END
) AS band_rows(band_doc)
WHERE NULLIF(formula_doc ->> 'id', '') IS NOT NULL
  AND NULLIF(band_doc ->> 'id', '') IS NOT NULL
  AND (
    CASE WHEN (band_doc ->> 'gte') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
          AND (band_doc ->> 'lt') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
      THEN (band_doc ->> 'gte')::DOUBLE PRECISION >= (band_doc ->> 'lt')::DOUBLE PRECISION ELSE FALSE END
    OR CASE WHEN (band_doc ->> 'gte') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
          AND (band_doc ->> 'lte') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
      THEN (band_doc ->> 'gte')::DOUBLE PRECISION > (band_doc ->> 'lte')::DOUBLE PRECISION ELSE FALSE END
    OR CASE WHEN (band_doc ->> 'lt') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
          AND (band_doc ->> 'lte') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
      THEN (band_doc ->> 'lt')::DOUBLE PRECISION > (band_doc ->> 'lte')::DOUBLE PRECISION ELSE FALSE END
  )
ON CONFLICT (version_id, component, entity_id, issue_code) DO NOTHING;

-- Flag legacy formulas that cannot satisfy the normalized formula constraints.
INSERT INTO analyzer_pack_authoring_issues (version_id, component, entity_id, issue_code, detail)
SELECT v.id, 'formula', LEFT(formula_doc ->> 'id', 256), 'invalid_divisor',
       jsonb_build_object('formulaId', formula_doc ->> 'id', 'operation', 'sum_div', 'divisor', formula_doc -> 'divisor')
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'formulas') = 'array' THEN p.pack -> 'formulas' ELSE '[]'::jsonb END
) AS formula_rows(formula_doc)
WHERE formula_doc ->> 'op' = 'sum_div'
  AND NULLIF(formula_doc ->> 'id', '') IS NOT NULL
  AND CASE
    WHEN (formula_doc ->> 'divisor') ~ '^[+-]?[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$'
      THEN (formula_doc ->> 'divisor')::DOUBLE PRECISION = 0
    ELSE TRUE
  END
ON CONFLICT (version_id, component, entity_id, issue_code) DO NOTHING;

-- Record formulas whose legacy input refs cannot be represented as a typed FK.
-- The original JSON remains available as a temporary compatibility source until
-- these issues are resolved through the authoring UI or a reviewed data repair.
INSERT INTO analyzer_pack_authoring_issues (version_id, component, entity_id, issue_code, detail)
SELECT v.id, 'formula_input', LEFT((formula_doc ->> 'id') || ':of:' || input_ref, 256), 'unresolved_reference',
       jsonb_build_object('formulaId', formula_doc ->> 'id', 'inputKind', 'of', 'reference', input_ref)
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'formulas') = 'array' THEN p.pack -> 'formulas' ELSE '[]'::jsonb END
) AS formula_rows(formula_doc)
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE WHEN jsonb_typeof(formula_doc -> 'of') = 'array' THEN formula_doc -> 'of' ELSE '[]'::jsonb END
) AS input_rows(input_ref)
LEFT JOIN analyzer_pack_questions q ON q.version_id = v.id AND q.question_id = input_ref
LEFT JOIN analyzer_pack_parameters parameter_row ON parameter_row.version_id = v.id AND parameter_row.parameter_id = input_ref
WHERE q.question_id IS NULL AND parameter_row.parameter_id IS NULL
  AND NULLIF(formula_doc ->> 'id', '') IS NOT NULL
ON CONFLICT (version_id, component, entity_id, issue_code) DO NOTHING;

INSERT INTO analyzer_pack_authoring_issues (version_id, component, entity_id, issue_code, detail)
SELECT v.id, 'formula_input', LEFT((formula_doc ->> 'id') || ':weighted:' || COALESCE(weight_doc ->> 'item', ''), 256), 'unresolved_reference',
       jsonb_build_object('formulaId', formula_doc ->> 'id', 'inputKind', 'weighted', 'reference', weight_doc ->> 'item')
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'formulas') = 'array' THEN p.pack -> 'formulas' ELSE '[]'::jsonb END
) AS formula_rows(formula_doc)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(formula_doc -> 'weights') = 'array' THEN formula_doc -> 'weights' ELSE '[]'::jsonb END
) AS weight_rows(weight_doc)
LEFT JOIN analyzer_pack_questions q ON q.version_id = v.id AND q.question_id = weight_doc ->> 'item'
LEFT JOIN analyzer_pack_parameters parameter_row ON parameter_row.version_id = v.id AND parameter_row.parameter_id = weight_doc ->> 'item'
WHERE q.question_id IS NULL AND parameter_row.parameter_id IS NULL
  AND NULLIF(formula_doc ->> 'id', '') IS NOT NULL
ON CONFLICT (version_id, component, entity_id, issue_code) DO NOTHING;

INSERT INTO analyzer_pack_authoring_issues (version_id, component, entity_id, issue_code, detail)
SELECT v.id, 'formula_input', LEFT((formula_doc ->> 'id') || ':watch:' || watch_ref, 256), 'unresolved_reference',
       jsonb_build_object('formulaId', formula_doc ->> 'id', 'inputKind', 'watch', 'reference', watch_ref)
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'formulas') = 'array' THEN p.pack -> 'formulas' ELSE '[]'::jsonb END
) AS formula_rows(formula_doc)
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE WHEN jsonb_typeof(formula_doc -> 'watch') = 'array' THEN formula_doc -> 'watch' ELSE '[]'::jsonb END
) AS watch_rows(watch_ref)
LEFT JOIN analyzer_pack_questions q ON q.version_id = v.id AND q.question_id = watch_ref
WHERE q.question_id IS NULL
  AND NULLIF(formula_doc ->> 'id', '') IS NOT NULL
ON CONFLICT (version_id, component, entity_id, issue_code) DO NOTHING;

-- Record legacy edges or report references that did not resolve to a typed row.
INSERT INTO analyzer_pack_authoring_issues (version_id, component, entity_id, issue_code, detail)
SELECT v.id, 'edge', 'edge:' || edge_ord::TEXT, 'unresolved_reference', jsonb_build_object('edge', edge_doc)
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'edges') = 'array' THEN p.pack -> 'edges' ELSE '[]'::jsonb END
) WITH ORDINALITY AS edge_rows(edge_doc, edge_ord)
LEFT JOIN analyzer_pack_questions source_question ON source_question.version_id = v.id AND source_question.question_id = edge_doc ->> 'from'
LEFT JOIN analyzer_pack_keywords source_keyword ON source_keyword.version_id = v.id AND source_keyword.keyword_id = edge_doc ->> 'from'
LEFT JOIN analyzer_pack_findings source_finding ON source_finding.version_id = v.id AND source_finding.finding_id = edge_doc ->> 'from'
LEFT JOIN analyzer_pack_parameters source_parameter ON source_parameter.version_id = v.id AND source_parameter.parameter_id = edge_doc ->> 'from'
LEFT JOIN analyzer_pack_parameters target_parameter ON target_parameter.version_id = v.id AND target_parameter.parameter_id = edge_doc ->> 'to'
LEFT JOIN analyzer_pack_keywords target_keyword ON target_keyword.version_id = v.id AND target_keyword.keyword_id = edge_doc ->> 'to'
LEFT JOIN analyzer_pack_findings target_finding ON target_finding.version_id = v.id AND target_finding.finding_id = edge_doc ->> 'to'
WHERE (source_question.question_id IS NULL AND source_keyword.keyword_id IS NULL AND source_finding.finding_id IS NULL AND source_parameter.parameter_id IS NULL)
   OR (target_parameter.parameter_id IS NULL AND target_keyword.keyword_id IS NULL AND target_finding.finding_id IS NULL)
ON CONFLICT (version_id, component, entity_id, issue_code) DO NOTHING;

INSERT INTO analyzer_pack_authoring_issues (version_id, component, entity_id, issue_code, detail)
SELECT v.id, 'report_context', LEFT(field_doc ->> 'id', 256), 'unresolved_question',
       jsonb_build_object('field', field_doc)
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'report' -> 'contextFields') = 'array' THEN p.pack -> 'report' -> 'contextFields' ELSE '[]'::jsonb END
) AS field_rows(field_doc)
LEFT JOIN analyzer_pack_questions q ON q.version_id = v.id AND q.question_id = field_doc ->> 'id'
WHERE q.question_id IS NULL
  AND NULLIF(field_doc ->> 'id', '') IS NOT NULL
ON CONFLICT (version_id, component, entity_id, issue_code) DO NOTHING;

INSERT INTO analyzer_pack_authoring_issues (version_id, component, entity_id, issue_code, detail)
SELECT v.id, 'report', 'business-name-question', 'unresolved_question',
       jsonb_build_object('questionId', report_doc ->> 'businessNameItemId')
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL (SELECT p.pack -> 'report' AS report_doc) report_row
LEFT JOIN analyzer_pack_questions q ON q.version_id = v.id AND q.question_id = report_doc ->> 'businessNameItemId'
WHERE NULLIF(report_doc ->> 'businessNameItemId', '') IS NOT NULL
  AND q.question_id IS NULL
ON CONFLICT (version_id, component, entity_id, issue_code) DO NOTHING;

INSERT INTO analyzer_pack_authoring_issues (version_id, component, entity_id, issue_code, detail)
SELECT v.id, 'report_pattern', LEFT(pattern_doc ->> 'id', 256), 'unresolved_parameter',
       jsonb_build_object('patternId', pattern_doc ->> 'id', 'field', missing.field_name, 'reference', missing.reference_id)
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'report' -> 'crossPatterns') = 'array' THEN p.pack -> 'report' -> 'crossPatterns' ELSE '[]'::jsonb END
) AS pattern_rows(pattern_doc)
CROSS JOIN LATERAL (VALUES
  ('strong', pattern_doc -> 'when' ->> 'strong'),
  ('weak', pattern_doc -> 'when' ->> 'weak'),
  ('alsoWeak', pattern_doc -> 'when' ->> 'alsoWeak')
) AS missing(field_name, reference_id)
LEFT JOIN analyzer_pack_parameters parameter_row
  ON parameter_row.version_id = v.id AND parameter_row.parameter_id = missing.reference_id
WHERE NULLIF(pattern_doc ->> 'id', '') IS NOT NULL
  AND NULLIF(missing.reference_id, '') IS NOT NULL
  AND parameter_row.parameter_id IS NULL
ON CONFLICT (version_id, component, entity_id, issue_code) DO NOTHING;

INSERT INTO analyzer_pack_authoring_issues (version_id, component, entity_id, issue_code, detail)
SELECT v.id, 'report_pattern', LEFT(pattern_doc ->> 'id', 256), 'unresolved_parameter',
       jsonb_build_object('patternId', pattern_doc ->> 'id', 'field', 'weakAny', 'reference', weak_ref)
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'report' -> 'crossPatterns') = 'array' THEN p.pack -> 'report' -> 'crossPatterns' ELSE '[]'::jsonb END
) AS pattern_rows(pattern_doc)
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE WHEN jsonb_typeof(pattern_doc -> 'when' -> 'weakAny') = 'array' THEN pattern_doc -> 'when' -> 'weakAny' ELSE '[]'::jsonb END
) AS weak_rows(weak_ref)
LEFT JOIN analyzer_pack_parameters parameter_row
  ON parameter_row.version_id = v.id AND parameter_row.parameter_id = weak_ref
WHERE parameter_row.parameter_id IS NULL
  AND NULLIF(pattern_doc ->> 'id', '') IS NOT NULL
ON CONFLICT (version_id, component, entity_id, issue_code) DO NOTHING;

-- Invalid/unresolved legacy authoring rows remain in JSON and make relational reads fall back safely.
INSERT INTO analyzer_pack_authoring_issues (version_id, component, entity_id, issue_code, detail)
SELECT v.id, 'parameter', COALESCE(NULLIF(LEFT(BTRIM(parameter_doc ->> 'id'), 256), ''), 'parameter:' || parameter_ord::TEXT), 'unresolved_or_invalid',
       jsonb_build_object('parameter', parameter_doc)
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'parameters') = 'array' THEN p.pack -> 'parameters' ELSE '[]'::jsonb END
) WITH ORDINALITY AS parameter_rows(parameter_doc, parameter_ord)
LEFT JOIN analyzer_pack_parameters parameter_row
  ON parameter_row.version_id = v.id AND parameter_row.parameter_id = BTRIM(parameter_doc ->> 'id')
WHERE parameter_row.parameter_id IS NULL
  OR (SELECT COUNT(*)
      FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.pack -> 'parameters') = 'array' THEN p.pack -> 'parameters' ELSE '[]'::jsonb END) duplicate_rows(duplicate_doc)
      WHERE duplicate_doc ->> 'id' = parameter_doc ->> 'id') > 1
ON CONFLICT (version_id, component, entity_id, issue_code) DO NOTHING;

INSERT INTO analyzer_pack_authoring_issues (version_id, component, entity_id, issue_code, detail)
SELECT v.id, 'response_rule', COALESCE(NULLIF(LEFT(BTRIM(rule_doc ->> 'id'), 256), ''), 'rule:' || rule_ord::TEXT), 'unresolved_or_invalid',
       jsonb_build_object('rule', rule_doc)
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'responseRules') = 'array' THEN p.pack -> 'responseRules' ELSE '[]'::jsonb END
) WITH ORDINALITY AS rule_rows(rule_doc, rule_ord)
LEFT JOIN analyzer_pack_response_rules rule_row
  ON rule_row.version_id = v.id
 AND rule_row.question_id = BTRIM(rule_doc ->> 'questionId')
 AND rule_row.rule_id = BTRIM(rule_doc ->> 'id')
WHERE rule_row.rule_id IS NULL
  OR (SELECT COUNT(*)
      FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.pack -> 'responseRules') = 'array' THEN p.pack -> 'responseRules' ELSE '[]'::jsonb END) duplicate_rows(duplicate_doc)
      WHERE duplicate_doc ->> 'id' = rule_doc ->> 'id'
        AND duplicate_doc ->> 'questionId' = rule_doc ->> 'questionId') > 1
ON CONFLICT (version_id, component, entity_id, issue_code) DO NOTHING;

INSERT INTO analyzer_pack_authoring_issues (version_id, component, entity_id, issue_code, detail)
SELECT v.id, 'response_effect', COALESCE(NULLIF(LEFT(BTRIM(effect_doc ->> 'id'), 256), ''), 'effect:' || effect_ord::TEXT), 'unresolved_or_invalid',
       jsonb_build_object('effect', effect_doc)
FROM analyzer_packs p
JOIN analyzer_pack_versions v
  ON v.pack_slug = p.slug
 AND v.version = LEFT(COALESCE(NULLIF(BTRIM(p.pack ->> 'version'), ''), 'legacy-1'), 64)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.pack -> 'responseEffects') = 'array' THEN p.pack -> 'responseEffects' ELSE '[]'::jsonb END
) WITH ORDINALITY AS effect_rows(effect_doc, effect_ord)
LEFT JOIN analyzer_pack_response_effects effect_row
  ON effect_row.version_id = v.id AND effect_row.effect_id = BTRIM(effect_doc ->> 'id')
WHERE effect_row.effect_id IS NULL
  OR (SELECT COUNT(*)
      FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.pack -> 'responseEffects') = 'array' THEN p.pack -> 'responseEffects' ELSE '[]'::jsonb END) duplicate_rows(duplicate_doc)
      WHERE duplicate_doc ->> 'id' = effect_doc ->> 'id') > 1
ON CONFLICT (version_id, component, entity_id, issue_code) DO NOTHING;

-- A pack can have a version string that was never stored by the old schema. Only
-- attempts/reports matching the version materialized above receive a version FK.
UPDATE analyzer_attempts a
SET pack_version_id = v.id
FROM analyzer_pack_versions v
WHERE a.slug = v.pack_slug
  AND a.instrument_version = v.version
  AND a.pack_version_id IS NULL;

UPDATE analyzer_reports r
SET
  pack_version_id = a.pack_version_id,
  report_config_snapshot = p.pack -> 'report'
FROM analyzer_attempts a
LEFT JOIN analyzer_packs p ON p.slug = a.slug
WHERE r.attempt_kind = 'analyzer'
  AND r.attempt_id = a.id
  AND r.slug = a.slug
  AND r.pack_version_id IS NULL
  AND a.pack_version_id IS NOT NULL;

-- Preserve old lifecycle for diagnostics while freezing every already-public or
-- already-attempted definition. A dirty version is not made the active release.
UPDATE analyzer_pack_versions v
SET
  lifecycle_state = 'published',
  published_at = COALESCE(v.created_at, NOW())
FROM analyzer_packs p
WHERE p.slug = v.pack_slug
  AND v.lifecycle_state = 'draft'
  AND (
    p.status IN ('open', 'archived')
    OR EXISTS (
      SELECT 1 FROM analyzer_attempts a
      WHERE a.slug = v.pack_slug AND a.pack_version_id = v.id
    )
    OR EXISTS (
      SELECT 1 FROM analyzer_reports r
      WHERE r.slug = v.pack_slug AND r.pack_version_id = v.id
    )
  );

-- Only an open, fully resolvable legacy pack becomes the current public release.
INSERT INTO analyzer_pack_releases (pack_slug, version_id, published_at)
SELECT v.pack_slug, v.id, COALESCE(v.published_at, v.created_at, NOW())
FROM analyzer_pack_versions v
JOIN analyzer_packs p ON p.slug = v.pack_slug
WHERE p.status = 'open'
  AND v.lifecycle_state = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM analyzer_pack_authoring_issues issue
    WHERE issue.version_id = v.id
  )
ON CONFLICT (pack_slug) DO NOTHING;

ALTER TABLE analyzer_attempts
  ADD CONSTRAINT analyzer_attempts_pack_version_fk
  FOREIGN KEY (slug, pack_version_id)
  REFERENCES analyzer_pack_versions(pack_slug, id) ON DELETE RESTRICT;
CREATE INDEX analyzer_attempts_pack_version_idx ON analyzer_attempts (pack_version_id);

ALTER TABLE analyzer_reports
  ADD CONSTRAINT analyzer_reports_pack_version_fk
  FOREIGN KEY (slug, pack_version_id)
  REFERENCES analyzer_pack_versions(pack_slug, id) ON DELETE RESTRICT;
CREATE INDEX analyzer_reports_pack_version_idx ON analyzer_reports (pack_version_id);

-- The current-release pointer may only reference a frozen published version.
CREATE OR REPLACE FUNCTION analyzer_require_published_pack_release()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM analyzer_pack_versions v
    WHERE v.pack_slug = NEW.pack_slug
      AND v.id = NEW.version_id
      AND v.lifecycle_state = 'published'
  ) THEN
    RAISE EXCEPTION 'analyzer pack release must target a published version (slug=%)', NEW.pack_slug
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER analyzer_pack_releases_published_version_trg
  BEFORE INSERT OR UPDATE ON analyzer_pack_releases
  FOR EACH ROW EXECUTE FUNCTION analyzer_require_published_pack_release();

CREATE OR REPLACE FUNCTION analyzer_require_published_attempt_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  version_state VARCHAR(16);
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.pack_version_id IS NOT NULL
       AND NEW.pack_version_id IS DISTINCT FROM OLD.pack_version_id THEN
      RAISE EXCEPTION 'analyzer attempt/report version binding is immutable (row id=%)', OLD.id
        USING ERRCODE = '55000';
    END IF;
  END IF;

  IF NEW.pack_version_id IS NOT NULL THEN
    SELECT lifecycle_state INTO version_state
    FROM analyzer_pack_versions
    WHERE pack_slug = NEW.slug AND id = NEW.pack_version_id;
    IF version_state IS DISTINCT FROM 'published' THEN
      RAISE EXCEPTION 'stored analyzer attempts and reports must reference a published version (slug=%)', NEW.slug
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER analyzer_attempts_require_published_version_trg
  BEFORE INSERT OR UPDATE OF slug, pack_version_id ON analyzer_attempts
  FOR EACH ROW EXECUTE FUNCTION analyzer_require_published_attempt_version();

CREATE TRIGGER analyzer_reports_require_published_version_trg
  BEFORE INSERT OR UPDATE OF slug, pack_version_id ON analyzer_reports
  FOR EACH ROW EXECUTE FUNCTION analyzer_require_published_attempt_version();

-- Do not allow edits to a published version or any of its child records. New edits
-- must be made as a separate draft version. This is a database-level invariant.
CREATE OR REPLACE FUNCTION analyzer_prevent_published_pack_version_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.lifecycle_state = 'published' THEN
    RAISE EXCEPTION 'published analyzer pack versions are immutable (version id=%)', OLD.id
      USING ERRCODE = '55000';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  IF OLD.pack_slug <> NEW.pack_slug OR OLD.version <> NEW.version THEN
    RAISE EXCEPTION 'analyzer pack version identity is immutable (version id=%)', OLD.id
      USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER analyzer_pack_versions_immutable_trg
  BEFORE UPDATE OR DELETE ON analyzer_pack_versions
  FOR EACH ROW EXECUTE FUNCTION analyzer_prevent_published_pack_version_mutation();

CREATE OR REPLACE FUNCTION analyzer_prevent_published_pack_child_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  version_state VARCHAR(16);
BEGIN
  IF TG_OP <> 'INSERT' THEN
    SELECT lifecycle_state INTO version_state
    FROM analyzer_pack_versions
    WHERE id = OLD.version_id;
    IF version_state = 'published' THEN
      RAISE EXCEPTION 'published analyzer pack version % is immutable', OLD.version_id
        USING ERRCODE = '55000';
    END IF;
  END IF;

  IF TG_OP <> 'DELETE' THEN
    SELECT lifecycle_state INTO version_state
    FROM analyzer_pack_versions
    WHERE id = NEW.version_id;
    IF version_state = 'published' THEN
      RAISE EXCEPTION 'published analyzer pack version % is immutable', NEW.version_id
        USING ERRCODE = '55000';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'analyzer_pack_sections',
    'analyzer_pack_questions',
    'analyzer_pack_choice_options',
    'analyzer_pack_parameters',
    'analyzer_pack_response_rules',
    'analyzer_pack_response_effects',
    'analyzer_pack_formulas',
    'analyzer_pack_formula_inputs',
    'analyzer_pack_formula_bands',
    'analyzer_pack_formula_rules',
    'analyzer_pack_findings',
    'analyzer_pack_keywords',
    'analyzer_pack_keyword_children',
    'analyzer_pack_edges',
    'analyzer_pack_report_configs',
    'analyzer_pack_report_context_fields',
    'analyzer_pack_report_layer_bands',
    'analyzer_pack_report_cross_patterns',
    'analyzer_pack_report_pattern_parameters',
    'analyzer_pack_authoring_issues'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION analyzer_prevent_published_pack_child_mutation()',
      table_name || '_immutable_trg', table_name
    );
  END LOOP;
END;
$$;
