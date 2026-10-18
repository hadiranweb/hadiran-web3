-- Add author role. Own file: new enum values cannot be used in the same transaction.

DO $$ BEGIN
  ALTER TYPE account_role ADD VALUE 'author';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
