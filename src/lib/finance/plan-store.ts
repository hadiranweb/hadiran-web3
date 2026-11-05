import { createHash } from "node:crypto";
import { pool, hasDatabaseUrl } from "@/db";
import { assertFinanceKey, normalizePlanDraft, serializePlanDraft, TariffError, type FinancePlanRevision } from "./tariffs";

// Schema is deliberately a reviewed draft outside automatic migrations. No implicit DDL here.
export const FINANCE_CONFIG_WRITE_FLAG = "HADIRAN_FINANCE_CONFIG_WRITES";
function ready(write: boolean) {
  if (!hasDatabaseUrl()) throw new TariffError("database_not_connected", 503);
  if (write && process.env[FINANCE_CONFIG_WRITE_FLAG] !== "1") throw new TariffError("finance_configuration_writes_disabled", 503);
}
function hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
function revision(row: { config: unknown; version: number; digest: string; created_at: Date | string }): FinancePlanRevision {
  const draft = normalizePlanDraft(row.config);
  if (hash(serializePlanDraft(draft)) !== row.digest || !Number.isSafeInteger(row.version) || row.version < 1) throw new TariffError("corrupt_plan_snapshot", 503);
  return { ...draft, version: row.version, digest: row.digest, createdAt: new Date(row.created_at).toISOString() };
}
function schemaError(error: unknown): never {
  if (error && typeof error === "object" && "code" in error && error.code === "42P01") throw new TariffError("finance_schema_not_applied", 503);
  throw error;
}
export async function listFinancePlans(actorId: number): Promise<FinancePlanRevision[]> {
  ready(false);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const actor = await client.query("SELECT id FROM accounts WHERE id=$1 AND role='owner' AND is_active=true FOR SHARE", [actorId]);
    if (!actor.rowCount) throw new TariffError("forbidden", 403);
    const result = await client.query("SELECT r.config,r.version,r.digest,r.created_at FROM finance_plan_revisions r JOIN finance_plan_heads h ON h.plan_key=r.plan_key AND h.version=r.version ORDER BY r.plan_key");
    const plans = result.rows.map(revision);
    await client.query("COMMIT");
    return plans;
  } catch (error) { await client.query("ROLLBACK").catch(() => {}); schemaError(error); }
  finally { client.release(); }
}
export async function saveFinancePlan(actorId: number, expectedVersion: number, value: unknown): Promise<FinancePlanRevision> {
  ready(true);
  if (!Number.isSafeInteger(actorId) || actorId <= 0) throw new TariffError("forbidden", 403);
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0 || expectedVersion >= 2147483647) throw new TariffError("invalid_expected_version");
  const draft = normalizePlanDraft(value), serialized = serializePlanDraft(draft), digest = hash(serialized), key = assertFinanceKey(draft.key);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout='5s'");
    const actor = await client.query("SELECT id FROM accounts WHERE id=$1 AND role='owner' AND is_active=true FOR SHARE", [actorId]);
    if (!actor.rowCount) throw new TariffError("forbidden", 403);
    await client.query("INSERT INTO finance_plan_heads (plan_key,version) VALUES ($1,0) ON CONFLICT DO NOTHING", [key]);
    const head = await client.query("SELECT version FROM finance_plan_heads WHERE plan_key=$1 FOR UPDATE", [key]);
    if (head.rows[0]?.version !== expectedVersion) throw new TariffError("plan_version_conflict", 409);
    const version = expectedVersion + 1;
    const result = await client.query("INSERT INTO finance_plan_revisions (plan_key,version,config,digest,created_by) VALUES ($1,$2,$3::jsonb,$4,$5) RETURNING config,version,digest,created_at", [key,version,serialized,digest,actorId]);
    await client.query("UPDATE finance_plan_heads SET version=$2 WHERE plan_key=$1", [key,version]);
    const saved = revision(result.rows[0]);
    await client.query("COMMIT");
    return saved;
  } catch (error) { await client.query("ROLLBACK").catch(() => {}); schemaError(error); }
  finally { client.release(); }
}
