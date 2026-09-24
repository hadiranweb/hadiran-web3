import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(root, "src", "db", "migrations");
const outFile = path.join(root, "src", "db", "migration-files.ts");

const files = (await readdir(migrationsDir))
  .filter((name) => name.endsWith(".sql"))
  .sort((a, b) => a.localeCompare(b, "en"));

const entries = [];
for (const file of files) {
  const sql = await readFile(path.join(migrationsDir, file), "utf8");
  entries.push({ id: file, sql });
}

const body = `export const MIGRATION_FILES: { id: string; sql: string }[] = ${JSON.stringify(entries, null, 2)};\n`;
await writeFile(outFile, body);
console.log(`Wrote ${files.length} migrations to src/db/migration-files.ts`);
