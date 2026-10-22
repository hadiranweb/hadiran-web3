import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/auth/guard";
import { consentAttempt, readAttempt, retakeAttempt, saveAnswer, submitAttempt } from "@/lib/analyzers/attempts";
import { loadPack } from "@/lib/analyzers/registry";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

async function resolveRunnablePack(slug: string, account: { id: number; role: string }) {
  const pack = await loadPack(slug);
  if (!pack) return null;
  if (pack.status === "archived") return null;
  if (pack.status === "open") return pack;
  if (account.role === "owner") return pack;
  const { analyzerAccess } = await import("@/lib/analyzers/access");
  const access = await analyzerAccess(account, slug);
  return access.edit ? pack : null;
}

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  const { slug } = await params;
  const pack = await resolveRunnablePack(slug, auth.account);
  if (!pack) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const attempt = await readAttempt(auth.account.id, pack);
  return NextResponse.json({ attempt, packVersion: pack.version });
}

export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;
  const { slug } = await params;
  const pack = await resolveRunnablePack(slug, auth.account);
  if (!pack) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let body: { action?: unknown; id?: unknown; value?: unknown; referralCode?: unknown; discountCode?: unknown };
  try {
    body = (await request.json()) as { action?: unknown; id?: unknown; value?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (body.action === "retake") {
    const attempt = await retakeAttempt(auth.account.id, pack);
    return NextResponse.json({ attempt });
  }

  if (body.action === "consent") {
    const attempt = await consentAttempt(auth.account.id, pack, {
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
    const result = await saveAnswer(auth.account.id, pack, body.id, body.value);
    if (!result.ok) {
      const status = result.error === "already_submitted" ? 409 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ attempt: result.attempt });
  }

  if (body.action === "submit") {
    const result = await submitAttempt(auth.account.id, pack);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ attempt: result.attempt });
  }

  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}
