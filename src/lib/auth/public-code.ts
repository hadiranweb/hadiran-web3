import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountPublicCodes } from "@/db/schema";
import { ensureAccountProfileSchema } from "./schema-guard";

const CODE_MIN = 10_000_000;
const CODE_MAX_EXCLUSIVE = 100_000_000;
const ALLOC_TRIES = 24;

function randomEightDigitCode() {
  return String(randomInt(CODE_MIN, CODE_MAX_EXCLUSIVE));
}

export async function ensureAccountPublicCode(accountId: number): Promise<string> {
  await ensureAccountProfileSchema();
  const [existing] = await db
    .select({ code: accountPublicCodes.code })
    .from(accountPublicCodes)
    .where(eq(accountPublicCodes.accountId, accountId))
    .limit(1);
  if (existing?.code) return existing.code;

  for (let attempt = 0; attempt < ALLOC_TRIES; attempt += 1) {
    const code = randomEightDigitCode();
    try {
      const [created] = await db
        .insert(accountPublicCodes)
        .values({ accountId, code })
        .returning({ code: accountPublicCodes.code });
      if (created?.code) return created.code;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!/unique|duplicate/i.test(message)) throw error;
      const [race] = await db
        .select({ code: accountPublicCodes.code })
        .from(accountPublicCodes)
        .where(eq(accountPublicCodes.accountId, accountId))
        .limit(1);
      if (race?.code) return race.code;
    }
  }

  throw new Error("public_code_alloc_failed");
}
