import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { recordAuthEvent } from "@/lib/auth/audit";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import { getCurrentAccount } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const session = await getCurrentAccount();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { password?: string };
    const password = typeof body.password === "string" ? body.password : "";
    const invalid = validatePassword(password);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 });
    }

    const [account] = await db.select().from(accounts).where(eq(accounts.id, session.id)).limit(1);
    if (!account) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (account.passwordHash) {
      return NextResponse.json({ error: "password_already_set" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    await db
      .update(accounts)
      .set({
        passwordHash,
        passwordSetAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, account.id));

    await recordAuthEvent({
      request,
      eventType: "password_set",
      outcome: "success",
      phone: account.phone,
      accountId: account.id,
      startedAt,
    });

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("password set:", error);
    await recordAuthEvent({
      request,
      eventType: "password_set",
      outcome: "failure",
      accountId: session.id,
      errorCode: "password_set_failed",
      startedAt,
    });
    return NextResponse.json({ error: "password_set_failed" }, { status: 500 });
  }
}
