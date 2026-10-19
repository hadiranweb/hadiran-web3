import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import {
  deletePerson,
  loadPerson,
  setAttemptReferrer,
  setChildReferrer,
  setPersonActive,
  setPersonReferrer,
  setPersonRole,
  wipePerson,
} from "@/lib/auth/people";
import { peopleErrorFa } from "@/lib/auth/people-errors";
import { normalizePublicCode } from "@/lib/auth/public-code";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

function fail(error: string, status = 400) {
  return NextResponse.json({ error: peopleErrorFa(error) }, { status });
}

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { code } = await params;
  const publicCode = normalizePublicCode(code);
  if (!publicCode) return fail("unknown_code");
  const person = await loadPerson(publicCode);
  if (!person) return fail("unknown_code", 404);
  return NextResponse.json({ person });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { code } = await params;
  const publicCode = normalizePublicCode(code);
  if (!publicCode) return fail("unknown_code");
  const body = (await request.json().catch(() => ({}))) as {
    role?: unknown;
    isActive?: unknown;
    referredBy?: unknown;
    referred?: { publicCode?: unknown; referredBy?: unknown };
    attempt?: { kind?: unknown; id?: unknown; referrer?: unknown };
    wipe?: unknown;
    confirm?: unknown;
  };
  const actorId = auth.account.id;

  let result: { ok: true } | { ok: false; error: string } | null = null;

  if (body.role === "author" || body.role === "member") {
    result = await setPersonRole({ publicCode, role: body.role, actorId });
    if (!result.ok) return fail(result.error);
  }
  if (typeof body.isActive === "boolean") {
    result = await setPersonActive({ publicCode, isActive: body.isActive, actorId });
    if (!result.ok) return fail(result.error);
  }
  if ("referredBy" in body && body.referred == null && body.attempt == null && body.wipe == null) {
    result = await setPersonReferrer({ publicCode, referredBy: body.referredBy, actorId });
    if (!result.ok) return fail(result.error);
  }
  if (body.referred && typeof body.referred === "object") {
    const childCode = normalizePublicCode(body.referred.publicCode);
    if (!childCode) return fail("unknown_child");
    result = await setChildReferrer({
      publicCode,
      childCode,
      referredBy: body.referred.referredBy,
      actorId,
    });
    if (!result.ok) return fail(result.error);
  }
  if (body.attempt && typeof body.attempt === "object") {
    const kind = body.attempt.kind === "casio" || body.attempt.kind === "analyzer" ? body.attempt.kind : null;
    const attemptId = typeof body.attempt.id === "number" ? body.attempt.id : Number(body.attempt.id);
    if (!kind || !Number.isInteger(attemptId) || attemptId < 1) return fail("attempt_missing");
    result = await setAttemptReferrer({
      publicCode,
      kind,
      attemptId,
      referrer: body.attempt.referrer,
      actorId,
    });
    if (!result.ok) return fail(result.error);
  }
  if (body.wipe != null) {
    result = await wipePerson({ publicCode, fields: body.wipe, confirm: body.confirm, actorId });
    if (!result.ok) return fail(result.error);
  }

  if (!result) return NextResponse.json({ error: "چیزی برای تغییر نبود." }, { status: 400 });
  const person = await loadPerson(publicCode);
  return NextResponse.json({ ok: true, person });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { code } = await params;
  const publicCode = normalizePublicCode(code);
  if (!publicCode) return fail("unknown_code");
  const body = (await request.json().catch(() => ({}))) as { confirm?: unknown };
  const result = await deletePerson({ publicCode, confirm: body.confirm, actorId: auth.account.id });
  if (!result.ok) return fail(result.error);
  return NextResponse.json({ ok: true });
}
