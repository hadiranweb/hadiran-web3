import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";

export async function runHadiranMigrations(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.log("[hadiran] migrate skip: DATABASE_URL missing");
    return;
  }

  const cwd = process.cwd();
  const scriptPath = path.join(cwd, "scripts", "apply-migrations.mjs");
  try {
    await access(scriptPath);
  } catch {
    throw new Error("scripts/apply-migrations.mjs is missing from the runtime image");
  }

  const args = [scriptPath];
  if (process.env.NODE_ENV === "production") args.push("--allow-destructive-reset");

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd,
      env: process.env,
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`migration process ended with code=${code ?? "null"} signal=${signal ?? "none"}`));
    });
  });
}
