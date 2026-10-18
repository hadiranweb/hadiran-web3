import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { otpChallenges } from "@/db/schema";
import { OTP_TTL_SECONDS, smsIrConfig } from "@/lib/auth/config";
import { hashSecret, hashesMatch, sixDigitCode } from "@/lib/auth/crypto";
import { enforceRateLimit, RateLimitExceededError } from "@/lib/auth/rate-limit";
import { sendSmsIrVerificationCode, SmsProviderError } from "@/lib/auth/smsir";

export async function issueLoginOtp(phone: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await enforceRateLimit({ key: phone, config: { name: "auth:otp:send", limit: 1, windowSeconds: 60 } });
  } catch (error) {
    if (error instanceof RateLimitExceededError) return { ok: false, error: "rate_limit" };
    throw error;
  }

  await db
    .update(otpChallenges)
    .set({ consumedAt: new Date() })
    .where(and(eq(otpChallenges.phone, phone), eq(otpChallenges.purpose, "login"), isNull(otpChallenges.consumedAt)));

  const code = sixDigitCode();
  const [inserted] = await db
    .insert(otpChallenges)
    .values({
      phone,
      purpose: "login",
      codeHash: hashSecret(code),
      expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
    })
    .returning({ id: otpChallenges.id });

  const sms = smsIrConfig();
  if (!sms.configured) {
    return { ok: false, error: "use_contact" };
  }

  try {
    await sendSmsIrVerificationCode({ phone, code });
    return { ok: true };
  } catch (error) {
    if (inserted?.id) {
      await db.update(otpChallenges).set({ consumedAt: new Date() }).where(eq(otpChallenges.id, inserted.id));
    }
    if (error instanceof SmsProviderError) return { ok: false, error: "sms_failed" };
    return { ok: false, error: "sms_failed" };
  }
}

export async function consumeLoginOtp(phone: string, code: string): Promise<boolean> {
  const trimmed = code.replace(/\D/g, "");
  if (trimmed.length !== 6) return false;
  const [pending] = await db
    .select()
    .from(otpChallenges)
    .where(and(eq(otpChallenges.phone, phone), eq(otpChallenges.purpose, "login"), isNull(otpChallenges.consumedAt)))
    .orderBy(desc(otpChallenges.createdAt))
    .limit(1);
  if (!pending || pending.expiresAt.getTime() < Date.now()) return false;
  if (pending.attempts >= 5) return false;
  await db
    .update(otpChallenges)
    .set({ attempts: pending.attempts + 1 })
    .where(eq(otpChallenges.id, pending.id));
  if (!hashesMatch(pending.codeHash, hashSecret(trimmed))) return false;
  await db.update(otpChallenges).set({ consumedAt: new Date() }).where(eq(otpChallenges.id, pending.id));
  return true;
}
