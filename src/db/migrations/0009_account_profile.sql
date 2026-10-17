-- Profile names, reserved channel columns on accounts, public 8-digit display code.
-- Email and telegram are unused this cut. Phone remains the login identifier.

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS given_name VARCHAR(64);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS family_name VARCHAR(64);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS email VARCHAR(254);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS telegram_user_id VARCHAR(32);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS accounts_email_unique
  ON accounts (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS accounts_telegram_user_id_unique
  ON accounts (telegram_user_id) WHERE telegram_user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS account_public_codes (
  account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  code VARCHAR(8) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT account_public_codes_code_digits CHECK (code ~ '^[0-9]{8}$')
);

DO $$
DECLARE
  r RECORD;
  candidate TEXT;
  tries INTEGER;
BEGIN
  FOR r IN
    SELECT id FROM accounts a
    WHERE NOT EXISTS (SELECT 1 FROM account_public_codes p WHERE p.account_id = a.id)
  LOOP
    tries := 0;
    LOOP
      tries := tries + 1;
      candidate := (10000000 + (floor(random() * 90000000))::integer)::text;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM account_public_codes WHERE code = candidate);
      IF tries > 32 THEN
        RAISE EXCEPTION 'could not allocate public code for account %', r.id;
      END IF;
    END LOOP;
    INSERT INTO account_public_codes (account_id, code) VALUES (r.id, candidate);
  END LOOP;
END $$;
