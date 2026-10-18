-- Bot belongs to a service (analyzers), not a single exam. Script JSON is hub copy + flow flags.

ALTER TABLE bots ADD COLUMN IF NOT EXISTS service VARCHAR(32) NOT NULL DEFAULT 'analyzers';
ALTER TABLE bots ADD COLUMN IF NOT EXISTS script JSONB;
