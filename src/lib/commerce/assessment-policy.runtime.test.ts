import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ASSESSMENT_EXECUTION_SERVICE,
  assessmentTariffServices,
  isAssessmentService,
  quoteAssessmentSale,
} from "./assessment-policy";
import { executionPaymentModeOf } from "@/lib/analyzers/pack";
import {
  applyShadowJournal,
  buildCaptureJournal,
  buildCreatorSponsorshipJournal,
  emptyBook,
  journalTotals,
} from "@/lib/finance/journal";

test("every authored pack, including a recreated legacy slug, uses the shared service policy", () => {
  assert.equal(ASSESSMENT_EXECUTION_SERVICE, "execution");
  assert.deepEqual(assessmentTariffServices("mindset-gate"), ["execution", "interpretation", "document"]);
  assert.deepEqual(assessmentTariffServices("casio-ss"), ["execution", "interpretation", "document"]);
  assert.equal(isAssessmentService("execution"), true);
});

test("creator discount cap separates earnings allowance from account debit", () => {
  const quote = quoteAssessmentSale({
    priceIRR: BigInt(100000),
    discountIRR: BigInt(25000),
    commissionBasisPoints: 2000,
    creatorDiscountCapPercent: 10,
  });
  assert.equal(quote.creatorDiscountAllowanceIRR, BigInt(10000));
  assert.equal(quote.creatorDiscountDebitIRR, BigInt(15000));
  assert.equal(quote.authorCreditIRR, BigInt(70000));
  assert.equal(quote.authorNetIRR, BigInt(55000));
  assert.throws(
    () => quoteAssessmentSale({
      priceIRR: BigInt(100000),
      discountIRR: BigInt(0),
      commissionBasisPoints: 2000,
      creatorDiscountCapPercent: 81,
    }),
    /invalid_discount_cap/,
  );
});

test("capture journal posts only the discount above the cap to creator balances", () => {
  const quote = quoteAssessmentSale({
    priceIRR: BigInt(1000),
    discountIRR: BigInt(250),
    commissionBasisPoints: 2000,
    creatorDiscountCapPercent: 10,
  });
  const opening = {
    kind: "opening" as const,
    eventKey: "OPEN:opening",
    sourceRef: "OPEN",
    description: "opening",
    currency: "IRR" as const,
    lines: [
      { account: "bank" as const, side: "debit" as const, amountIRR: BigInt(100) },
      { account: "creator_available" as const, side: "credit" as const, amountIRR: BigInt(100) },
    ],
  };
  const book = applyShadowJournal(emptyBook(), opening);
  const journal = buildCaptureJournal({
    sourceRef: "CAP",
    quote,
    creatorAvailableIRR: BigInt(100),
    cashAccount: "bank",
  });
  assert.equal(journalTotals(journal).balanced, true);
  const next = applyShadowJournal(book, journal);
  assert.equal(next.balances.creator_available, BigInt(0));
  assert.equal(next.balances.creator_receivable, BigInt(50));
  assert.equal(next.balances.creator_pending, BigInt(700));
});

test("sponsorship journal debits available credit idempotently and refuses overdraft", () => {
  const opening = {
    kind: "opening" as const,
    eventKey: "OPEN:opening",
    sourceRef: "OPEN",
    description: "opening",
    currency: "IRR" as const,
    lines: [
      { account: "bank" as const, side: "debit" as const, amountIRR: BigInt(100) },
      { account: "creator_available" as const, side: "credit" as const, amountIRR: BigInt(100) },
    ],
  };
  const book = applyShadowJournal(emptyBook(), opening);
  const journal = buildCreatorSponsorshipJournal("SPONSOR", BigInt(80));
  const next = applyShadowJournal(book, journal);
  assert.equal(next.balances.creator_available, BigInt(20));
  assert.equal(applyShadowJournal(next, journal), next);
  assert.throws(
    () => applyShadowJournal(book, buildCreatorSponsorshipJournal("TOO-MUCH", BigInt(101))),
    /negative_creator_available/,
  );
});

test("payment mode defaults safely to pay-before-result and preserves explicit pre-start", () => {
  assert.equal(executionPaymentModeOf(undefined), "before_result");
  assert.equal(executionPaymentModeOf("before_start"), "before_start");
  assert.equal(executionPaymentModeOf("unexpected"), "before_result");
});
