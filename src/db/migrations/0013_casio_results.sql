-- Snapshot of declarative scores on submit. Report UI is not this cut.

ALTER TABLE casio_attempts ADD COLUMN IF NOT EXISTS results JSONB;
