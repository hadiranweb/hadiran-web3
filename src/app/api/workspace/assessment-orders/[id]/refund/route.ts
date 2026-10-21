import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { AssessmentError, refundAssessmentOrder } from "@/lib/finance/assessment-orders";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  try {
    const order = await refundAssessmentOrder({ orderId: id, actorId: auth.account.id });
    return NextResponse.json({ ok: true, id: order.id, state: order.state });
  } catch (error) {
    if (error instanceof AssessmentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[hadiran] assessment refund", error);
    return NextResponse.json({ error: "refund_failed" }, { status: 500 });
  }
}
