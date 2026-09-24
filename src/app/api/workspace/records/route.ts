import { NextResponse } from "next/server";
import { db } from "@/db";
import { semanticRecords } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireOwner } from "@/lib/auth/guard";
import { newCanonicalId } from "@/lib/knowledge/ids";
import { SCHEMA_VERSION } from "@/lib/knowledge/vocabulary";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const items = await db
    .select()
    .from(semanticRecords)
    .where(eq(semanticRecords.ownerId, auth.account.id))
    .orderBy(desc(semanticRecords.updatedAt));
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const body = (await request.json()) as Record<string, unknown>;
  const titleFa = typeof body.titleFa === "string" ? body.titleFa.trim() : "";
  if (titleFa.length < 3) {
    return NextResponse.json({ error: "عنوان فارسی حداقل سه نویسه باشد." }, { status: 400 });
  }
  const id = newCanonicalId("SR");
  const [created] = await db
    .insert(semanticRecords)
    .values({
      id,
      titleFa,
      titleEn: typeof body.titleEn === "string" ? body.titleEn.trim() || null : null,
      intent: typeof body.intent === "string" ? body.intent.trim() || null : null,
      summaryFa: typeof body.summaryFa === "string" ? body.summaryFa.trim() || null : null,
      bodyFa: typeof body.bodyFa === "string" ? body.bodyFa : null,
      status: "captured",
      visibility: "private",
      ownerId: auth.account.id,
      schemaVersion: SCHEMA_VERSION,
    })
    .returning();
  return NextResponse.json({ ok: true, id: created.id });
}
