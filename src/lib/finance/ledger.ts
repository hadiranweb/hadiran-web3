import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { ledgerEntries, ledgerLines } from "@/db/schema";
import {
  ACCOUNT_NORMAL,
  assertJournal,
  journalFingerprint,
  type AccountKind,
  type Journal,
  type Side,
} from "./journal";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class LedgerError extends Error {
  constructor(
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}

export type LedgerParties = { creatorId: number; buyerId?: number };

const PG_BIGINT_MAX = BigInt("9223372036854775807");

function partyFor(account: AccountKind, parties: LedgerParties): number | null {
  if (account.startsWith("creator_")) return parties.creatorId;
  if (account === "buyer_wallet") return parties.buyerId ?? null;
  return null;
}

function asBigInt(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isInteger(value)) return BigInt(value);
  if (typeof value === "string" && /^-?\d+$/.test(value)) return BigInt(value);
  throw new LedgerError("invalid_ledger_amount", 500);
}

export async function ledgerBalance(
  tx: Tx,
  account: AccountKind,
  partyId: number | null,
): Promise<bigint> {
  const normal = ACCOUNT_NORMAL[account];
  const rows = await tx
    .select({ side: ledgerLines.side, amountIrr: ledgerLines.amountIrr })
    .from(ledgerLines)
    .where(partyId == null ? sql`${ledgerLines.partyId} is null and ${ledgerLines.account} = ${account}` : and(eq(ledgerLines.account, account), eq(ledgerLines.partyId, partyId)));
  let total = BigInt(0);
  for (const row of rows) {
    const amount = asBigInt(row.amountIrr);
    total += row.side === normal ? amount : -amount;
  }
  return total;
}

export async function loadPostedJournal(tx: Tx, eventKey: string): Promise<Journal | null> {
  const [entry] = await tx.select().from(ledgerEntries).where(eq(ledgerEntries.eventKey, eventKey)).limit(1);
  if (!entry) return null;
  const rows = await tx.select().from(ledgerLines).where(eq(ledgerLines.entryId, entry.id));
  return {
    kind: entry.kind as Journal["kind"],
    eventKey: entry.eventKey,
    sourceRef: entry.sourceId,
    description: entry.description,
    currency: "IRR",
    lines: rows.map((row) => ({
      account: row.account as AccountKind,
      side: row.side as Side,
      amountIRR: asBigInt(row.amountIrr),
    })),
  };
}

export async function postJournal(
  tx: Tx,
  journal: Journal,
  parties: LedgerParties,
  sourceType: string,
): Promise<{ id: number; replayed: boolean }> {
  assertJournal(journal);
  for (const line of journal.lines) {
    if (line.amountIRR > PG_BIGINT_MAX) throw new LedgerError("amount_overflow", 400);
  }
  const signature = journalFingerprint(journal);
  const [existing] = await tx.select().from(ledgerEntries).where(eq(ledgerEntries.eventKey, journal.eventKey)).limit(1);
  if (existing) {
    if (existing.payloadHash !== signature) throw new LedgerError("idempotency_conflict", 409);
    return { id: existing.id, replayed: true };
  }
  if (journal.kind === "delivery" || journal.kind === "refund") {
    const capture = await loadPostedJournal(tx, `${journal.sourceRef}:capture`);
    if (!capture) throw new LedgerError("missing_prerequisite_event", 409);
  }
  if (journal.kind === "delivery") {
    const refunded = await loadPostedJournal(tx, `${journal.sourceRef}:refund`);
    if (refunded) throw new LedgerError("already_refunded", 409);
  }
  if (journal.kind === "refund") {
    const delivered = await loadPostedJournal(tx, `${journal.sourceRef}:delivery`);
    if (delivered) throw new LedgerError("already_delivered", 409);
  }

  const [inserted] = await tx
    .insert(ledgerEntries)
    .values({
      eventKey: journal.eventKey,
      kind: journal.kind,
      sourceType,
      sourceId: journal.sourceRef,
      description: journal.description,
      currency: "IRR",
      payloadHash: signature,
    })
    .returning({ id: ledgerEntries.id });
  if (!inserted) throw new LedgerError("ledger_insert_failed", 500);

  await tx.insert(ledgerLines).values(
    journal.lines.map((line) => ({
      entryId: inserted.id,
      account: line.account,
      partyId: partyFor(line.account, parties),
      side: line.side,
      amountIrr: line.amountIRR,
    })),
  );

  const touched = new Map<string, { account: AccountKind; partyId: number | null }>();
  for (const line of journal.lines) {
    const partyId = partyFor(line.account, parties);
    touched.set(`${line.account}:${partyId ?? "platform"}`, { account: line.account, partyId });
  }
  for (const item of touched.values()) {
    const balance = await ledgerBalance(tx, item.account, item.partyId);
    if (balance < BigInt(0)) throw new LedgerError(`negative_${item.account}`, 409);
  }
  return { id: inserted.id, replayed: false };
}
