-- First-login onboarding: policy acceptance + name gate.
-- Existing accounts are already registered and must not see the popup.

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS policies_accepted_at TIMESTAMPTZ;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

UPDATE accounts
SET
  policies_accepted_at = COALESCE(policies_accepted_at, created_at, NOW()),
  onboarding_completed_at = COALESCE(onboarding_completed_at, created_at, NOW())
WHERE onboarding_completed_at IS NULL;
