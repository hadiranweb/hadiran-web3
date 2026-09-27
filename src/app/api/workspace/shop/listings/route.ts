import { NextResponse } from "next/server";
import { db } from "@/db";
import { shopListings } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireOwner } from "@/lib/auth/guard";
import { newCanonicalId } from "@/lib/knowledge/ids";
import { slugify } from "@/lib/markdown";

export const dynamic = "force-dynamic";

function parseListing(body: Record<string, unknown>, existingSlug?: string) {
  const titleFa = typeof body.titleFa === "string" ? body.titleFa.trim() : "";
  const titleEn = typeof body.titleEn === "string" ? body.titleEn.trim() : "";
  const requested = typeof body.slug === "string" ? slugify(body.slug) : "";
  const slug = requested || slugify(titleEn) || existingSlug || "";
  const amount = Number(body.amount);
  if (titleFa.length < 3 || !slug) return null;
  if (["orders", "new", "edit"].includes(slug)) return null;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const courseIdRaw = body.courseId;
  const courseId =
    typeof courseIdRaw === "number"
      ? courseIdRaw
      : typeof courseIdRaw === "string" && courseIdRaw.trim()
        ? Number(courseIdRaw)
        : null;
  return {
    slug,
    titleFa,
    titleEn: titleEn || null,
    summaryFa: typeof body.summaryFa === "string" ? body.summaryFa.trim() || null : null,
    bodyFa: typeof body.bodyFa === "string" ? body.bodyFa : null,
    accessBodyFa: typeof body.accessBodyFa === "string" ? body.accessBodyFa : null,
    amount: Math.round(amount),
    currency: typeof body.currency === "string" && body.currency.trim() ? body.currency.trim() : "IRR",
    courseId: courseId && Number.isFinite(courseId) ? courseId : null,
    published: Boolean(body.published),
  };
}

export async function GET() {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const items = await db.select().from(shopListings).orderBy(desc(shopListings.updatedAt));
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const body = (await request.json()) as Record<string, unknown>;
  const parsed = parseListing(body);
  if (!parsed) {
    return NextResponse.json({ error: "عنوان، اسلاگ لاتین و مبلغ مثبت لازم است." }, { status: 400 });
  }
  const [dup] = await db.select({ id: shopListings.id }).from(shopListings).where(eq(shopListings.slug, parsed.slug));
  if (dup) return NextResponse.json({ error: "این اسلاگ قبلاً استفاده شده است." }, { status: 409 });
  const [created] = await db
    .insert(shopListings)
    .values({ id: newCanonicalId("LISTING"), ...parsed })
    .returning();
  return NextResponse.json({ ok: true, id: created.id, slug: created.slug });
}
