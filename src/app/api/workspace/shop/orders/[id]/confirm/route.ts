import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { confirmReceipt, ShopError } from "@/lib/shop/orders";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await params;
  try {
    const order = await confirmReceipt({ orderId: id });
    return NextResponse.json({ ok: true, id: order.id, state: order.state });
  } catch (error) {
    if (error instanceof ShopError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[hadiran] shop confirm", error);
    return NextResponse.json({ error: "confirm_failed" }, { status: 500 });
  }
}
