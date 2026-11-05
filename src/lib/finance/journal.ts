/** Pure shadow-ledger model. No database, authorization, bank or wallet mutation. */
import { quoteAssessmentSale, type FeeRounding } from "@/lib/commerce/assessment-policy";

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
export type JournalKind = "opening" | "capture" | "delivery" | "payout";
export type Journal = Readonly<{ kind: JournalKind; eventKey: string; sourceRef: string; description: string; currency: "IRR"; lines: readonly JournalLine[] }>;
export type ShadowBook = Readonly<{ balances: Readonly<Record<AccountKind, bigint>>; events: Readonly<Record<string, string>> }>;
const zero = BigInt(0);
const accounts = Object.keys(ACCOUNT_NORMAL) as AccountKind[];
export function emptyBook(): ShadowBook {
  return Object.freeze({ balances: Object.freeze(Object.fromEntries(accounts.map(kind => [kind, zero])) as Record<AccountKind, bigint>), events: Object.freeze({}) });
}
export function journalTotals(journal: Journal) {
  let debitIRR = zero, creditIRR = zero;
  for (const line of journal.lines) {
    if (!Object.hasOwn(ACCOUNT_NORMAL, line.account) || !["debit", "credit"].includes(line.side) || typeof line.amountIRR !== "bigint" || line.amountIRR <= zero) throw new Error("invalid_journal_line");
    if (line.side === "debit") debitIRR += line.amountIRR; else creditIRR += line.amountIRR;
  }
  return { debitIRR, creditIRR, balanced: debitIRR === creditIRR };
}
export function assertJournal(journal: Journal) {
  if (!journal || typeof journal.eventKey !== "string" || typeof journal.sourceRef !== "string" || typeof journal.description !== "string" || journal.description.length > 500 || !Array.isArray(journal.lines) || journal.currency !== "IRR" || !journal.eventKey.trim() || !journal.sourceRef.trim() || journal.eventKey.length > 200 || journal.sourceRef.length > 120 || journal.lines.length < 2 || !["opening", "capture", "delivery", "payout"].includes(journal.kind) || journal.eventKey !== `${journal.sourceRef}:${journal.kind}`) throw new Error("invalid_journal");
  const totals = journalTotals(journal);
  if (!totals.balanced) throw new Error("unbalanced_journal");
  return totals;
}
function fingerprint(journal: Journal) {
  return JSON.stringify({ kind: journal.kind, currency: journal.currency, sourceRef: journal.sourceRef, description: journal.description, lines: [...journal.lines].sort((a,b) => `${a.account}:${a.side}`.localeCompare(`${b.account}:${b.side}`)).map(row => ({ ...row, amountIRR: String(row.amountIRR) })) });
}
/** Idempotency is in-memory only here. A production adapter needs transactional locks and a unique database key. */
export function applyShadowJournal(book: ShadowBook, journal: Journal): ShadowBook {
  assertJournal(journal);
  const signature = fingerprint(journal);
  if (Object.hasOwn(book.events, journal.eventKey)) {
    if (book.events[journal.eventKey] !== signature) throw new Error("idempotency_conflict");
    return book;
  }
  const prerequisite = journal.kind === "delivery" ? `${journal.sourceRef}:capture` : null;
  if (prerequisite && !Object.hasOwn(book.events, prerequisite)) throw new Error("missing_prerequisite_event");
  if (journal.kind === "opening" && Object.keys(book.events).length) throw new Error("opening_requires_empty_book");
  const balances = { ...book.balances };
  for (const account of accounts) if (typeof balances[account] !== "bigint" || balances[account] < zero) throw new Error("invalid_opening_balance");
  for (const line of journal.lines) balances[line.account] += line.side === ACCOUNT_NORMAL[line.account] ? line.amountIRR : -line.amountIRR;
  // Creator debt is an asset receivable, not an overdraft permission on every account.
  for (const account of accounts) if (balances[account] < zero) throw new Error(`negative_${account}`);
  return Object.freeze({ balances: Object.freeze(balances), events: Object.freeze({ ...book.events, [journal.eventKey]: signature }) });
}
function line(account: AccountKind, side: Side, amountIRR: bigint): JournalLine { return { account, side, amountIRR }; }
function entry(sourceRef: string, event: JournalKind, description: string, lines: JournalLine[]): Journal {
  const journal: Journal = { kind: event, sourceRef, eventKey: `${sourceRef}:${event}`, description, currency: "IRR", lines: Object.freeze(lines.filter(row => row.amountIRR !== zero).map(row => Object.freeze(row))) };
  assertJournal(journal);
  return Object.freeze(journal);
}
const minimum = (a: bigint, b: bigint) => a < b ? a : b;
export type SaleScenario = {
  priceIRR: bigint; discountIRR: bigint; commissionBasisPoints: number; rounding?: FeeRounding;
  buyerWalletIRR: bigint; creatorNetOpeningIRR: bigint; payoutIRR: bigint;
};
export type SimulationStage = { kind: "opening" | "capture" | "delivery" | "payout"; journal: Journal; book: ShadowBook };
export function simulateAssessmentSale(input: SaleScenario, sourceRef = "simulation-order") {
  for (const value of [input.buyerWalletIRR, input.payoutIRR]) if (typeof value !== "bigint" || value < zero) throw new Error("invalid_simulation_amount");
  if (typeof input.creatorNetOpeningIRR !== "bigint") throw new Error("invalid_simulation_amount");
  const quote = quoteAssessmentSale(input);
  if (input.buyerWalletIRR < quote.payableIRR) throw new Error("buyer_wallet_insufficient");
  const creatorAvailable = input.creatorNetOpeningIRR > zero ? input.creatorNetOpeningIRR : zero;
  const creatorDebt = input.creatorNetOpeningIRR < zero ? -input.creatorNetOpeningIRR : zero;
  const stages: SimulationStage[] = [];
  let book = emptyBook();
  function append(kind: SimulationStage["kind"], journal: Journal) {
    book = applyShadowJournal(book, journal); stages.push({ kind, journal, book });
  }
  const openingLines = [line("bank", "debit", input.buyerWalletIRR + creatorAvailable), line("buyer_wallet", "credit", input.buyerWalletIRR), line("creator_available", "credit", creatorAvailable), line("creator_receivable", "debit", creatorDebt), line("opening_equity", "credit", creatorDebt)];
  // An all-zero opening is not a financial event; no fabricated zero-value journal.
  if (openingLines.some(row => row.amountIRR > zero)) append("opening", entry(sourceRef, "opening", "مانده‌های فرضی آغاز سناریو؛ نه سند وصول بانک", openingLines));
  const discountFromAvailable = minimum(creatorAvailable, quote.discountIRR);
  const discountToReceivable = quote.discountIRR - discountFromAvailable;
  append("capture", entry(sourceRef, "capture", "خرید فرضی؛ درآمد هنوز در انتظار تحویل است", [
    line("buyer_wallet", "debit", quote.payableIRR),
    line("creator_available", "debit", discountFromAvailable),
    line("creator_receivable", "debit", discountToReceivable),
    line("creator_pending", "credit", quote.authorCreditBeforeDiscountIRR),
    line("platform_deferred", "credit", quote.platformFeeIRR),
  ]));
  const repayment = minimum(book.balances.creator_receivable, book.balances.creator_pending);
  const earnedCreator = book.balances.creator_pending - repayment;
  const deliveryLines = [line("creator_pending", "debit", book.balances.creator_pending), line("creator_receivable", "credit", repayment), line("creator_available", "credit", earnedCreator), line("platform_deferred", "debit", book.balances.platform_deferred), line("platform_revenue", "credit", book.balances.platform_deferred)];
  append("delivery", entry(sourceRef, "delivery", "تحویل فرضی؛ آزادسازی درآمد و جبران بدهی پیشین سازنده", deliveryLines));
  const availableAfterDeliveryIRR = book.balances.creator_available;
  if (input.payoutIRR > availableAfterDeliveryIRR) throw new Error("payout_exceeds_available");
  if (input.payoutIRR > book.balances.bank) throw new Error("payout_exceeds_model_cash");
  if (input.payoutIRR > zero) append("payout", entry(sourceRef, "payout", "تسویهٔ فرضی از ماندهٔ آزاد؛ نه پرداخت بانکی", [line("creator_available", "debit", input.payoutIRR), line("bank", "credit", input.payoutIRR)]));
  return { modelVersion: JOURNAL_MODEL_VERSION, quote, discountFromAvailableIRR: discountFromAvailable, discountToReceivableIRR: discountToReceivable, debtRepaidAtDeliveryIRR: repayment, availableAfterDeliveryIRR, stages, finalBook: book };
}
/** Exact input adapters for the simulator; never convert financial integers through Number. */
export function parseTomanInput(value: string, signed = false): bigint {
  const normalized = value.trim().replace(/[۰-۹]/g, char => String("۰۱۲۳۴۵۶۷۸۹".indexOf(char))).replace(/[٠-٩]/g, char => String("٠١٢٣٤٥٦٧٨٩".indexOf(char))).replace("٫", ".").replace("−", "-");
  if (!(signed ? /^-?\d{1,24}(\.\d)?$/ : /^\d{1,24}(\.\d)?$/).test(normalized)) throw new Error("invalid_toman_amount");
  const negative = normalized.startsWith("-");
  const [whole, fraction = "0"] = normalized.replace("-", "").split(".");
  return (BigInt(whole) * BigInt(10) + BigInt(fraction)) * (negative ? -BigInt(1) : BigInt(1));
}
export function parseCommissionPercent(value: string): number {
  const normalized = value.trim().replace(/[۰-۹]/g, char => String("۰۱۲۳۴۵۶۷۸۹".indexOf(char))).replace(/[٠-٩]/g, char => String("٠١٢٣٤٥٦٧٨٩".indexOf(char))).replace("٫", ".").replace("−", "-");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(normalized)) throw new Error("invalid_commission");
  const [whole, fraction = ""] = normalized.split(".");
  const basisPoints = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (basisPoints > 10000) throw new Error("invalid_commission");
  return basisPoints;
}
