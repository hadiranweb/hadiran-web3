import { db } from "@/db";
import { authEvents } from "@/db/schema";
import { requestIp, requestUserAgent } from "./request";

type AuthEventInput = {
  request: Request;
  eventType: string;
  outcome: "success" | "failure" | "blocked";
  accountId?: number | null;
  phone?: string | null;
  errorCode?: string | null;
  startedAt?: number;
  metadata?: Record<string, unknown>;
};

function safeMetadata(metadata: Record<string, unknown> = {}) {
  const forbidden = /pass(word)?|token|secret|code|authorization|cookie|otp/i;
  return Object.fromEntries(Object.entries(metadata).filter(([key]) => !forbidden.test(key)));
}

export async function recordAuthEvent(input: AuthEventInput) {
  const latency = input.startedAt ? Math.max(0, Date.now() - input.startedAt) : null;
  try {
    await db.insert(authEvents).values({
      accountId: input.accountId ?? null,
      phone: input.phone ?? null,
      eventType: input.eventType,
      outcome: input.outcome,
      errorCode: input.errorCode ?? null,
      ipAddress: requestIp(input.request),
      userAgent: requestUserAgent(input.request),
      latencyMs: latency,
      metadata: safeMetadata(input.metadata),
    });
  } catch {
    // Auth must not fail because audit storage is unavailable.
  }
}
