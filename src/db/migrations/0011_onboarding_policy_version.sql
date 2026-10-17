-- Re-gate onboarding: policy text version + empty names.
-- 0010 backfilled timestamps so existing accounts skipped the popup.

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS policies_version VARCHAR(64);

UPDATE accounts
SET onboarding_completed_at = NULL
WHERE given_name IS NULL
   OR btrim(given_name) = ''
   OR family_name IS NULL
   OR btrim(family_name) = '';
