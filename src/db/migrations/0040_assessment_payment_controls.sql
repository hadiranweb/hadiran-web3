ALTER TABLE analyzer_attempts
  ADD COLUMN IF NOT EXISTS execution_payment_mode VARCHAR(16) NOT NULL DEFAULT 'before_result';

ALTER TABLE assessment_tariffs
  ADD COLUMN IF NOT EXISTS creator_discount_cap_percent INTEGER NOT NULL DEFAULT 0;

ALTER TABLE assessment_orders
  ADD COLUMN IF NOT EXISTS discount_percent INTEGER;
ALTER TABLE assessment_orders
  ADD COLUMN IF NOT EXISTS discount_cap_percent INTEGER;
ALTER TABLE assessment_orders
  ADD COLUMN IF NOT EXISTS discount_over_cap_irr BIGINT;
ALTER TABLE assessment_orders
  ADD COLUMN IF NOT EXISTS funding_source VARCHAR(24) NOT NULL DEFAULT 'buyer';
ALTER TABLE assessment_orders
  ADD COLUMN IF NOT EXISTS sponsor_id INTEGER REFERENCES accounts(id) ON DELETE RESTRICT;
ALTER TABLE assessment_orders
  ADD COLUMN IF NOT EXISTS sponsorship_amount_irr BIGINT NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'analyzer_attempts_execution_payment_mode_check') THEN
    ALTER TABLE analyzer_attempts
      ADD CONSTRAINT analyzer_attempts_execution_payment_mode_check
      CHECK (execution_payment_mode IN ('before_start', 'before_result'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assessment_tariffs_creator_discount_cap_check') THEN
    ALTER TABLE assessment_tariffs
      ADD CONSTRAINT assessment_tariffs_creator_discount_cap_check
      CHECK (creator_discount_cap_percent BETWEEN 0 AND 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assessment_orders_discount_percent_check') THEN
    ALTER TABLE assessment_orders
      ADD CONSTRAINT assessment_orders_discount_percent_check
      CHECK (discount_percent IS NULL OR discount_percent BETWEEN 0 AND 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assessment_orders_discount_cap_percent_check') THEN
    ALTER TABLE assessment_orders
      ADD CONSTRAINT assessment_orders_discount_cap_percent_check
      CHECK (discount_cap_percent IS NULL OR discount_cap_percent BETWEEN 0 AND 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assessment_orders_discount_over_cap_check') THEN
    ALTER TABLE assessment_orders
      ADD CONSTRAINT assessment_orders_discount_over_cap_check
      CHECK (
        discount_over_cap_irr IS NULL OR
        (discount_over_cap_irr >= 0 AND discount_over_cap_irr <= discount_irr)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assessment_orders_funding_source_check') THEN
    ALTER TABLE assessment_orders
      ADD CONSTRAINT assessment_orders_funding_source_check
      CHECK (funding_source IN ('buyer', 'creator_sponsorship'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assessment_orders_sponsorship_fields_check') THEN
    ALTER TABLE assessment_orders
      ADD CONSTRAINT assessment_orders_sponsorship_fields_check
      CHECK (
        (funding_source = 'buyer' AND sponsor_id IS NULL AND sponsorship_amount_irr = 0) OR
        (funding_source = 'creator_sponsorship' AND sponsor_id IS NOT NULL AND sponsorship_amount_irr > 0)
      );
  END IF;
END $$;
