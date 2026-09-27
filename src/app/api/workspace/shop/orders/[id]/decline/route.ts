import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { declineReceipt, ShopError } from "@/lib/shop/orders";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const reason = typeof body.reason === "string" ? body.reason : "";
  try {
    const order = await declineReceipt({ orderId: id, reason });
    return NextResponse.json({ ok: true, id: order.id, state: order.state });
  } catch (error) {
    if (error instanceof ShopError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[hadiran] shop decline", error);
    return NextResponse.json({ error: "decline_failed" }, { status: 500 });
  }
}
