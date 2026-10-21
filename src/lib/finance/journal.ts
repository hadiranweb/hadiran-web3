/** Pure shadow-ledger model. No database, authorization, bank or wallet mutation. */
import { quoteAssessmentSale, type AssessmentQuote } from "@/lib/commerce/assessment-policy";

export const JOURNAL_MODEL_VERSION = "shadow-1";
export const ACCOUNT_NORMAL = {
  bank: "debit",
  creator_receivable: "debit",
  buyer_wallet: "credit",
  creator_pending: "credit",
  creator_available: "credit",
  platform_deferred: "credit",
  platform_revenue: "credit",
  opening_equity: "credit",
} as const;
export type AccountKind = keyof typeof ACCOUNT_NORMAL;
export type Side = "debit" | "credit";
export type JournalLine = Readonly<{ account: AccountKind; side: Side; amountIRR: bigint }>;
export type JournalKind = "opening" | "capture" | "delivery" | "payout" | "refund";
export type Journal = Readonly<{
  kind: JournalKind;
  eventKey: string;
  sourceRef: string;
  description: string;
  currency: "IRR";
  lines: readonly JournalLine[];
}>;
export type ShadowBook = Readonly<{
  balances: Readonly<Record<AccountKind, bigint>>;
  events: Readonly<Record<string, string>>;
}>;

const zero = BigInt(0);
const accounts = Object.keys(ACCOUNT_NORMAL) as AccountKind[];

export function emptyBook(): ShadowBook {
  return Object.freeze({
    balances: Object.freeze(Object.fromEntries(accounts.map((kind) => [kind, zero])) as Record<AccountKind, bigint>),
    events: Object.freeze({}),
  });
}

export function journalTotals(journal: Journal) {
  let debitIRR = zero;
  let creditIRR = zero;
  for (const line of journal.lines) {
    if (
      !Object.hasOwn(ACCOUNT_NORMAL, line.account) ||
      !["debit", "credit"].includes(line.side) ||
      typeof line.amountIRR !== "bigint" ||
      line.amountIRR <= zero
    ) {
      throw new Error("invalid_journal_line");
    }
    if (line.side === "debit") debitIRR += line.amountIRR;
    else creditIRR += line.amountIRR;
  }
  return { debitIRR, creditIRR, balanced: debitIRR === creditIRR };
}

export function assertJournal(journal: Journal) {
  if (
    !journal ||
    typeof journal.eventKey !== "string" ||
    typeof journal.sourceRef !== "string" ||
    typeof journal.description !== "string" ||
    journal.description.length > 500 ||
    !Array.isArray(journal.lines) ||
    journal.currency !== "IRR" ||
    !journal.eventKey.trim() ||
    !journal.sourceRef.trim() ||
    journal.eventKey.length > 200 ||
    journal.sourceRef.length > 120 ||
    journal.lines.length < 2 ||
    !["opening", "capture", "delivery", "payout", "refund"].includes(journal.kind) ||
    journal.eventKey !== `${journal.sourceRef}:${journal.kind}`
  ) {
    throw new Error("invalid_journal");
  }
  const totals = journalTotals(journal);
  if (!totals.balanced) throw new Error("unbalanced_journal");
  return totals;
}

export function journalFingerprint(journal: Journal) {
  return JSON.stringify({
    kind: journal.kind,
    currency: journal.currency,
    sourceRef: journal.sourceRef,
    description: journal.description,
    lines: [...journal.lines]
      .sort((a, b) => `${a.account}:${a.side}`.localeCompare(`${b.account}:${b.side}`))
      .map((row) => ({ ...row, amountIRR: String(row.amountIRR) })),
  });
}

/** Idempotency is in-memory only here. A production adapter needs transactional locks and a unique database key. */
export function applyShadowJournal(book: ShadowBook, journal: Journal): ShadowBook {
  assertJournal(journal);
  const signature = journalFingerprint(journal);
  if (Object.hasOwn(book.events, journal.eventKey)) {
    if (book.events[journal.eventKey] !== signature) throw new Error("idempotency_conflict");
    return book;
  }
  if (journal.kind === "delivery" && !Object.hasOwn(book.events, `${journal.sourceRef}:capture`)) {
    throw new Error("missing_prerequisite_event");
  }
  if (journal.kind === "delivery" && Object.hasOwn(book.events, `${journal.sourceRef}:refund`)) {
    throw new Error("already_refunded");
  }
  if (journal.kind === "refund" && !Object.hasOwn(book.events, `${journal.sourceRef}:capture`)) {
    throw new Error("missing_prerequisite_event");
  }
  if (journal.kind === "refund" && Object.hasOwn(book.events, `${journal.sourceRef}:delivery`)) {
    throw new Error("already_delivered");
  }
  if (journal.kind === "opening" && Object.keys(book.events).length) throw new Error("opening_requires_empty_book");
  const balances = { ...book.balances };
  for (const account of accounts) {
    if (typeof balances[account] !== "bigint" || balances[account] < zero) throw new Error("invalid_opening_balance");
  }
  for (const line of journal.lines) {
    balances[line.account] += line.side === ACCOUNT_NORMAL[line.account] ? line.amountIRR : -line.amountIRR;
  }
  // Creator debt is an asset receivable, not an overdraft permission on every account.
  for (const account of accounts) if (balances[account] < zero) throw new Error(`negative_${account}`);
  return Object.freeze({
    balances: Object.freeze(balances),
    events: Object.freeze({ ...book.events, [journal.eventKey]: signature }),
  });
}

