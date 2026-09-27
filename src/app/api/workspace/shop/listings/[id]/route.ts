import { NextResponse } from "next/server";
import { db } from "@/db";
import { shopListings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireOwner } from "@/lib/auth/guard";
import { slugify } from "@/lib/markdown";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
  const [existing] = await db.select().from(shopListings).where(eq(shopListings.id, id));
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const body = (await request.json()) as Record<string, unknown>;
  const titleFa =
    typeof body.titleFa === "string" && body.titleFa.trim().length >= 3
      ? body.titleFa.trim()
      : existing.titleFa;
  const titleEn = typeof body.titleEn === "string" ? body.titleEn.trim() || null : existing.titleEn;
  const nextSlug =
    typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug) : existing.slug;
  if (!nextSlug) return NextResponse.json({ error: "اسلاگ نامعتبر است." }, { status: 400 });
  if (["orders", "new", "edit"].includes(nextSlug)) {
    return NextResponse.json({ error: "این اسلاگ رزرو شده است." }, { status: 400 });
  }
  if (nextSlug !== existing.slug) {
    const [dup] = await db.select({ id: shopListings.id }).from(shopListings).where(eq(shopListings.slug, nextSlug));
    if (dup) return NextResponse.json({ error: "این اسلاگ قبلاً استفاده شده است." }, { status: 409 });
  }
  const amountRaw = body.amount;
  const amount =
    typeof amountRaw === "number"
      ? amountRaw
      : typeof amountRaw === "string" && amountRaw.trim()
        ? Number(amountRaw)
        : existing.amount;
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "مبلغ باید مثبت باشد." }, { status: 400 });
  }
  const courseIdRaw = body.courseId;
  let courseId = existing.courseId;
  if (courseIdRaw === "" || courseIdRaw === null) courseId = null;
  else if (typeof courseIdRaw === "number") courseId = courseIdRaw;
  else if (typeof courseIdRaw === "string" && courseIdRaw.trim()) courseId = Number(courseIdRaw);

  const [updated] = await db
    .update(shopListings)
    .set({
      titleFa,
      titleEn,
      slug: nextSlug,
      summaryFa: typeof body.summaryFa === "string" ? body.summaryFa.trim() || null : existing.summaryFa,
      bodyFa: typeof body.bodyFa === "string" ? body.bodyFa : existing.bodyFa,
      accessBodyFa: typeof body.accessBodyFa === "string" ? body.accessBodyFa : existing.accessBodyFa,
      amount: Math.round(amount),
      currency: typeof body.currency === "string" && body.currency.trim() ? body.currency.trim() : existing.currency,
      courseId: courseId && Number.isFinite(courseId) ? courseId : null,
      published: typeof body.published === "boolean" ? body.published : existing.published,
      updatedAt: new Date(),
    })
    .where(eq(shopListings.id, id))
    .returning();
  return NextResponse.json({ ok: true, id: updated.id, slug: updated.slug });
}
