-- SVG avatar choice per account. image_key is reserved; photo upload is off.
CREATE TABLE IF NOT EXISTS account_avatars (
  account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  variant INTEGER NOT NULL CHECK (variant >= 0 AND variant < 8),
  image_key VARCHAR(160),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