function line(account: AccountKind, side: Side, amountIRR: bigint): JournalLine {
  return { account, side, amountIRR };
}

function entry(sourceRef: string, event: JournalKind, description: string, lines: JournalLine[]): Journal {
  const journal: Journal = {
    kind: event,
    sourceRef,
    eventKey: `${sourceRef}:${event}`,
    description,
    currency: "IRR",
    lines: Object.freeze(lines.filter((row) => row.amountIRR !== zero).map((row) => Object.freeze(row))),
  };
  assertJournal(journal);
  return Object.freeze(journal);
}

const minimum = (a: bigint, b: bigint) => (a < b ? a : b);

export type SaleScenario = {
  priceIRR: bigint;
  discountIRR: bigint;
  commissionBasisPoints: number;
  rounding?: "floor" | "ceil";
  buyerWalletIRR: bigint;
  creatorNetOpeningIRR: bigint;
  payoutIRR: bigint;
};
export type SimulationStage = { kind: "opening" | "capture" | "delivery" | "payout"; journal: Journal; book: ShadowBook };

export function buildCaptureJournal(input: {
  sourceRef: string;
  quote: AssessmentQuote;
  creatorAvailableIRR: bigint;
  cashAccount: "bank" | "buyer_wallet";
  description?: string;
}): Journal {
  if (typeof input.creatorAvailableIRR !== "bigint" || input.creatorAvailableIRR < zero) {
    throw new Error("invalid_simulation_amount");
  }
  const discountFromAvailable = minimum(input.creatorAvailableIRR, input.quote.discountIRR);
  const discountToReceivable = input.quote.discountIRR - discountFromAvailable;
  return entry(input.sourceRef, "capture", input.description ?? "خرید فرضی؛ درآمد هنوز در انتظار تحویل است", [
    line(input.cashAccount, "debit", input.quote.payableIRR),
    line("creator_available", "debit", discountFromAvailable),
    line("creator_receivable", "debit", discountToReceivable),
    line("creator_pending", "credit", input.quote.authorCreditBeforeDiscountIRR),
    line("platform_deferred", "credit", input.quote.platformFeeIRR),
  ]);
}

export function buildDeliveryJournal(sourceRef: string, balances: Readonly<Record<AccountKind, bigint>>): Journal {
  const repayment = minimum(balances.creator_receivable, balances.creator_pending);
  const earnedCreator = balances.creator_pending - repayment;
  return entry(sourceRef, "delivery", "تحویل فرضی؛ آزادسازی درآمد و جبران بدهی پیشین سازنده", [
    line("creator_pending", "debit", balances.creator_pending),
    line("creator_receivable", "credit", repayment),
    line("creator_available", "credit", earnedCreator),
    line("platform_deferred", "debit", balances.platform_deferred),
    line("platform_revenue", "credit", balances.platform_deferred),
  ]);
}

export function buildPayoutJournal(sourceRef: string, payoutIRR: bigint): Journal {
  if (typeof payoutIRR !== "bigint" || payoutIRR <= zero) throw new Error("invalid_simulation_amount");
  return entry(sourceRef, "payout", "تسویهٔ فرضی از ماندهٔ آزاد؛ نه پرداخت بانکی", [
    line("creator_available", "debit", payoutIRR),
    line("bank", "credit", payoutIRR),
  ]);
}

export function refundCaptureJournal(capture: Journal): Journal {
  assertJournal(capture);
  if (capture.kind !== "capture") throw new Error("invalid_journal");
  return entry(
    capture.sourceRef,
    "refund",
    "برگشت کامل پیش از تحویل",
    capture.lines.map((row) => ({
      account: row.account,
      side: row.side === "debit" ? "credit" : "debit",
      amountIRR: row.amountIRR,
    })),
  );
}

