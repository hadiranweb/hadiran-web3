import { NextResponse } from "next/server";
import { db } from "@/db";
import { semanticRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireOwner } from "@/lib/auth/guard";
import { parseArticleLayers, parseClosingOptions, parseSimulator } from "@/lib/knowledge/article";
import { canDeleteDraft, syncPublishedArticle } from "@/lib/knowledge/lifecycle";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
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

  const layers = parseArticleLayers(body, {
    growth: existing.growth,
    readingMinutes: existing.readingMinutes,
    lineFa: existing.lineFa,
    questionFa: existing.questionFa,
    rootFa: existing.rootFa,
    firstStepFa: existing.firstStepFa,
    marginNoteFa: existing.marginNoteFa,
    prunedAt: existing.prunedAt,
    audioUrl: existing.audioUrl,
    simulator: parseSimulator(existing.simulator),
    closingQuestionFa: existing.closingQuestionFa,
    closingOptions: parseClosingOptions(existing.closingOptions),
    closingPromptFa: existing.closingPromptFa,
    relatedSlugs: Array.isArray(existing.relatedSlugs) ? existing.relatedSlugs : [],
  });

  const [updated] = await db
    .update(semanticRecords)
    .set({
      titleFa,
      titleEn: typeof body.titleEn === "string" ? body.titleEn.trim() || null : existing.titleEn,
      intent: typeof body.intent === "string" ? body.intent.trim() || null : existing.intent,
      summaryFa: typeof body.summaryFa === "string" ? body.summaryFa.trim() || null : existing.summaryFa,
      bodyFa: typeof body.bodyFa === "string" ? body.bodyFa : existing.bodyFa,
      growth: layers.growth,
      readingMinutes: layers.readingMinutes,
      lineFa: layers.lineFa,
      questionFa: layers.questionFa,
      rootFa: layers.rootFa,
      firstStepFa: layers.firstStepFa,
      marginNoteFa: layers.marginNoteFa,
      prunedAt: layers.prunedAt,
      audioUrl: layers.audioUrl,
      simulator: layers.simulator,
      closingQuestionFa: layers.closingQuestionFa,
      closingOptions: layers.closingOptions,
      closingPromptFa: layers.closingPromptFa,
      relatedSlugs: layers.relatedSlugs,
      updatedAt: new Date(),
    })
    .where(eq(semanticRecords.id, id))
    .returning();

  if (updated.promotedMemoryId) {
    try {
      await syncPublishedArticle(updated);
    } catch (error) {
      console.error("[hadiran] garden sync", error instanceof Error ? error.name : "unknown");
      return NextResponse.json({ error: "public_sync_failed", id: updated.id }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, id: updated.id });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
  const [existing] = await db.select().from(semanticRecords).where(eq(semanticRecords.id, id));
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (existing.ownerId && existing.ownerId !== auth.account.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!canDeleteDraft(existing)) {
    return NextResponse.json({ error: "unpublish_or_archive_first" }, { status: 409 });
  }
  await db.delete(semanticRecords).where(eq(semanticRecords.id, id));
  return NextResponse.json({ ok: true, id });
}
