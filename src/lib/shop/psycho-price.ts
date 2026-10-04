/**
 * Charm / psychological rounding for IRR catalog prices.
 * Last step after ratio × weekly USD rate. Not a payment method.
 *
 * Rules (founder):
 * - hundreds: prefer …59
 * - thousands: prefer 5 / 8 and …59
 * - millions: 9-down + thousand-core 58 (x580000 / x589000 / x558000)
 */

export type PsychoPriceOptions = {
  /** Max absolute change from the raw amount, percent. */
  maxDeltaPct?: number;
  /** If false, never return a price below the raw amount. */
  allowDown?: boolean;
};

export const PSYCHO_PRICE_MAX_DELTA_PCT = 3.5;

/** Python 3 round-half-to-even, for parity with the founder snippet. */
function pyRound(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return -pyRound(-n);
  const floor = Math.floor(n);
  const frac = n - floor;
  if (frac > 0.5) return floor + 1;
  if (frac < 0.5) return floor;
  return floor % 2 === 0 ? floor : floor + 1;
}

export function psychoPrice(raw: number, options: PsychoPriceOptions = {}): number {
  const maxDeltaPct = options.maxDeltaPct ?? PSYCHO_PRICE_MAX_DELTA_PCT;
  const allowDown = options.allowDown ?? true;
  const base = pyRound(raw);
  if (base <= 0) return base;

  function isValid(cand: number): boolean {
    if (cand <= 0) return false;
    const pct = (Math.abs(cand - base) / base) * 100;
    if (pct > maxDeltaPct) return false;
    if (!allowDown && cand < base) return false;
    return true;
  }

  const candidates: Array<[price: number, score: number]> = [];

  function add(cand: number, bonus = 0): void {
    if (!isValid(cand)) return;
    const pct = (Math.abs(cand - base) / base) * 100;
    candidates.push([cand, pct - bonus]);
  }

  if (base < 1_000) {
    const prefix = Math.trunc(base / 100);
    for (let off = -3; off <= 3; off += 1) {
      const p = prefix + off;
      if (p < 1) continue;
      add(p * 100 + 59, 3.0);
      add(p * 100 + 50, 2.0);
      add(p * 100 + 80, 1.8);
      add(p * 100, 1.0);
    }
  } else if (base < 1_000_000) {
    for (const unit of [1_000, 10_000, 100_000]) {
      const prefix = Math.trunc(base / unit);
      for (let off = -2; off <= 2; off += 1) {
        const p = prefix + off;
        if (p < 1) continue;
        add(p * unit + 59, 2.8);
        add(p * unit + 50, 2.2);
        add(p * unit + 80, 2.0);
        add(p * unit, 1.5);
        add(p * unit + 90, 1.7);
      }
    }
    for (const d of [5, 8, 9]) {
      for (const k of [3, 4, 5]) {
        const unit = 10 ** k;
        const prefix = Math.trunc(base / (unit * 10));
        for (let off = -1; off <= 1; off += 1) {
          const p = Math.max(0, prefix + off);
          const cand = p * 10 * unit + d * unit;
          add(cand, d === 5 || d === 8 ? 2.5 : 1.8);
        }
      }
    }
  } else {
    const millions = Math.trunc(base / 1_000_000);
    for (let mOff = -1; mOff <= 1; mOff += 1) {
      const m = millions + mOff;
      if (m < 1) continue;
      const baseM = m * 1_000_000;
      add(baseM + 580_000, 4.0);
      add(baseM + 589_000, 3.8);
      add(baseM + 558_000, 3.5);
      add(baseM + 590_000, 3.2);
      add(baseM + 500_000, 3.0);
      add(baseM + 800_000, 2.8);
      add(baseM + 900_000, 2.5);
      add(baseM + 550_000, 2.7);
      add(baseM + 599_000, 2.6);
      add(baseM, 1.5);
      add(baseM + 579_000, 3.0);
      add(baseM + 581_000, 2.9);
    }
  }

  for (const r of [100, 500, 1_000, 5_000, 10_000, 50_000, 100_000, 500_000, 1_000_000]) {
    add(pyRound(base / r) * r, 0.8);
    const plus = 5 * (r >= 10 ? Math.trunc(r / 10) : 1);
    add(Math.floor(base / r) * r + plus, 1.0);
  }

  if (!candidates.length) return base;
  candidates.sort((a, b) => a[1] - b[1] || Math.abs(a[0] - base) - Math.abs(b[0] - base));
  return candidates[0][0];
}

/** Raw ratio × rate, then charm-round to the stored IRR amount. */
export function charmAmountFromRatio(ratio: number, rate: number): number {
  if (!Number.isFinite(ratio) || !Number.isFinite(rate) || ratio <= 0 || rate <= 0) {
    return 1;
  }
  return Math.max(1, psychoPrice(ratio * rate));
}
