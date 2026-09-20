import { NextResponse } from "next/server";
import { db } from "@/db";
import { knowledge, knowledgeSlides } from "@/db/schema";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/markdown";
import { requireAccount } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

const TYPES = ["wiki", "article", "note", "research", "idea"] as const;

type SlideInput = {
  id?: number;
  sortOrder?: number;
  titleFa?: string | null;
  titleEn?: string | null;
  bodyFa?: string | null;
  bodyEn?: string | null;
};

function parseArticle(body: Record<string, unknown>) {
  const titleFa = typeof body.titleFa === "string" ? body.titleFa.trim() : "";
  const titleEn = typeof body.titleEn === "string" ? body.titleEn.trim() : "";
  const requestedSlug = typeof body.slug === "string" ? slugify(body.slug) : "";
  const slug = requestedSlug || slugify(titleEn || titleFa);
  const type = TYPES.includes(body.type as (typeof TYPES)[number])
    ? (body.type as (typeof TYPES)[number])
    : "article";
  if (titleFa.length < 3 || !slug) return null;
  if (["new", "edit", "write"].includes(slug)) return null;
  return {
    slug,
    type,
    titleFa,
    titleEn: titleEn || null,
    summaryFa: typeof body.summaryFa === "string" ? body.summaryFa : null,
    bodyFa: typeof body.bodyFa === "string" ? body.bodyFa : null,
    slides: Array.isArray(body.slides) ? (body.slides as SlideInput[]) : [],
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
    }))
  );
}

export async function GET() {
  try {
    const rows = await db.select().from(knowledge);
    return NextResponse.json({ items: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = parseArticle(body);
    if (!parsed) {
      return NextResponse.json(
        { error: "عنوان فارسی و اسلاگ لاتین لازم است؛ اسلاگ‌های new/edit رزرو شده‌اند." },
        { status: 400 }
      );
    }

    const [dup] = await db.select({ id: knowledge.id }).from(knowledge).where(eq(knowledge.slug, parsed.slug));
    if (dup) {
      return NextResponse.json({ error: "این اسلاگ قبلاً استفاده شده است" }, { status: 409 });
    }

    const [created] = await db
      .insert(knowledge)
      .values({
        slug: parsed.slug,
        type: parsed.type,
        titleFa: parsed.titleFa,
        titleEn: parsed.titleEn,
        summaryFa: parsed.summaryFa,
        bodyFa: parsed.bodyFa,
      })
      .returning();

    try {
      await replaceSlides(created.id, parsed.slides);
    } catch (slideError) {
      console.error("knowledge slides save:", slideError);
    }
    return NextResponse.json({ ok: true, slug: created.slug, id: created.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create knowledge" }, { status: 500 });
  }
}
