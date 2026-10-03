import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { InvalidPhoneError, maskPhone, normalizePhone } from "@/lib/auth/phone";
import { enforceRateLimit, RateLimitExceededError, rateLimitHeaders } from "@/lib/auth/rate-limit";
import { recordAuthEvent } from "@/lib/auth/audit";
import { requestIp } from "@/lib/auth/request";
import { phoneHasOwnerEnvPassword } from "@/lib/auth/password";
import { ensureAccountPasswordColumns } from "@/lib/auth/schema-guard";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const startedAt = Date.now();
  let phone: string | null = null;
  try {
    const body = (await request.json()) as { phone?: string };
    phone = normalizePhone(typeof body.phone === "string" ? body.phone : "");

    try {
      await enforceRateLimit({
        key: `${phone}:${requestIp(request)}`,
        config: { name: "auth:lookup", limit: 20, windowSeconds: 600 },
      });
    } catch (error) {
      if (error instanceof RateLimitExceededError) {
        return NextResponse.json(
          { error: "rate_limit_exceeded", retry_after_seconds: error.retryAfterSeconds },
          { status: 429, headers: rateLimitHeaders(error) },
        );
      }
      throw error;
    }

    const ownerPass = phoneHasOwnerEnvPassword(phone);
    let accountId: number | null = null;
    let hasDbPassword = false;
    try {
      await ensureAccountPasswordColumns();
      const [account] = await db
        .select({ id: accounts.id, passwordHash: accounts.passwordHash })
        .from(accounts)
        .where(eq(accounts.phone, phone))
        .limit(1);
      accountId = account?.id ?? null;
      hasDbPassword = Boolean(account?.passwordHash);
    } catch (error) {
      console.error("[hadiran] auth lookup db", error);
      if (!ownerPass) {
        return NextResponse.json({ error: "lookup_failed" }, { status: 503 });
      }
    }

    const has_password = ownerPass || hasDbPassword;

    await recordAuthEvent({
      request,
      eventType: "auth_lookup",
      outcome: "success",
      phone,
      accountId,
      startedAt,
    });

    return NextResponse.json(
      {
        ok: true,
        masked_phone: maskPhone(phone),
        has_password,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof InvalidPhoneError) {
      return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
    }
    console.error("auth lookup:", error);
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }
}
