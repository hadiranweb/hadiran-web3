-- Retire the legacy Casio runtime from the rebuilt application schema.
-- The one-time 0037 runner directive drops the old public schema and replays migrations
-- before this file runs; this step removes Casio seed rows and its legacy table.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM assessment_orders
    WHERE (attempt_kind = 'casio' OR analyzer_slug = 'casio-ss')
      AND state IN ('awaiting_confirmation', 'captured')
  ) THEN
    RAISE EXCEPTION 'Resolve legacy Casio orders in awaiting_confirmation/captured before migration 0036';
  END IF;
END $$;

-- Orders with no submitted payment reference have no captured financial event.
UPDATE assessment_orders
SET state = 'cancelled', updated_at = NOW()
WHERE (attempt_kind = 'casio' OR analyzer_slug = 'casio-ss')
  AND state = 'awaiting_payment_reference';

-- Preserve order and ledger rows for audit, but prevent further sales of legacy offers.
UPDATE assessment_tariffs
SET active = FALSE, updated_at = NOW()
WHERE analyzer_slug = 'casio-ss' AND active = TRUE;

UPDATE discount_codes
SET active = FALSE, updated_at = NOW()
WHERE analyzer_slug = 'casio-ss' AND active = TRUE;

-- Remove only explicit legacy links; keep the shared bot and MCP infrastructure intact.
UPDATE bots SET analyzer_slug = NULL, updated_at = NOW() WHERE analyzer_slug = 'casio-ss';
DELETE FROM bot_chat_sessions WHERE analyzer_slug = 'casio-ss';
UPDATE mcp_topic_rules
SET preferred_analyzer_slug = NULL, updated_at = NOW()
WHERE preferred_analyzer_slug = 'casio-ss';

-- The old test and its reports are removed from the active app; the backup remains the archive.
DELETE FROM assessment_entitlements
WHERE attempt_kind = 'casio'
   OR order_id IN (SELECT id FROM assessment_orders WHERE analyzer_slug = 'casio-ss');

DELETE FROM analyzer_reports
WHERE attempt_kind = 'casio'
   OR slug = 'casio-ss'
   OR template_id IN ('casio-ss', 'casio-research');

DELETE FROM analyzer_attempts WHERE slug = 'casio-ss';

-- Release authoring quota consumed by the legacy pack; 0035 creates these tables first.
WITH removed_usage AS (
  DELETE FROM assessment_authoring_usage
  WHERE pack_slug = 'casio-ss'
  RETURNING subscription_id
), usage_counts AS (
  SELECT subscription_id, COUNT(*)::INTEGER AS removed_count
  FROM removed_usage
  GROUP BY subscription_id
)
UPDATE assessment_authoring_subscriptions AS subscription
SET quota_used = GREATEST(subscription.quota_used - usage_counts.removed_count, 0)
FROM usage_counts
WHERE subscription.id = usage_counts.subscription_id;

DELETE FROM analyzer_packs WHERE slug = 'casio-ss';

DELETE FROM analyzer_document_templates
WHERE id IN ('casio-ss', 'casio-research');

DROP TABLE IF EXISTS casio_attempts;
