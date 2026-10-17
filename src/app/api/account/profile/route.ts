import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { requireAccount } from "@/lib/auth/guard";
import { displayNameFromParts, normalizePersonName } from "@/lib/auth/profile";
import { ensureAccountProfileSchema } from "@/lib/auth/schema-guard";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const auth = await requireAccount();
  if (auth.error) return auth.error;

  let body: { givenName?: unknown; familyName?: unknown };
  try {
    body = (await request.json()) as { givenName?: unknown; familyName?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const givenName = normalizePersonName(body.givenName);
  const familyName = normalizePersonName(body.familyName);
  if (body.givenName != null && body.givenName !== "" && !givenName) {
    return NextResponse.json({ error: "invalid_given_name" }, { status: 400 });
  }
  if (body.familyName != null && body.familyName !== "" && !familyName) {
    return NextResponse.json({ error: "invalid_family_name" }, { status: 400 });
  }

  await ensureAccountProfileSchema();
  const [updated] = await db
    .update(accounts)
    .set({
      givenName,
      familyName,
      displayName: displayNameFromParts(givenName, familyName),
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, auth.account.id))
    .returning({
      givenName: accounts.givenName,
      familyName: accounts.familyName,
      displayName: accounts.displayName,
    });

  return NextResponse.json({ ok: true, profile: updated });
}
