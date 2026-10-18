import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { recordAuthEvent } from "@/lib/auth/audit";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import { consumePasswordSetupToken } from "@/lib/auth/password-setup";
import { completePhoneLogin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const body = (await request.json()) as { token?: unknown; password?: unknown };
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!token) return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    const invalid = validatePassword(password);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    const accountId = await consumePasswordSetupToken(token);
    if (!accountId) return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 401 });

    const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
    if (!account) return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 401 });
    if (account.passwordHash) {
      return NextResponse.json({ error: "password_already_set" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    await db
      .update(accounts)
      .set({ passwordHash, passwordSetAt: new Date(), updatedAt: new Date() })
      .where(eq(accounts.id, account.id));

    await completePhoneLogin({ phone: account.phone, request });
    await recordAuthEvent({
      request,
      eventType: "password_set",
      outcome: "success",
      phone: account.phone,
      accountId: account.id,
      startedAt,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "password_set_failed" }, { status: 500 });
  }
}
