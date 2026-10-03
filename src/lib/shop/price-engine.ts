import { db } from "@/db";
import { shopListings, shopSettings } from "@/db/schema";
import { eq, isNotNull, isNull, sql } from "drizzle-orm";

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

    const updated = await tx
      .update(shopListings)
      .set({
        amount: sql`round(${shopListings.usdRatio} * ${rate})::integer`,
        updatedAt: new Date(),
      })
      .where(isNotNull(shopListings.usdRatio))
      .returning({ id: shopListings.id });

    return updated.length;
  });
}

export function amountFromRatio(ratio: number, rate: number) {
  return Math.max(1, Math.round(ratio * rate));
}

export function ratioFromAmount(amount: number, rate: number) {
  return amount / rate;
}
