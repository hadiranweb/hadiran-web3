import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { otpChallenges } from "@/db/schema";
import { InvalidPhoneError, maskPhone, normalizePhone } from "@/lib/auth/phone";
import { hashSecret, sixDigitCode } from "@/lib/auth/crypto";
import { sendSmsIrVerificationCode, SmsProviderError } from "@/lib/auth/smsir";
import { enforceRateLimit, RateLimitExceededError, rateLimitHeaders } from "@/lib/auth/rate-limit";
import { recordAuthEvent } from "@/lib/auth/audit";
import { requestId, requestIp } from "@/lib/auth/request";
import { OTP_TTL_SECONDS, isProduction, smsIrConfig } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const startedAt = Date.now();
  let phone: string | null = null;
  try {
    const body = (await request.json()) as { phone?: string };
    phone = normalizePhone(typeof body.phone === "string" ? body.phone : "");

    try {
      await enforceRateLimit({
        key: phone,
        config: { name: "auth:otp:send", limit: 1, windowSeconds: 60 },
      });
      await enforceRateLimit({
        key: requestIp(request),
        config: { name: "auth:otp:send:ip", limit: 5, windowSeconds: 600 },
      });
    } catch (error) {
      if (error instanceof RateLimitExceededError) {
        await recordAuthEvent({
          request,
          eventType: "otp_send",
          outcome: "blocked",
          phone,
          errorCode: "rate_limit_exceeded",
          startedAt,
        });
        return NextResponse.json(
          { error: "rate_limit_exceeded", retry_after_seconds: error.retryAfterSeconds },
          { status: 429, headers: rateLimitHeaders(error) }
        );
      }
      throw error;
    }

    const code = sixDigitCode();
    const [inserted] = await db
      .insert(otpChallenges)
      .values({
        phone,
        purpose: "login",
        codeHash: hashSecret(code),
        expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
        requestId: requestId(request),
      })
      .returning({ id: otpChallenges.id });

    const sms = smsIrConfig();
    if (!sms.configured && !isProduction()) {
      console.info(`[hadiran-otp] dev code for ${maskPhone(phone)}: ${code}`);
      await recordAuthEvent({
        request,
        eventType: "otp_send",
        outcome: "success",
        phone,
        startedAt,
        metadata: { provider: "dev" },
      });
      return NextResponse.json({
        ok: true,
        expires_in_seconds: OTP_TTL_SECONDS,
        delivery: "dev",
        masked_phone: maskPhone(phone),
        dev_code: code,
      });
    }

    try {
      const result = await sendSmsIrVerificationCode({ phone, code });
      if (inserted?.id) {
        await db
          .update(otpChallenges)
          .set({ providerMessageId: result.messageId ?? null })
          .where(eq(otpChallenges.id, inserted.id));
      }
      await recordAuthEvent({
        request,
        eventType: "otp_send",
        outcome: "success",
        phone,
        startedAt,
        metadata: { provider: "sms.ir" },
      });
      return NextResponse.json({
        ok: true,
        expires_in_seconds: OTP_TTL_SECONDS,
        delivery: "sms",
        masked_phone: maskPhone(phone),
      });
    } catch (error) {
      if (inserted?.id) {
        await db
          .update(otpChallenges)
          .set({ consumedAt: new Date() })
          .where(eq(otpChallenges.id, inserted.id));
      }
      if (error instanceof SmsProviderError) {
        await recordAuthEvent({
          request,
          eventType: "otp_send",
          outcome: "failure",
          phone,
          errorCode: error.message,
          startedAt,
        });
        return NextResponse.json({ error: error.message }, { status: error.statusCode });
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof InvalidPhoneError) {
      await recordAuthEvent({
        request,
        eventType: "otp_send",
        outcome: "failure",
        errorCode: "invalid_phone",
        startedAt,
      });
      return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
    }
    console.error("otp send:", error);
    await recordAuthEvent({
      request,
      eventType: "otp_send",
      outcome: "failure",
      phone,
      errorCode: "otp_send_failed",
      startedAt,
    });
    return NextResponse.json({ error: "otp_send_failed" }, { status: 500 });
  }
}
