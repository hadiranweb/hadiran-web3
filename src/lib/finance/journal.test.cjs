"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");

const ZERO = 0n;
const ACCOUNT_NORMAL = {
  bank: "debit",
  creator_receivable: "debit",
  buyer_wallet: "credit",
  creator_pending: "credit",
  creator_available: "credit",
  platform_deferred: "credit",
  platform_revenue: "credit",
  opening_equity: "credit",
};

function journalTotals(journal) {
  let debitIRR = ZERO;
  let creditIRR = ZERO;
  for (const line of journal.lines) {
    if (line.side === "debit") debitIRR += line.amountIRR;
    else creditIRR += line.amountIRR;
  }
  return { debitIRR, creditIRR, balanced: debitIRR === creditIRR };
}

function journalFingerprint(journal) {
  return JSON.stringify({
    kind: journal.kind,
    sourceRef: journal.sourceRef,
    lines: [...journal.lines]
      .sort((a, b) => `${a.account}:${a.side}`.localeCompare(`${b.account}:${b.side}`))
      .map((row) => ({ ...row, amountIRR: String(row.amountIRR) })),
  });
}

function applyShadowJournal(book, journal) {
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
  if (journal.kind === "refund" && Object.hasOwn(book.events, `${journal.sourceRef}:delivery`)) {
    throw new Error("already_delivered");
  }
  const balances = { ...book.balances };
  for (const line of journal.lines) {
    if (line.amountIRR <= ZERO) throw new Error("invalid_journal_line");
    balances[line.account] += line.side === ACCOUNT_NORMAL[line.account] ? line.amountIRR : -line.amountIRR;
  }
  for (const account of Object.keys(ACCOUNT_NORMAL)) {
    if (balances[account] < ZERO) throw new Error(`negative_${account}`);
  }
  return { balances, events: { ...book.events, [journal.eventKey]: signature } };
}

function empty() {
  return {
    balances: Object.fromEntries(Object.keys(ACCOUNT_NORMAL).map((k) => [k, 0n])),
    events: {},
  };
}

function captureJournal(sourceRef, quote, creatorAvailableIRR) {
  const fromAvailable = creatorAvailableIRR < quote.discountIRR ? creatorAvailableIRR : quote.discountIRR;
  const toReceivable = quote.discountIRR - fromAvailable;
  return {
    kind: "capture",
    eventKey: `${sourceRef}:capture`,
    sourceRef,
    lines: [
      { account: "bank", side: "debit", amountIRR: quote.payableIRR },
      { account: "creator_available", side: "debit", amountIRR: fromAvailable },
      { account: "creator_receivable", side: "debit", amountIRR: toReceivable },
      { account: "creator_pending", side: "credit", amountIRR: quote.authorCredit },
      { account: "platform_deferred", side: "credit", amountIRR: quote.platformFeeIRR },
    ].filter((row) => row.amountIRR !== ZERO),
  };
}

function reverse(journal, kind) {
  return {
    kind,
    eventKey: `${journal.sourceRef}:${kind}`,
    sourceRef: journal.sourceRef,
    lines: journal.lines.map((row) => ({
      account: row.account,
      side: row.side === "debit" ? "credit" : "debit",
      amountIRR: row.amountIRR,
    })),
  };
}

test("zero-pay capture is balanced and may book creator receivable", () => {
  const journal = captureJournal(
    "AST-1",
    { payableIRR: 0n, discountIRR: 100000n, authorCredit: 80000n, platformFeeIRR: 20000n },
    0n,
  );
  assert.equal(journalTotals(journal).balanced, true);
  const book = applyShadowJournal(empty(), journal);
  assert.equal(book.balances.creator_receivable, 100000n);
  assert.equal(book.balances.creator_pending, 80000n);
  assert.equal(book.balances.platform_deferred, 20000n);
  assert.equal(book.balances.bank, 0n);
});

test("refund before delivery reverses capture; delivery after refund is blocked", () => {
  const capture = captureJournal(
    "AST-2",
    { payableIRR: 800000n, discountIRR: 0n, authorCredit: 800000n, platformFeeIRR: 200000n },
    0n,
  );
  let book = applyShadowJournal(empty(), capture);
  book = applyShadowJournal(book, reverse(capture, "refund"));
  assert.equal(book.balances.bank, 0n);
  assert.equal(book.balances.creator_pending, 0n);
  assert.throws(
    () =>
      applyShadowJournal(book, {
        kind: "delivery",
        eventKey: "AST-2:delivery",
        sourceRef: "AST-2",
        lines: [
          { account: "creator_pending", side: "debit", amountIRR: 1n },
          { account: "creator_available", side: "credit", amountIRR: 1n },
        ],
      }),
    /already_refunded/,
  );
});

test("idempotent replay matches; conflict does not", () => {
  const capture = captureJournal(
    "AST-3",
    { payableIRR: 10000n, discountIRR: 0n, authorCredit: 8000n, platformFeeIRR: 2000n },
    0n,
  );
  const book = applyShadowJournal(empty(), capture);
  const again = applyShadowJournal(book, capture);
  assert.equal(again, book);
  assert.throws(
    () =>
      applyShadowJournal(book, {
        ...capture,
        lines: [
          { account: "bank", side: "debit", amountIRR: 1n },
          { account: "platform_deferred", side: "credit", amountIRR: 1n },
        ],
      }),
    /idempotency_conflict/,
  );
});

test("toman input is exact tenths of a rial, not Number", () => {
  function parseTomanInput(value) {
    const normalized = value.trim();
    if (!/^\d{1,24}(\.\d)?$/.test(normalized)) throw new Error("invalid_toman_amount");
    const [whole, fraction = "0"] = normalized.split(".");
    return BigInt(whole) * 10n + BigInt(fraction);
  }
  assert.equal(parseTomanInput("10000"), 100000n);
  assert.equal(parseTomanInput("10000.5"), 100005n);
  assert.throws(() => parseTomanInput("10.25"), /invalid_toman_amount/);
});
