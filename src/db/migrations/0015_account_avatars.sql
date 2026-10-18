-- Stable first-party SVG avatar assignment. Future raster photos use a private disk object key, not a public filesystem path.
CREATE TABLE IF NOT EXISTS account_avatars (
  account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  variant INTEGER NOT NULL CHECK (variant >= 0 AND variant < 8),
  image_key VARCHAR(160),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
