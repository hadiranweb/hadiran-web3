import { previewStore } from "@/lib/preview/store";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { semanticRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireOwner } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
  const preview = await previewStore(auth.account);
  if (preview) {
    const item = preview.records.find((record) => record.id === id);
    if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const body = await request.json() as Record<string,unknown>;
    for (const key of ["titleFa","titleEn","intent","summaryFa","bodyFa"] as const) {
      if (typeof body[key] === "string" && (key !== "titleFa" || body[key].trim().length >= 3)) item[key] = body[key];
    }
    item.updatedAt = new Date();
    return NextResponse.json({ ok: true, id, preview: true });
  }
  const [existing] = await db.select().from(semanticRecords).where(eq(semanticRecords.id, id));
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (existing.ownerId && existing.ownerId !== auth.account.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const titleFa =
    typeof body.titleFa === "string" && body.titleFa.trim().length >= 3
      ? body.titleFa.trim()
      : existing.titleFa;

  const [updated] = await db
    .update(semanticRecords)
    .set({
      titleFa,
      titleEn: typeof body.titleEn === "string" ? body.titleEn.trim() || null : existing.titleEn,
      intent: typeof body.intent === "string" ? body.intent.trim() || null : existing.intent,
      summaryFa: typeof body.summaryFa === "string" ? body.summaryFa.trim() || null : existing.summaryFa,
      bodyFa: typeof body.bodyFa === "string" ? body.bodyFa : existing.bodyFa,
      updatedAt: new Date(),
    })
    .where(eq(semanticRecords.id, id))
    .returning();

  return NextResponse.json({ ok: true, id: updated.id });
}
