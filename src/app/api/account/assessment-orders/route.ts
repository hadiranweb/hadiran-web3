import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/guard";
import { isAssessmentService } from "@/lib/commerce/assessment-policy";
import { AssessmentError, createAssessmentOrder } from "@/lib/finance/assessment-orders";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  let body: { slug?: unknown; attemptId?: unknown; service?: unknown; discountCode?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (typeof body.slug !== "string" || !body.slug) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }
  if (typeof body.service !== "string" || !isAssessmentService(body.service)) {
    return NextResponse.json({ error: "invalid_service" }, { status: 400 });
  }
  const attemptId = typeof body.attemptId === "number" ? body.attemptId : Number(body.attemptId);
  try {
    const order = await createAssessmentOrder({
      buyerId: auth.account.id,
      buyerRole: auth.account.role,
      slug: body.slug,
      attemptId,
      service: body.service,
      discountCode: body.discountCode,
    });
    return NextResponse.json({
      ok: true,
      id: order.id,
      state: order.state,
      payableIrr: String(order.payableIrr),
    });
  } catch (error) {
    if (error instanceof AssessmentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[hadiran] assessment order", error);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