export function simulateAssessmentSale(input: SaleScenario, sourceRef = "simulation-order") {
  for (const value of [input.buyerWalletIRR, input.payoutIRR]) {
    if (typeof value !== "bigint" || value < zero) throw new Error("invalid_simulation_amount");
  }
  if (typeof input.creatorNetOpeningIRR !== "bigint") throw new Error("invalid_simulation_amount");
  const quote = quoteAssessmentSale(input);
  if (input.buyerWalletIRR < quote.payableIRR) throw new Error("buyer_wallet_insufficient");
  const creatorAvailable = input.creatorNetOpeningIRR > zero ? input.creatorNetOpeningIRR : zero;
  const creatorDebt = input.creatorNetOpeningIRR < zero ? -input.creatorNetOpeningIRR : zero;
  const stages: SimulationStage[] = [];
  let book = emptyBook();
  function append(kind: SimulationStage["kind"], journal: Journal) {
    book = applyShadowJournal(book, journal);
    stages.push({ kind, journal, book });
  }
  const openingLines = [
    line("bank", "debit", input.buyerWalletIRR + creatorAvailable),
    line("buyer_wallet", "credit", input.buyerWalletIRR),
    line("creator_available", "credit", creatorAvailable),
    line("creator_receivable", "debit", creatorDebt),
    line("opening_equity", "credit", creatorDebt),
  ];
  // An all-zero opening is not a financial event; no fabricated zero-value journal.
  if (openingLines.some((row) => row.amountIRR > zero)) {
    append("opening", entry(sourceRef, "opening", "مانده‌های فرضی آغاز سناریو؛ نه سند وصول بانک", openingLines));
  }
  const capture = buildCaptureJournal({
    sourceRef,
    quote,
    creatorAvailableIRR: creatorAvailable,
    cashAccount: "buyer_wallet",
  });
  const discountFromAvailable = minimum(creatorAvailable, quote.discountIRR);
  const discountToReceivable = quote.discountIRR - discountFromAvailable;
  append("capture", capture);
  const repayment = minimum(book.balances.creator_receivable, book.balances.creator_pending);
  append("delivery", buildDeliveryJournal(sourceRef, book.balances));
  const availableAfterDeliveryIRR = book.balances.creator_available;
  if (input.payoutIRR > availableAfterDeliveryIRR) throw new Error("payout_exceeds_available");
  if (input.payoutIRR > book.balances.bank) throw new Error("payout_exceeds_model_cash");
  if (input.payoutIRR > zero) append("payout", buildPayoutJournal(sourceRef, input.payoutIRR));
  return {
    modelVersion: JOURNAL_MODEL_VERSION,
    quote,
    discountFromAvailableIRR: discountFromAvailable,
    discountToReceivableIRR: discountToReceivable,
    debtRepaidAtDeliveryIRR: repayment,
    availableAfterDeliveryIRR,
    stages,
    finalBook: book,
  };
}

/** Exact input adapters for the simulator; never convert financial integers through Number. */
export function parseTomanInput(value: string, signed = false): bigint {
  const normalized = value
    .trim()
    .replace(/[\u06f0-\u06f9]/g, (char) => String("\u06f0\u06f1\u06f2\u06f3\u06f4\u06f5\u06f6\u06f7\u06f8\u06f9".indexOf(char)))
    .replace(/[\u0660-\u0669]/g, (char) => String("\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669".indexOf(char)))
    .replace("\u066b", ".")
    .replace("\u2212", "-");
  if (!(signed ? /^-?\d{1,24}(\.\d)?$/ : /^\d{1,24}(\.\d)?$/).test(normalized)) throw new Error("invalid_toman_amount");
  const negative = normalized.startsWith("-");
  const [whole, fraction = "0"] = normalized.replace("-", "").split(".");
  return (BigInt(whole) * BigInt(10) + BigInt(fraction)) * (negative ? -BigInt(1) : BigInt(1));
}

export function parseCommissionPercent(value: string): number {
  const normalized = value
    .trim()
    .replace(/[\u06f0-\u06f9]/g, (char) => String("\u06f0\u06f1\u06f2\u06f3\u06f4\u06f5\u06f6\u06f7\u06f8\u06f9".indexOf(char)))
    .replace(/[\u0660-\u0669]/g, (char) => String("\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669".indexOf(char)))
    .replace("\u066b", ".")
    .replace("\u2212", "-");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(normalized)) throw new Error("invalid_commission");
  const [whole, fraction = ""] = normalized.split(".");
  const basisPoints = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (basisPoints > 10000) throw new Error("invalid_commission");
  return basisPoints;
}

export function irrToTomanInput(amountIRR: bigint): string {
  if (typeof amountIRR !== "bigint") throw new Error("invalid_toman_amount");
  const negative = amountIRR < zero;
  const absolute = negative ? -amountIRR : amountIRR;
  const whole = absolute / BigInt(10);
  const remainder = absolute % BigInt(10);
  const sign = negative ? "-" : "";
  return remainder === zero ? `${sign}${whole}` : `${sign}${whole}.${remainder}`;
}
