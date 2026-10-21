CREATE TABLE IF NOT EXISTS site_copy (
  id serial PRIMARY KEY,
  key varchar(120) NOT NULL,
  locale varchar(8) NOT NULL DEFAULT 'fa',
  draft_value text,
  live_value text,
  live_revision integer NOT NULL DEFAULT 0,
  draft_note text,
  updated_by integer REFERENCES accounts(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now(),
  published_by integer REFERENCES accounts(id) ON DELETE SET NULL,
  published_at timestamptz,
  CONSTRAINT site_copy_key_locale_uq UNIQUE (key, locale)
);

CREATE TABLE IF NOT EXISTS content_revision (
  id serial PRIMARY KEY,
  entity varchar(32) NOT NULL,
  entity_key varchar(160) NOT NULL,
  revision integer NOT NULL,
  snapshot jsonb NOT NULL,
  note text,
  actor_id integer REFERENCES accounts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT content_revision_entity_key_rev_uq UNIQUE (entity, entity_key, revision)
);

CREATE INDEX IF NOT EXISTS content_revision_entity_idx ON content_revision (entity, entity_key, revision DESC);
