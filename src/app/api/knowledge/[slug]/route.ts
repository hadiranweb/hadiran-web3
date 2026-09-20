import { NextResponse } from "next/server";
import { db } from "@/db";
import { knowledge, knowledgeSlides } from "@/db/schema";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/markdown";
import { requireAccount } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

const TYPES = ["wiki", "article", "note", "research", "idea"] as const;

type SlideInput = {
  sortOrder?: number;
  titleFa?: string | null;
  titleEn?: string | null;
  bodyFa?: string | null;
  bodyEn?: string | null;
};

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
    }))
  );
}

interface Ctx {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: Ctx) {
  const { slug } = await params;
  const [item] = await db.select().from(knowledge).where(eq(knowledge.slug, slug));
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const slides = await db
    .select()
    .from(knowledgeSlides)
    .where(eq(knowledgeSlides.knowledgeId, item.id));
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
    const titleFa =
      typeof body.titleFa === "string" ? body.titleFa.trim() : existing.titleFa;
    const nextSlug =
      typeof body.slug === "string" && body.slug.trim()
        ? slugify(body.slug)
        : existing.slug;
    if (["new", "edit", "write"].includes(nextSlug)) {
      return NextResponse.json({ error: "این اسلاگ رزرو شده است" }, { status: 400 });
    }
    if (nextSlug !== existing.slug) {
      const [dup] = await db
        .select({ id: knowledge.id })
        .from(knowledge)
        .where(eq(knowledge.slug, nextSlug));
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
        slug: nextSlug,
        type,
        titleFa,
        titleEn: typeof body.titleEn === "string" ? body.titleEn : existing.titleEn,
        summaryFa: typeof body.summaryFa === "string" ? body.summaryFa : existing.summaryFa,
        bodyFa: typeof body.bodyFa === "string" ? body.bodyFa : existing.bodyFa,
        updatedAt: new Date(),
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

    return NextResponse.json({ ok: true, slug: updated.slug, id: updated.id });
  } catch (error) {
    console.error(error);
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
