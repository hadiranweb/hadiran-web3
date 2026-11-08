-- Persist the complete generated interpretation payload. The normalized report
-- columns and child tables remain queryable, while this JSONB snapshot preserves
-- renderer-only fields for exact historical report parity.
ALTER TABLE analyzer_reports ADD COLUMN document_snapshot JSONB;
