-- DRAFT ONLY: not registered in automatic migrations. Do not run without approval.
-- PostgreSQL integration, backup and least-privilege review are required first.
BEGIN;
CREATE TABLE finance_plan_heads (
  plan_key varchar(80) PRIMARY KEY,
  version integer NOT NULL CHECK (version >= 0),
  CHECK (plan_key ~ '^[a-z][a-z0-9_.-]{0,79}$')
);
CREATE TABLE finance_plan_revisions (
  plan_key varchar(80) NOT NULL REFERENCES finance_plan_heads(plan_key),
  version integer NOT NULL CHECK (version > 0),
  config jsonb NOT NULL,
  digest char(64) NOT NULL CHECK (digest ~ '^[a-f0-9]{64}$'),
  created_by integer NOT NULL REFERENCES accounts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_key,version),
  CHECK ((jsonb_typeof(config)='object' AND config->>'currency'='IRR'
    AND config->>'key'=plan_key AND config->>'refundPolicy'='before_delivery_only'
    AND config->>'rounding' IN ('reject_fraction','floor','ceil','half_up')
    AND jsonb_typeof(config->'tariffs')='array') IS TRUE)
);
ALTER TABLE finance_plan_heads ADD CONSTRAINT finance_plan_head_revision
FOREIGN KEY (plan_key,version) REFERENCES finance_plan_revisions(plan_key,version)
DEFERRABLE INITIALLY DEFERRED;
CREATE FUNCTION finance_plan_revision_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'finance_plan_revisions_are_append_only';
END;
$$;
CREATE TRIGGER finance_plan_revision_no_change BEFORE UPDATE OR DELETE ON finance_plan_revisions
FOR EACH ROW EXECUTE FUNCTION finance_plan_revision_immutable();
CREATE TRIGGER finance_plan_revision_no_truncate BEFORE TRUNCATE ON finance_plan_revisions
FOR EACH STATEMENT EXECUTE FUNCTION finance_plan_revision_immutable();
COMMIT;
-- The runtime role must not own these tables/functions or be able to drop/disable triggers.
-- Deployment must grant only SELECT/INSERT on revisions and SELECT/INSERT/UPDATE on heads.
-- No wallet balances, charge execution or historical-order repricing is created here.
