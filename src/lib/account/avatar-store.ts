import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountAvatars } from "@/db/schema";
import type { SessionAccount } from "@/lib/auth/session";
import { AVATAR_COUNT, defaultAvatarVariant, type AccountAvatar } from "./avatar";

function fallbackAvatar(accountId: number): { avatar: AccountAvatar; imageKey: string | null } {
  return { avatar: { variant: defaultAvatarVariant(accountId), photoUrl: null }, imageKey: null };
}

export async function readAccountAvatar(
  account: Pick<SessionAccount, "id">,
): Promise<{ avatar: AccountAvatar; imageKey: string | null }> {
  try {
    let [row] = await db
      .select()
      .from(accountAvatars)
      .where(eq(accountAvatars.accountId, account.id))
      .limit(1);
    if (!row) {
      [row] = await db
        .insert(accountAvatars)
        .values({ accountId: account.id, variant: defaultAvatarVariant(account.id) })
        .onConflictDoNothing()
        .returning();
      if (!row) {
        [row] = await db
          .select()
          .from(accountAvatars)
          .where(eq(accountAvatars.accountId, account.id))
          .limit(1);
      }
    }
    if (!row) return fallbackAvatar(account.id);
    return {
      avatar: { variant: row.variant, photoUrl: null },
      imageKey: row.imageKey,
    };
  } catch {
    return fallbackAvatar(account.id);
  }
}

export async function chooseAccountAvatar(
  account: Pick<SessionAccount, "id">,
  variant: number,
): Promise<AccountAvatar> {
  if (!Number.isInteger(variant) || variant < 0 || variant >= AVATAR_COUNT) {
    throw new Error("invalid_variant");
  }
  await readAccountAvatar(account);
  await db
    .update(accountAvatars)
    .set({ variant, imageKey: null, updatedAt: new Date() })
    .where(eq(accountAvatars.accountId, account.id));
  return { variant, photoUrl: null };
}
