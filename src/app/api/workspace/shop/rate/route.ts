import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { getShopUsdRate, updateShopUsdRateAndPrices } from "@/lib/shop/price-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const rate = await getShopUsdRate();
  return NextResponse.json({ usdRate: rate });
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const body = (await request.json()) as { usdRate?: unknown };
  const rate = Number(body.usdRate);
  if (!Number.isFinite(rate) || rate <= 0) {
    return NextResponse.json({ error: "نرخ دلار باید عدد مثبت باشد." }, { status: 400 });
  }
  try {
    const updated = await updateShopUsdRateAndPrices(rate);
    return NextResponse.json({ ok: true, usdRate: rate, updatedListings: updated });
  } catch {
    return NextResponse.json({ error: "ثبت نرخ ممکن نشد." }, { status: 500 });
  }
}
