-- استودیو هادیران (صفحه‌ساز بلوکی Puck): صفحه‌ها و نسخه‌های انتشار.
-- قانون: draft_data هرگز عمومی نمی‌شود؛ فقط published_data در /p/[slug] رندر می‌شود.
CREATE TABLE IF NOT EXISTS studio_pages (
  id text PRIMARY KEY,
  slug varchar(128) NOT NULL UNIQUE,
  title_fa varchar(256) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'draft',
  target varchar(64) NOT NULL DEFAULT 'standalone',
  draft_data jsonb NOT NULL DEFAULT '{"content":[],"root":{}}'::jsonb,
  published_data jsonb,
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_id integer REFERENCES accounts(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS studio_page_versions (
  id text PRIMARY KEY,
  page_id text NOT NULL REFERENCES studio_pages(id) ON DELETE CASCADE,
  version integer NOT NULL,
  data jsonb NOT NULL,
  note text,
  created_by integer REFERENCES accounts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS studio_page_versions_page_idx ON studio_page_versions (page_id, version DESC);
