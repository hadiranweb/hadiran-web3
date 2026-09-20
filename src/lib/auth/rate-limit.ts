import { createHash } from "node:crypto";
import { db } from "@/db";
import { rateLimitBuckets } from "@/db/schema";
import { sql } from "drizzle-orm";

export class RateLimitExceededError extends Error {
  readonly statusCode = 429;
  constructor(
    public readonly retryAfterSeconds: number,
    public readonly limit: number,
    public readonly remaining: number
  ) {
    super("rate_limit_exceeded");
    this.name = "RateLimitExceededError";
  }
}

export type RateLimitConfig = {
  name: string;
  limit: number;
  windowSeconds: number;
};

function safeKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function enforceRateLimit(input: { key: string; config: RateLimitConfig }) {
  const now = Date.now();
  const windowMs = input.config.windowSeconds * 1000;
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);
  const resetAt = new Date(windowStartMs + windowMs);
  const bucketKey = `${input.config.name}:${safeKey(input.key)}`;

  const [row] = await db
    .insert(rateLimitBuckets)
    .values({
      bucketKey,
      windowStart,
      windowSeconds: input.config.windowSeconds,
      requestCount: 1,
      expiresAt: resetAt,
    })
    .onConflictDoUpdate({
      target: [rateLimitBuckets.bucketKey, rateLimitBuckets.windowStart],
      set: {
        requestCount: sql`${rateLimitBuckets.requestCount} + 1`,
        updatedAt: new Date(),
        expiresAt: resetAt,
      },
    })
    .returning({ requestCount: rateLimitBuckets.requestCount });

  const count = Number(row?.requestCount ?? input.config.limit + 1);
  const remaining = Math.max(0, input.config.limit - count);
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt.getTime() - now) / 1000));
  if (count > input.config.limit) {
    throw new RateLimitExceededError(retryAfterSeconds, input.config.limit, remaining);
  }
  return { limit: input.config.limit, remaining, resetAt, retryAfterSeconds };
}

export function rateLimitHeaders(error: RateLimitExceededError) {
  return {
    "Retry-After": String(error.retryAfterSeconds),
    "X-RateLimit-Limit": String(error.limit),
    "X-RateLimit-Remaining": String(error.remaining),
  };
}
