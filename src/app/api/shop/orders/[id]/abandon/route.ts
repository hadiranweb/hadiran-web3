import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/guard";
import { abandonOrder, ShopError } from "@/lib/shop/orders";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: Ctx) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  const { id } = await params;
  try {
    const order = await abandonOrder({ orderId: id, buyerId: auth.account.id });
    return NextResponse.json({ ok: true, id: order.id, state: order.state });
  } catch (error) {
    if (error instanceof ShopError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[hadiran] shop abandon", error);
    return NextResponse.json({ error: "abandon_failed" }, { status: 500 });
  }
}
