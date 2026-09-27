import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/guard";
import { ShopError, submitReference } from "@/lib/shop/orders";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const reference = typeof body.reference === "string" ? body.reference : "";
  try {
    const order = await submitReference({ orderId: id, buyerId: auth.account.id, reference });
    return NextResponse.json({ ok: true, id: order.id, state: order.state });
  } catch (error) {
    if (error instanceof ShopError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[hadiran] shop reference", error);
    return NextResponse.json({ error: "reference_failed" }, { status: 500 });
  }
}
