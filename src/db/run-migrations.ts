import { Client } from "pg";
import { MIGRATION_FILES } from "./migration-files";

export async function runHadiranMigrations(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("[hadiran] migrate skip: DATABASE_URL missing");
    return;
  }

  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 8000,
  });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _hadiran_schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const file of MIGRATION_FILES) {
      const already = await client.query("SELECT 1 FROM _hadiran_schema_migrations WHERE id = $1", [
        file.id,
      ]);
      if ((already.rowCount ?? 0) > 0) {
        console.log(`[hadiran] migrate skip ${file.id}`);
        continue;
      }
      console.log(`[hadiran] migrate apply ${file.id}`);
      await client.query("BEGIN");
      try {
        await client.query(file.sql);
        await client.query("INSERT INTO _hadiran_schema_migrations (id) VALUES ($1)", [file.id]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
    console.log("[hadiran] migrate done");
  } finally {
    await client.end().catch(() => {});
  }
}
