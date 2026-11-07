import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(root, "src", "db", "migrations");
const migrationTable = "public._hadiran_schema_migrations";
const rebuildMigrationId = "0037_rebuild_schema_from_migrations.sql";
const rebuildDirective = "@hadiran-runner: destructive-rebuild";
const lockSql = "SELECT pg_advisory_lock(hashtext('hadiran'), hashtext('schema-migrations'))";
const unlockSql = "SELECT pg_advisory_unlock(hashtext('hadiran'), hashtext('schema-migrations'))";

const databaseUrl = process.env.DATABASE_URL;
const allowDestructiveReset = process.argv.includes("--allow-destructive-reset");
if (!databaseUrl) {
  console.error("DATABASE_URL is required before applying migrations.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 8000,
});

async function ensureMigrationTable() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${migrationTable} (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function isApplied(id) {
  const result = await client.query(
    `SELECT 1 FROM ${migrationTable} WHERE id = $1`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}

async function applyMigration(file) {
  if (await isApplied(file.id)) {
    console.log(`skip ${file.id}`);
    return;
  }

  console.log(`apply ${file.id}`);
  await client.query("BEGIN");
  try {
    await client.query(file.sql);
    await client.query(
      `INSERT INTO ${migrationTable} (id) VALUES ($1)`,
      [file.id],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function rebuildPublicSchema() {
  console.log("0037 requests a one-time full application-schema rebuild from migrations");
  await client.query("BEGIN");
  try {
    await client.query("DROP SCHEMA IF EXISTS public CASCADE");
    await client.query("CREATE SCHEMA public AUTHORIZATION CURRENT_USER");
    await client.query("GRANT USAGE ON SCHEMA public TO PUBLIC");
    await ensureMigrationTable();
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function recordRebuildMigration() {
  await client.query("BEGIN");
  try {
    await client.query(
      `INSERT INTO ${migrationTable} (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`,
      [rebuildMigrationId],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function main() {
  await client.connect();
  await client.query(lockSql);

  try {
    const files = (await readdir(migrationsDir))
      .filter((name) => name.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b, "en"))
      .map((id) => ({ id, sql: null }));

    if (files.length === 0) {
      throw new Error(`No SQL files in ${migrationsDir}`);
    }

    const rebuildMigration = files.find((file) => file.id === rebuildMigrationId);
    if (rebuildMigration) {
      rebuildMigration.sql = await readFile(path.join(migrationsDir, rebuildMigration.id), "utf8");
      if (!rebuildMigration.sql.includes(rebuildDirective)) {
        throw new Error(`${rebuildMigrationId} is missing its reset directive marker`);
      }
    }

    await ensureMigrationTable();

    if (rebuildMigration && !(await isApplied(rebuildMigrationId))) {
      if (!allowDestructiveReset) {
        throw new Error(
          `Pending ${rebuildMigrationId}; refusing destructive reset without --allow-destructive-reset`,
        );
      }
      // This one-time directive deliberately runs before every historical migration.
      // If a replay is interrupted, the marker remains absent and the next start retries
      // the rebuild from a clean schema rather than accepting a partial schema.
      await rebuildPublicSchema();
      for (const file of files) {
        if (file.id === rebuildMigrationId) continue;
        file.sql = await readFile(path.join(migrationsDir, file.id), "utf8");
        await applyMigration(file);
      }
      await recordRebuildMigration();
    } else {
      for (const file of files) {
        if (file.id === rebuildMigrationId) continue;
        file.sql = await readFile(path.join(migrationsDir, file.id), "utf8");
        await applyMigration(file);
      }
    }
  } finally {
    await client.query(unlockSql).catch(() => {});
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => {});
  });
