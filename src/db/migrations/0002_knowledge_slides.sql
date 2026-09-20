CREATE TABLE IF NOT EXISTS knowledge_slides (
  id SERIAL PRIMARY KEY,
  knowledge_id INTEGER NOT NULL REFERENCES knowledge(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  title_fa VARCHAR(256),
  title_en VARCHAR(256),
  body_fa TEXT,
  body_en TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
