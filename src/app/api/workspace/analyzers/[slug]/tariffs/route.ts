import { NextResponse } from "next/server";
import { requireAnalyzerDesk } from "@/lib/auth/guard";
import { isAssessmentService } from "@/lib/commerce/assessment-policy";
import { AssessmentError, upsertAssessmentTariff } from "@/lib/finance/assessment-orders";
import { parseCommissionPercent, parseTomanInput } from "@/lib/finance/journal";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: Ctx) {
  const auth = await requireAnalyzerDesk();
  if (auth.error) return auth.error;
  const { slug } = await context.params;
  let body: {
    service?: unknown;
    priceToman?: unknown;
    commissionPercent?: unknown;
    rounding?: unknown;
    activate?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (typeof body.service !== "string" || !isAssessmentService(body.service)) {
    return NextResponse.json({ error: "invalid_service" }, { status: 400 });
  }
  try {
    const priceIRR =
      body.priceToman == null || body.priceToman === "" ? undefined : parseTomanInput(String(body.priceToman));
    const commissionBps =
      body.commissionPercent == null || body.commissionPercent === ""
        ? undefined
        : parseCommissionPercent(String(body.commissionPercent));
    const rounding = body.rounding === "floor" || body.rounding === "ceil" ? body.rounding : body.rounding === "" ? null : undefined;
    const row = await upsertAssessmentTariff({
      actorId: auth.account.id,
      actorRole: auth.account.role,
      slug,
      service: body.service,
      priceIRR,
      commissionBps,
      rounding,
      activate: body.activate === true,
    });
    return NextResponse.json({
      ok: true,
      id: row.id,
      version: row.version,
      active: row.active,
      service: row.service,
    });
  } catch (error) {
    if (error instanceof AssessmentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error && /invalid_/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[hadiran] assessment tariff", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
