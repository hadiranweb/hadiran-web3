export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  console.log("[hadiran] boot", {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    port: process.env.PORT || "3000",
    hostname: process.env.HOSTNAME || "unset",
    node: process.version,
  });

  try {
    const { runHadiranMigrations } = await import("@/db/run-migrations");
    await runHadiranMigrations();
  } catch (error) {
    console.error("[hadiran] migrate failed; UI stays up", error);
  }
}
