import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { discountCodes } from "@/db/schema";
import { requireOwner } from "@/lib/auth/guard";
import { ensureAccessSchema } from "@/lib/auth/schema-guard";

export const dynamic = "force-dynamic";

function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(code) || /^\d{8}$/.test(code)) return null;
  return code;
}

export async function GET() {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  await ensureAccessSchema();
  const items = await db.select().from(discountCodes).orderBy(desc(discountCodes.createdAt));
  return NextResponse.json({
    items: items.map((row) => ({
      code: row.code,
      kind: row.kind,
      value: row.value,
      scope: row.scope,
      analyzerSlug: row.analyzerSlug,
      maxUses: row.maxUses,
      usedCount: row.usedCount,
      active: row.active,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  await ensureAccessSchema();
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const code = normalizeCode(body.code);
  if (!code) return NextResponse.json({ error: "کد تخفیف ۳ تا ۳۲ حرف/رقم باشد و ۸رقم خالص نباشد." }, { status: 400 });
  const kind = body.kind === "amount" ? "amount" : "percent";
  const value = typeof body.value === "number" ? body.value : Number(body.value);
  if (!Number.isFinite(value) || value <= 0) return NextResponse.json({ error: "مقدار نامعتبر است." }, { status: 400 });
  if (kind === "percent" && value > 100) return NextResponse.json({ error: "درصد حداکثر ۱۰۰ است." }, { status: 400 });
  const scope = body.scope === "analyzer" || body.scope === "shop" ? body.scope : "any";
  const analyzerSlug = typeof body.analyzerSlug === "string" ? body.analyzerSlug.trim() || null : null;
  const maxUses = body.maxUses == null || body.maxUses === "" ? null : Number(body.maxUses);
  const productId = typeof body.productId === "string" && body.productId.trim() ? body.productId.trim().slice(0, 128) : null;
  const issuerAccountIdRaw = body.issuerAccountId == null ? null : Number(body.issuerAccountId);
  const issuerAccountId =
    productId && issuerAccountIdRaw != null && Number.isInteger(issuerAccountIdRaw) && issuerAccountIdRaw > 0
      ? issuerAccountIdRaw
      : productId
        ? auth.account.id
        : null;
  try {
    await db.insert(discountCodes).values({
      code,
      kind,
      value: Math.round(value),
      scope,
      analyzerSlug: scope === "analyzer" ? analyzerSlug : null,
      maxUses: maxUses != null && Number.isFinite(maxUses) ? Math.round(maxUses) : null,
      createdBy: auth.account.id,
      productId,
      issuerAccountId,
    });
  } catch {
    return NextResponse.json({ error: "این کد قبلاً هست." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  await ensureAccessSchema();
  const body = (await request.json().catch(() => ({}))) as { code?: unknown; active?: unknown };
  const code = normalizeCode(body.code);
  if (!code) return NextResponse.json({ error: "کد نامعتبر است." }, { status: 400 });
  await db
    .update(discountCodes)
    .set({ active: body.active !== false, updatedAt: new Date() })
    .where(eq(discountCodes.code, code));
  return NextResponse.json({ ok: true });
}
