-- @hadiran-runner: destructive-rebuild
-- One-time, runner-only directive. scripts/apply-migrations.mjs drops the public
-- application schema, recreates the migration ledger, replays every other SQL
-- migration in order, and records this migration only after replay succeeds.
-- Never execute this file directly; direct execution must fail closed.
DO $$
BEGIN
  RAISE EXCEPTION '0037 is a runner directive; use scripts/apply-migrations.mjs';
END $$;
