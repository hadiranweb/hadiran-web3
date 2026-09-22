export const dynamic = "force-dynamic";

export async function GET() {
  const body = {
    ok: true,
    db: false,
    databaseUrl: Boolean(process.env.DATABASE_URL),
  };

  if (!process.env.DATABASE_URL) {
    return Response.json(body);
  }

  try {
    const { db } = await import("@/db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`select 1`);
    body.db = true;
  } catch (error) {
    console.error("[hadiran] health db check failed", error);
  }

  return Response.json(body);
}
