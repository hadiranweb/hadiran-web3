import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accountAvatars } from "@/db/schema";
import type { SessionAccount } from "@/lib/auth/session";
import { previewStore } from "@/lib/preview/store";
import { defaultAvatarVariant, type AccountAvatar } from "./avatar";
let ready: Promise<void> | null = null;
function ensureAvatarSchema() {
  // Idempotent safety net, consistent with the existing account schema guards.
  return ready ||= db.execute(sql`CREATE TABLE IF NOT EXISTS account_avatars (
    account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    variant INTEGER NOT NULL CHECK (variant >= 0 AND variant < 8),
    image_key VARCHAR(160), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`).then(() => undefined).catch(error => { ready = null; throw error; });
}
export async function readAccountAvatar(account: SessionAccount): Promise<{ avatar: AccountAvatar; imageKey: string | null }> {
  const preview = await previewStore(account);
  if (preview) return { avatar: { variant: preview.avatarVariant ?? defaultAvatarVariant(account.id), photoUrl: null }, imageKey: null };
  await ensureAvatarSchema();
  let [row] = await db.select().from(accountAvatars).where(eq(accountAvatars.accountId, account.id)).limit(1);
  if (!row) {
    [row] = await db.insert(accountAvatars).values({ accountId: account.id, variant: defaultAvatarVariant(account.id) }).onConflictDoNothing().returning();
    // A simultaneous first request may have won the insertion race.
    if (!row) [row] = await db.select().from(accountAvatars).where(eq(accountAvatars.accountId, account.id)).limit(1);
  }
  return { avatar: { variant: row.variant, photoUrl: row.imageKey ? `/api/account/avatar/image?v=${row.updatedAt.getTime()}` : null }, imageKey: row.imageKey };
}
export async function chooseAccountAvatar(account: SessionAccount, variant: number): Promise<AccountAvatar> {
  const preview = await previewStore(account);
  if (preview) { preview.avatarVariant = variant; return { variant, photoUrl: null }; }
  await readAccountAvatar(account);
  await db.update(accountAvatars).set({ variant, imageKey: null, updatedAt: new Date() }).where(eq(accountAvatars.accountId, account.id));
  return { variant, photoUrl: null };
}
