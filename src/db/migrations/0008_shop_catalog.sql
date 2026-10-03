-- Hadiran shop catalog: physical + digital, USD ratio pricing, gallery, specs.
-- Payment remains out-of-band. No PSP.

CREATE TABLE IF NOT EXISTS shop_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

ALTER TABLE shop_listings ADD COLUMN IF NOT EXISTS usd_ratio DOUBLE PRECISION;
ALTER TABLE shop_listings ADD COLUMN IF NOT EXISTS compare_price INTEGER;
ALTER TABLE shop_listings ADD COLUMN IF NOT EXISTS specs JSONB;
ALTER TABLE shop_listings ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

CREATE TABLE IF NOT EXISTS shop_listing_images (
  id SERIAL PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES shop_listings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumb_url TEXT,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS shop_listing_images_listing_idx
  ON shop_listing_images (listing_id, position);
