import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { displayNameFromParts, normalizePersonName } from "@/lib/auth/profile";
import { ensureAccountPublicCode } from "@/lib/auth/public-code";
import { ensureAccountPasswordColumns, ensureAccountProfileSchema } from "@/lib/auth/schema-guard";
import { roleForPhone } from "@/lib/auth/session";

export async function accountIdByTelegramUserId(telegramUserId: string): Promise<number | null> {
  await ensureAccountProfileSchema();
  const [row] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.telegramUserId, telegramUserId))
    .limit(1);
  return row?.id ?? null;
}

export async function linkTelegramContact(input: {
  telegramUserId: string;
  phone: string;
  givenName: string | null;
  familyName: string | null;
}): Promise<{ ok: true; accountId: number } | { ok: false; error: string }> {
  await ensureAccountPasswordColumns();
  await ensureAccountProfileSchema();
  const givenName = normalizePersonName(input.givenName);
  const familyName = normalizePersonName(input.familyName);
  const displayName = displayNameFromParts(givenName, familyName);
  const [byTelegram] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.telegramUserId, input.telegramUserId))
    .limit(1);
  const [byPhone] = await db.select().from(accounts).where(eq(accounts.phone, input.phone)).limit(1);

  if (byTelegram && byPhone && byTelegram.id !== byPhone.id) {
    return { ok: false, error: "این شماره به حساب دیگری تعلق دارد." };
  }
  if (byPhone?.telegramUserId && byPhone.telegramUserId !== input.telegramUserId) {
    return { ok: false, error: "این شماره به تلگرام دیگری وصل است." };
  }
  if (byPhone && !byPhone.isActive) return { ok: false, error: "این حساب غیرفعال است." };
  if (byTelegram && !byTelegram.isActive) return { ok: false, error: "این حساب غیرفعال است." };

  const now = new Date();
  const existing = byTelegram ?? byPhone;
  if (existing) {
    const [updated] = await db
      .update(accounts)
      .set({
        telegramUserId: input.telegramUserId,
        telegramLinkedAt: existing.telegramLinkedAt ?? now,
        phoneVerifiedAt: existing.phoneVerifiedAt ?? now,
        givenName: existing.givenName || givenName,
        familyName: existing.familyName || familyName,
        displayName: existing.displayName || displayName,
        updatedAt: now,
      })
      .where(eq(accounts.id, existing.id))
      .returning({ id: accounts.id });
    if (!updated) return { ok: false, error: "حساب به‌روز نشد." };
    await ensureAccountPublicCode(updated.id);
    return { ok: true, accountId: updated.id };
  }

  const [created] = await db
    .insert(accounts)
    .values({
      phone: input.phone,
      role: roleForPhone(input.phone),
      phoneVerifiedAt: now,
      telegramUserId: input.telegramUserId,
      telegramLinkedAt: now,
      givenName,
      familyName,
      displayName,
      isActive: true,
    })
    .returning({ id: accounts.id });
  if (!created) return { ok: false, error: "حساب ساخته نشد." };
  await ensureAccountPublicCode(created.id);
  return { ok: true, accountId: created.id };
}
