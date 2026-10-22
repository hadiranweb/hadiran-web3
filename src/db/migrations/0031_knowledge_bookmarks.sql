CREATE TABLE IF NOT EXISTS knowledge_bookmarks (
  account_id integer NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  knowledge_id integer NOT NULL REFERENCES knowledge(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, knowledge_id)
);

CREATE INDEX IF NOT EXISTS knowledge_bookmarks_account_idx ON knowledge_bookmarks (account_id, created_at DESC);
