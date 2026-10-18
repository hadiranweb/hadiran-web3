import { cookies } from "next/headers";
import { issuePreviewTicket } from "@/lib/auth/preview-ticket";
import { PREVIEW_OWNER_COOKIE } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { otpChallenges } from "@/db/schema";
import { InvalidPhoneError, normalizePhone, normalizeDigits } from "@/lib/auth/phone";
import { hashSecret, hashesMatch } from "@/lib/auth/crypto";
import { enforceRateLimit, RateLimitExceededError, rateLimitHeaders } from "@/lib/auth/rate-limit";
import { recordAuthEvent } from "@/lib/auth/audit";
import { requestIp } from "@/lib/auth/request";
import { OTP_MAX_ATTEMPTS, developmentTestLogin } from "@/lib/auth/config";
import { completePhoneLogin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const startedAt = Date.now();
  let phone: string | null = null;
  try {
    const body = (await request.json()) as { phone?: string; code?: string };
    phone = normalizePhone(typeof body.phone === "string" ? body.phone : "");
    const code = typeof body.code === "string" ? normalizeDigits(body.code).replace(/\s/g, "") : "";
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "invalid_code" }, { status: 400 });
    }

    const preview = developmentTestLogin();
    if (preview && phone === preview.phone) {
      if (code !== preview.code) return NextResponse.json({ error: "invalid_or_expired_code" }, { status: 401 });
      const ticket = issuePreviewTicket();
      if (!ticket) return NextResponse.json({ error: "preview_unavailable" }, { status: 503 });
      const jar = await cookies();
      jar.set(PREVIEW_OWNER_COOKIE, ticket, { httpOnly: true, sameSite: "lax", secure: request.headers.get("x-forwarded-proto") === "https", path: "/", maxAge: 3600 });
      return NextResponse.json({ ok: true, auth_version: "P3", preview_ticket: ticket, account: { id: 0, phone, role: "owner", displayName: "مالک آزمایشی" } }, { headers: { "Cache-Control": "no-store" } });
    }

    try {
      await enforceRateLimit({
        key: `${phone}:${requestIp(request)}`,
        config: { name: "auth:otp:verify", limit: 10, windowSeconds: 600 },
      });
    } catch (error) {
      if (error instanceof RateLimitExceededError) {
        await recordAuthEvent({
          request,
          eventType: "otp_verify",
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

    const [pending] = await db
      .select()
      .from(otpChallenges)
      .where(
        and(
          eq(otpChallenges.phone, phone),
          eq(otpChallenges.purpose, "login"),
          isNull(otpChallenges.consumedAt),
        ),
      )
      .orderBy(desc(otpChallenges.createdAt))
      .limit(1);

    if (!pending || pending.expiresAt.getTime() <= Date.now() || pending.attempts >= OTP_MAX_ATTEMPTS) {
      await recordAuthEvent({
        request,
        eventType: "otp_verify",
        outcome: "failure",
        phone,
        errorCode: "invalid_or_expired_code",
        startedAt,
      });
      return NextResponse.json({ error: "invalid_or_expired_code" }, { status: 401 });
    }

    await db
      .update(otpChallenges)
      .set({ attempts: pending.attempts + 1 })
      .where(eq(otpChallenges.id, pending.id));

    if (!hashesMatch(pending.codeHash, hashSecret(code))) {
      await recordAuthEvent({
        request,
        eventType: "otp_verify",
        outcome: "failure",
        phone,
        errorCode: "invalid_or_expired_code",
        startedAt,
      });
      return NextResponse.json({ error: "invalid_or_expired_code" }, { status: 401 });
    }

    await db
      .update(otpChallenges)
      .set({ consumedAt: new Date() })
      .where(eq(otpChallenges.id, pending.id));

    try {
      const { account, needs_password } = await completePhoneLogin({ phone, request });
      await recordAuthEvent({
        request,
        eventType: "otp_verify",
        outcome: "success",
        phone,
        accountId: account.id,
        startedAt,
      });
      return NextResponse.json({
        ok: true,
        needs_password,
        account: {
          id: account.id,
          phone: account.phone,
          displayName: account.displayName,
          role: account.role,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AccountDisabledError") {
        await recordAuthEvent({
          request,
          eventType: "otp_verify",
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
    console.error("otp verify:", error);
    await recordAuthEvent({
      request,
      eventType: "otp_verify",
      outcome: "failure",
      phone,
      errorCode: "otp_verify_failed",
      startedAt,
    });
    return NextResponse.json({ error: "otp_verify_failed" }, { status: 500 });
  }
}
