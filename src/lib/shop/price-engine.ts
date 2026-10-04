import { db } from "@/db";
import { shopListings, shopSettings } from "@/db/schema";
import { eq, isNotNull, isNull, sql } from "drizzle-orm";
import { charmAmountFromRatio } from "./psycho-price";

export const USD_RATE_KEY = "usd_rate";

export async function getShopUsdRate(): Promise<number | null> {
  const [row] = await db.select().from(shopSettings).where(eq(shopSettings.key, USD_RATE_KEY)).limit(1);
  if (!row) return null;
  const n = Number(row.value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function updateShopUsdRateAndPrices(rate: number): Promise<number> {
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("invalid_rate");
  return db.transaction(async (tx) => {
    const [previousSetting] = await tx.select().from(shopSettings).where(eq(shopSettings.key, USD_RATE_KEY)).limit(1);
    const parsedPrevious = Number(previousSetting?.value);
    const previousRate = Number.isFinite(parsedPrevious) && parsedPrevious > 0 ? parsedPrevious : null;
    const ratioBaseRate = previousRate ?? rate;

    await tx
      .update(shopListings)
      .set({ usdRatio: sql`${shopListings.amount}::double precision / ${ratioBaseRate}` })
      .where(isNull(shopListings.usdRatio));

    await tx
      .insert(shopSettings)
      .values({ key: USD_RATE_KEY, value: String(rate) })
      .onConflictDoUpdate({ target: shopSettings.key, set: { value: String(rate) } });

    const rows = await tx
      .select({ id: shopListings.id, usdRatio: shopListings.usdRatio })
      .from(shopListings)
      .where(isNotNull(shopListings.usdRatio));

    const now = new Date();
    for (const row of rows) {
      if (row.usdRatio == null) continue;
      await tx
        .update(shopListings)
        .set({
          amount: charmAmountFromRatio(row.usdRatio, rate),
          updatedAt: now,
        })
        .where(eq(shopListings.id, row.id));
    }

    return rows.length;
  });
}

export function amountFromRatio(ratio: number, rate: number) {
  return charmAmountFromRatio(ratio, rate);
}

export function ratioFromAmount(amount: number, rate: number) {
  return amount / rate;
}
