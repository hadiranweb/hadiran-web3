import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { InvalidPhoneError, normalizePhone } from "@/lib/auth/phone";
import { enforceRateLimit, RateLimitExceededError, rateLimitHeaders } from "@/lib/auth/rate-limit";
import { recordAuthEvent } from "@/lib/auth/audit";
import { requestIp } from "@/lib/auth/request";
import { phoneHasOwnerEnvPassword, verifyOwnerEnvPassword, verifyStoredPassword } from "@/lib/auth/password";
import { completePhoneLogin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const startedAt = Date.now();
  let phone: string | null = null;
  try {
    const body = (await request.json()) as { phone?: string; password?: string };
    phone = normalizePhone(typeof body.phone === "string" ? body.phone : "");
    const password = typeof body.password === "string" ? body.password : "";

    try {
      await enforceRateLimit({
        key: `${phone}:${requestIp(request)}`,
        config: { name: "auth:password:login", limit: 5, windowSeconds: 900 },
      });
    } catch (error) {
      if (error instanceof RateLimitExceededError) {
        await recordAuthEvent({
          request,
          eventType: "password_login",
          outcome: "blocked",
          phone,
          errorCode: "rate_limit_exceeded",
          startedAt,
        });
        return NextResponse.json(
          { error: "rate_limit_exceeded", retry_after_seconds: error.retryAfterSeconds },
          { status: 429, headers: rateLimitHeaders(error) },
        );
      }
      throw error;
    }

    if (!password) {
      return NextResponse.json({ error: "invalid_password" }, { status: 401 });
    }

    const [account] = await db.select().from(accounts).where(eq(accounts.phone, phone)).limit(1);
    let accepted = false;
    if (phoneHasOwnerEnvPassword(phone) && verifyOwnerEnvPassword(password)) {
      accepted = true;
    } else if (account?.passwordHash) {
      accepted = await verifyStoredPassword(password, account.passwordHash);
    }

    if (!accepted) {
      await recordAuthEvent({
        request,
        eventType: "password_login",
        outcome: "failure",
        phone,
        accountId: account?.id ?? null,
        errorCode: "invalid_password",
        startedAt,
      });
      return NextResponse.json({ error: "invalid_password" }, { status: 401 });
    }

    try {
      const result = await completePhoneLogin({ phone, request });
      await recordAuthEvent({
        request,
        eventType: "password_login",
        outcome: "success",
        phone,
        accountId: result.account.id,
        startedAt,
      });
      return NextResponse.json(
        {
          ok: true,
          needs_password: result.needs_password,
          account: {
            id: result.account.id,
            phone: result.account.phone,
            displayName: result.account.displayName,
            role: result.account.role,
          },
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AccountDisabledError") {
        await recordAuthEvent({
          request,
          eventType: "password_login",
          outcome: "blocked",
          phone,
          errorCode: "account_disabled",
          startedAt,
        });
        return NextResponse.json({ error: "account_disabled" }, { status: 403 });
      }
      if (error instanceof Error && error.name === "JwtSecretMissingError") {
        return NextResponse.json({ error: "jwt_not_configured" }, { status: 503 });
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof InvalidPhoneError) {
      return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
    }
    console.error("password login:", error);
    await recordAuthEvent({
      request,
      eventType: "password_login",
      outcome: "failure",
      phone,
      errorCode: "password_login_failed",
      startedAt,
    });
    return NextResponse.json({ error: "password_login_failed" }, { status: 500 });
  }
}
