import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { requireAccount } from "@/lib/auth/guard";
import { hasPersonName, onboardingFlags } from "@/lib/auth/onboarding";
import { displayNameFromParts, normalizePersonName } from "@/lib/auth/profile";
import { ensureAccountProfileSchema } from "@/lib/auth/schema-guard";
import { privacyPolicyVersion } from "@/lib/privacy/version";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;

  let body: { step?: unknown; givenName?: unknown; familyName?: unknown; accept?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  await ensureAccountProfileSchema();
  const [row] = await db.select().from(accounts).where(eq(accounts.id, auth.account.id)).limit(1);
  if (!row) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (body.step === "policies") {
    if (body.accept !== true) {
      return NextResponse.json({ error: "policies_not_accepted" }, { status: 400 });
    }
    const named = hasPersonName(row.givenName, row.familyName);
    const now = new Date();
    await db
      .update(accounts)
      .set({
        policiesAcceptedAt: now,
        policiesVersion: privacyPolicyVersion(),
        onboardingCompletedAt: named ? (row.onboardingCompletedAt ?? now) : null,
        updatedAt: now,
      })
      .where(eq(accounts.id, auth.account.id));
    return NextResponse.json({
      ok: true,
      policiesAccepted: true,
      needsProfile: !named,
      onboardingComplete: named,
    });
  }

  if (body.step === "profile") {
    const flags = onboardingFlags(row);
    if (!flags.policiesAccepted) {
      return NextResponse.json({ error: "policies_required" }, { status: 400 });
    }
    const givenName = normalizePersonName(body.givenName);
    const familyName = normalizePersonName(body.familyName);
    if (!givenName) return NextResponse.json({ error: "invalid_given_name" }, { status: 400 });
    if (!familyName) return NextResponse.json({ error: "invalid_family_name" }, { status: 400 });

    await db
      .update(accounts)
      .set({
        givenName,
        familyName,
        displayName: displayNameFromParts(givenName, familyName),
        onboardingCompletedAt: row.onboardingCompletedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, auth.account.id));
    return NextResponse.json({ ok: true, policiesAccepted: true, needsProfile: false, onboardingComplete: true });
  }

  return NextResponse.json({ error: "invalid_step" }, { status: 400 });
}
