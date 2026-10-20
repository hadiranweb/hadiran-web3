import { NextResponse } from "next/server";
import { db } from "@/db";
import { knowledge, knowledgeSlides } from "@/db/schema";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/markdown";
import { requireAccount } from "@/lib/auth/guard";
import { getPublicKnowledgeBySlug } from "@/lib/knowledge/public";
import { parseArticleLayers, parseClosingOptions, parseSimulator } from "@/lib/knowledge/article";
import { commitKnowledgeArticle, parseBaseRevision, RevisionConflict } from "@/lib/knowledge/commit";
import { knowledgeCommitExecutor } from "@/lib/knowledge/related-db";

export const dynamic = "force-dynamic";

const TYPES = ["wiki", "article", "note", "research", "idea"] as const;

type SlideInput = {
  sortOrder?: number;
  titleFa?: string | null;
  titleEn?: string | null;
  bodyFa?: string | null;
  bodyEn?: string | null;
};

function articleLayers(body: Record<string, unknown>, existing: typeof knowledge.$inferSelect) {
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
  });
  const summaryFa =
    typeof body.summaryFa === "string" || body.summaryFa === null
      ? typeof body.summaryFa === "string"
        ? body.summaryFa.trim() || null
        : null
      : existing.summaryFa;
  const { relatedSlugs: _related, ...columns } = layers;
  return { ...columns, summaryFa };
}

async function replaceSlides(
  tx: { delete: typeof db.delete; insert: typeof db.insert },
  knowledgeId: number,
  slides: SlideInput[],
) {
  await tx.delete(knowledgeSlides).where(eq(knowledgeSlides.knowledgeId, knowledgeId));
  if (slides.length === 0) return;
  await tx.insert(knowledgeSlides).values(
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
    const baseRevision = parseBaseRevision(body.baseRevision);
    if (baseRevision == null) {
      return NextResponse.json({ error: "revision_required", revision: existing.revision }, { status: 409 });
    }
    if (baseRevision !== existing.revision) {
      return NextResponse.json({ error: "revision_conflict", revision: existing.revision }, { status: 409 });
    }

    const layers = articleLayers(body, existing);
    let columns: Record<string, unknown> = layers;

    if (!existing.memoryItemId) {
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
      columns = {
        ...layers,
        slug: nextSlug,
        type,
        titleFa,
        titleEn: typeof body.titleEn === "string" ? body.titleEn : existing.titleEn,
        bodyFa: typeof body.bodyFa === "string" ? body.bodyFa : existing.bodyFa,
      };
    }

    const updated = await db.transaction(async (tx) => {
      const saved = await commitKnowledgeArticle(knowledgeCommitExecutor(tx), {
        id: existing.id,
        baseRevision,
        columns,
        relatedSlugs: body.relatedSlugs,
      });
      if (Array.isArray(body.slides)) {
        await replaceSlides(tx, existing.id, body.slides as SlideInput[]);
      }
      return saved;
    });

    return NextResponse.json({ ok: true, slug: updated.slug, id: updated.id, revision: updated.revision });
  } catch (error) {
    if (error instanceof RevisionConflict) {
      return NextResponse.json({ error: "revision_conflict", revision: error.currentRevision }, { status: 409 });
    }
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
