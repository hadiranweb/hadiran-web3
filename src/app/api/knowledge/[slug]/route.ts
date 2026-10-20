import { NextResponse } from "next/server";
import { db } from "@/db";
import { knowledge, knowledgeReferences, knowledgeSlides } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { slugify } from "@/lib/markdown";
import { requireAccount } from "@/lib/auth/guard";
import { getPublicKnowledgeBySlug } from "@/lib/knowledge/public";
import { isKnowledgeGrowth, parseClosingOptions, parseSimulator } from "@/lib/knowledge/article";

export const dynamic = "force-dynamic";

const TYPES = ["wiki", "article", "note", "research", "idea"] as const;

type SlideInput = {
  sortOrder?: number;
  titleFa?: string | null;
  titleEn?: string | null;
  bodyFa?: string | null;
  bodyEn?: string | null;
};

function nullableText(value: unknown, fallback: string | null) {
  if (value === null) return null;
  if (typeof value === "string") return value.trim() || null;
  return fallback;
}

function nullableDate(value: unknown, fallback: Date | null) {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return fallback;
  const date = new Date(value.length === 10 ? `${value}T12:00:00+03:30` : value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function articleLayers(body: Record<string, unknown>, existing: typeof knowledge.$inferSelect) {
  const minutesRaw = body.readingMinutes;
  let readingMinutes = existing.readingMinutes;
  if (minutesRaw === null || minutesRaw === "") readingMinutes = null;
  else if (typeof minutesRaw === "number" && Number.isFinite(minutesRaw)) readingMinutes = Math.max(0, Math.round(minutesRaw));
  else if (typeof minutesRaw === "string" && minutesRaw.trim()) {
    const parsed = Number(minutesRaw);
    if (Number.isFinite(parsed)) readingMinutes = Math.max(0, Math.round(parsed));
  }

  return {
    growth: isKnowledgeGrowth(body.growth) ? body.growth : body.growth === null || body.growth === "" ? null : existing.growth,
    readingMinutes,
    summaryFa: nullableText(body.summaryFa, existing.summaryFa),
    lineFa: nullableText(body.lineFa, existing.lineFa),
    questionFa: nullableText(body.questionFa, existing.questionFa),
    rootFa: nullableText(body.rootFa, existing.rootFa),
    firstStepFa: nullableText(body.firstStepFa, existing.firstStepFa),
    marginNoteFa: nullableText(body.marginNoteFa, existing.marginNoteFa),
    prunedAt: nullableDate(body.prunedAt, existing.prunedAt),
    audioUrl: nullableText(body.audioUrl, existing.audioUrl),
    simulator: Object.prototype.hasOwnProperty.call(body, "simulator")
      ? parseSimulator(body.simulator)
      : existing.simulator,
    closingQuestionFa: nullableText(body.closingQuestionFa, existing.closingQuestionFa),
    closingOptions: Object.prototype.hasOwnProperty.call(body, "closingOptions")
      ? parseClosingOptions(body.closingOptions)
      : existing.closingOptions,
    closingPromptFa: nullableText(body.closingPromptFa, existing.closingPromptFa),
    updatedAt: new Date(),
  };
}

async function replaceSlides(knowledgeId: number, slides: SlideInput[]) {
  await db.delete(knowledgeSlides).where(eq(knowledgeSlides.knowledgeId, knowledgeId));
  if (slides.length === 0) return;
  await db.insert(knowledgeSlides).values(
    slides.map((slide, index) => ({
      knowledgeId,
      sortOrder: slide.sortOrder ?? index,
      titleFa: slide.titleFa || null,
      titleEn: slide.titleEn || null,
      bodyFa: slide.bodyFa || null,
      bodyEn: slide.bodyEn || null,
    })),
  );
}

async function replaceRelated(sourceId: number, slugs: unknown) {
  if (!Array.isArray(slugs)) return;
  const wanted = [...new Set(slugs.map((row) => (typeof row === "string" ? row.trim() : "")).filter(Boolean))];
  await db.delete(knowledgeReferences).where(eq(knowledgeReferences.sourceKnowledgeId, sourceId));
  if (wanted.length === 0) return;
  const targets = await db
    .select({ id: knowledge.id, slug: knowledge.slug })
    .from(knowledge)
    .where(inArray(knowledge.slug, wanted));
  const rows = targets
    .filter((row) => row.id !== sourceId)
    .map((row) => ({
      sourceKnowledgeId: sourceId,
      targetKnowledgeId: row.id,
      relation: "thread",
    }));
  if (rows.length) await db.insert(knowledgeReferences).values(rows);
}

interface Ctx {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: Ctx) {
  const { slug } = await params;
  const item = await getPublicKnowledgeBySlug(slug);
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const slides = await db.select().from(knowledgeSlides).where(eq(knowledgeSlides.knowledgeId, item.id));
  return NextResponse.json({ item, slides });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  try {
    const { slug } = await params;
    const [existing] = await db.select().from(knowledge).where(eq(knowledge.slug, slug));
    if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const body = (await request.json()) as Record<string, unknown>;
    const layers = articleLayers(body, existing);

    if (existing.memoryItemId) {
      const [updated] = await db.update(knowledge).set(layers).where(eq(knowledge.id, existing.id)).returning();
      await replaceRelated(existing.id, body.relatedSlugs);
      return NextResponse.json({ ok: true, slug: updated.slug, id: updated.id });
    }

    const titleFa = typeof body.titleFa === "string" ? body.titleFa.trim() : existing.titleFa;
    const nextSlug =
      typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug) : existing.slug;
    if (["new", "edit", "write"].includes(nextSlug)) {
      return NextResponse.json({ error: "این اسلاگ رزرو شده است" }, { status: 400 });
    }
    if (nextSlug !== existing.slug) {
      const [dup] = await db.select({ id: knowledge.id }).from(knowledge).where(eq(knowledge.slug, nextSlug));
      if (dup) {
        return NextResponse.json({ error: "این اسلاگ قبلاً استفاده شده است" }, { status: 409 });
      }
    }
    const type = TYPES.includes(body.type as (typeof TYPES)[number])
      ? (body.type as (typeof TYPES)[number])
      : existing.type;

    const [updated] = await db
      .update(knowledge)
      .set({
        ...layers,
        slug: nextSlug,
        type,
        titleFa,
        titleEn: typeof body.titleEn === "string" ? body.titleEn : existing.titleEn,
        bodyFa: typeof body.bodyFa === "string" ? body.bodyFa : existing.bodyFa,
      })
      .where(eq(knowledge.id, existing.id))
      .returning();

    if (Array.isArray(body.slides)) {
      try {
        await replaceSlides(existing.id, body.slides as SlideInput[]);
      } catch (slideError) {
        console.error("knowledge slides save:", slideError);
      }
    }
    await replaceRelated(existing.id, body.relatedSlugs);

    return NextResponse.json({ ok: true, slug: updated.slug, id: updated.id });
  } catch (error) {
    console.error("[hadiran] knowledge patch", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Failed to update knowledge" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  try {
    const { slug } = await params;
    const [existing] = await db.select().from(knowledge).where(eq(knowledge.slug, slug));
    if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await db.delete(knowledge).where(eq(knowledge.id, existing.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete knowledge" }, { status: 500 });
  }
}
