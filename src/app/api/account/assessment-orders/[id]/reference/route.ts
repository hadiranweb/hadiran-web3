import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/guard";
import { AssessmentError, submitAssessmentReference } from "@/lib/finance/assessment-orders";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  let body: { reference?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  try {
    const order = await submitAssessmentReference({
      orderId: id,
      buyerId: auth.account.id,
      reference: typeof body.reference === "string" ? body.reference : "",
    });
    return NextResponse.json({ ok: true, id: order.id, state: order.state });
  } catch (error) {
    if (error instanceof AssessmentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[hadiran] assessment reference", error);
    return NextResponse.json({ error: "reference_failed" }, { status: 500 });
  }
}
