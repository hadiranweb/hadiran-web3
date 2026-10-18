import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordSetupTokens } from "@/db/schema";
import { hashSecret, randomSessionToken } from "@/lib/auth/crypto";
import { ensureBotsSchema } from "@/lib/auth/schema-guard";
import { absoluteUrl } from "@/lib/site";

const TTL_MS = 30 * 60 * 1000;

export async function issuePasswordSetupUrl(accountId: number): Promise<string> {
  await ensureBotsSchema();
  const raw = randomSessionToken();
  await db.insert(passwordSetupTokens).values({
    accountId,
    tokenHash: hashSecret(raw),
    expiresAt: new Date(Date.now() + TTL_MS),
  });
  return absoluteUrl(`/account/set-password?t=${encodeURIComponent(raw)}`);
}

export async function accountIdForPasswordSetupToken(raw: string): Promise<number | null> {
  await ensureBotsSchema();
  const tokenHash = hashSecret(raw);
  const [row] = await db
    .select()
    .from(passwordSetupTokens)
    .where(and(eq(passwordSetupTokens.tokenHash, tokenHash), isNull(passwordSetupTokens.consumedAt)))
    .limit(1);
  if (!row || row.expiresAt.getTime() < Date.now()) return null;
  return row.accountId;
}

export async function consumePasswordSetupToken(raw: string): Promise<number | null> {
  const accountId = await accountIdForPasswordSetupToken(raw);
  if (!accountId) return null;
  await db
    .update(passwordSetupTokens)
    .set({ consumedAt: new Date() })
    .where(eq(passwordSetupTokens.tokenHash, hashSecret(raw)));
  return accountId;
}
