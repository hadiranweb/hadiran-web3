import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/guard";
import {
  consentAttempt,
  readAttempt,
  retakeAttempt,
  saveAnswer,
  submitAttempt,
} from "@/lib/analyzers/casio-ss/attempts";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  const attempt = await readAttempt(auth.account.id);
  return NextResponse.json({ attempt });
}

export async function POST(request: Request) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;

  let body: { action?: unknown; id?: unknown; value?: unknown; referralCode?: unknown; discountCode?: unknown };
  try {
    body = (await request.json()) as { action?: unknown; id?: unknown; value?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (body.action === "retake") {
    const attempt = await retakeAttempt(auth.account.id);
    return NextResponse.json({ attempt });
  }

  if (body.action === "consent") {
    const attempt = await consentAttempt(auth.account.id, {
      referralCode: body.referralCode,
      discountCode: body.discountCode,
    });
    if (attempt && "error" in attempt) {
      return NextResponse.json({ error: attempt.error }, { status: 400 });
    }
    return NextResponse.json({ attempt });
  }

  if (body.action === "answer") {
    if (typeof body.id !== "string") {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const result = await saveAnswer(auth.account.id, body.id, body.value);
    if (!result.ok) {
      const status = result.error === "already_submitted" ? 409 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ attempt: result.attempt });
  }

  if (body.action === "submit") {
    const result = await submitAttempt(auth.account.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ attempt: result.attempt });
  }

  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}
