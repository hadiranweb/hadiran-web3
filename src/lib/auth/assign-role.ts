import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { accountIdByPublicCode } from "@/lib/auth/public-code";
import { ensureAccountProfileSchema } from "@/lib/auth/schema-guard";
import type { AccountRole } from "@/lib/auth/roles";

export async function assignAccountRole(input: {
  publicCode: string;
  role: "author" | "member";
}): Promise<{ ok: true; nameFa: string; role: AccountRole } | { ok: false; error: string }> {
  await ensureAccountProfileSchema();
  const accountId = await accountIdByPublicCode(input.publicCode);
  if (!accountId) return { ok: false, error: "unknown_code" };
  const [target] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
  if (!target || !target.isActive) return { ok: false, error: "unknown_code" };
  if (target.role === "owner") return { ok: false, error: "cannot_change_owner" };
  await db
    .update(accounts)
    .set({ role: input.role, updatedAt: new Date() })
    .where(eq(accounts.id, accountId));
  const nameFa =
    [target.givenName, target.familyName].filter(Boolean).join(" ").trim() ||
    target.displayName?.trim() ||
    "بدون نام";
  return { ok: true, nameFa, role: input.role };
}
