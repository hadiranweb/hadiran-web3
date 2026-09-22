export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const isProductionBuild =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build";

  console.log("[hadiran] boot", {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    port: process.env.PORT || "3000",
    hostname: process.env.HOSTNAME || "unset",
    node: process.version,
    phase: process.env.NEXT_PHASE || "unset",
  });

  // next build on Liara has app env (including DATABASE_URL) but is not on
  // the private Postgres network. Opening a connection here hangs until the
  // 15-minute platform timeout. Migrate at pre-start / next start only.
  if (isProductionBuild) {
    console.log("[hadiran] migrate skip: next build must not open the database");
    return;
  }

  try {
    const { runHadiranMigrations } = await import("@/db/run-migrations");
    await runHadiranMigrations();
  } catch (error) {
    console.error("[hadiran] migrate failed; UI stays up", error);
  }
}
