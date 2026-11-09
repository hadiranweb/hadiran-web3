"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");

const ZERO = 0n;
const ONE = 1n;
const FEE_DENOMINATOR = 10000n;

function assertCreatorCoupon(binding) {
  if (typeof binding.productId !== "string" || !binding.productId || binding.productId !== binding.couponProductId) {
    throw new Error("coupon_product_mismatch");
  }
  if (
    !Number.isSafeInteger(binding.productCreatorId) ||
    binding.productCreatorId <= 0 ||
    binding.productCreatorId !== binding.couponIssuerId
  ) {
    throw new Error("coupon_issuer_mismatch");
  }
}

function quoteAssessmentSale(input) {
  const { priceIRR, discountIRR, commissionBasisPoints, rounding } = input;
  const creatorDiscountCapPercent = input.creatorDiscountCapPercent ?? 0;
  if (typeof priceIRR !== "bigint" || priceIRR <= ZERO) throw new Error("invalid_price");
  if (typeof discountIRR !== "bigint" || discountIRR < ZERO || discountIRR > priceIRR) {
    throw new Error("invalid_discount");
  }
  if (!Number.isInteger(commissionBasisPoints) || commissionBasisPoints < 0 || commissionBasisPoints > 10000) {
    throw new Error("invalid_commission");
  }
  if (
    !Number.isInteger(creatorDiscountCapPercent) ||
    creatorDiscountCapPercent < 0 ||
    creatorDiscountCapPercent > Math.floor((10000 - commissionBasisPoints) / 100)
  ) {
    throw new Error("invalid_discount_cap");
  }
  if (rounding !== undefined && rounding !== "floor" && rounding !== "ceil") {
    throw new Error("invalid_rounding");
  }
  const feeNumerator = priceIRR * BigInt(commissionBasisPoints);
  const remainder = feeNumerator % FEE_DENOMINATOR;
  if (remainder !== ZERO && rounding === undefined) throw new Error("commission_rounding_required");
  const platformFeeIRR = feeNumerator / FEE_DENOMINATOR + (rounding === "ceil" && remainder !== ZERO ? ONE : ZERO);
  const authorCreditBeforeDiscountIRR = priceIRR - platformFeeIRR;
  const allowedIRR = priceIRR * BigInt(creatorDiscountCapPercent) / 100n;
  const creatorDiscountAllowanceIRR = allowedIRR < discountIRR ? allowedIRR : discountIRR;
  const creatorDiscountDebitIRR = discountIRR - creatorDiscountAllowanceIRR;
  const authorCreditIRR = authorCreditBeforeDiscountIRR - creatorDiscountAllowanceIRR;
  return {
    payableIRR: priceIRR - discountIRR,
    platformFeeIRR,
    authorCreditBeforeDiscountIRR,
    creatorDiscountAllowanceIRR,
    creatorDiscountDebitIRR,
    authorCreditIRR,
    authorNetIRR: authorCreditIRR - creatorDiscountDebitIRR,
  };
}

test("100% coupon: buyer pays 0, fee from list price, creator may owe", () => {
  const quote = quoteAssessmentSale({
    priceIRR: 100000n,
    discountIRR: 100000n,
    commissionBasisPoints: 2000,
  });
  assert.equal(quote.payableIRR, 0n);
  assert.equal(quote.platformFeeIRR, 20000n);
  assert.equal(quote.authorNetIRR, -20000n);
});

test("only the discount above the approved cap is debited from creator available/receivable", () => {
  const quote = quoteAssessmentSale({
    priceIRR: 100000n,
    discountIRR: 25000n,
    commissionBasisPoints: 2000,
    creatorDiscountCapPercent: 10,
  });
  assert.equal(quote.creatorDiscountAllowanceIRR, 10000n);
  assert.equal(quote.creatorDiscountDebitIRR, 15000n);
  assert.equal(quote.authorCreditIRR, 70000n);
  assert.equal(quote.authorNetIRR, 55000n);
  assert.throws(
    () => quoteAssessmentSale({
      priceIRR: 100000n,
      discountIRR: 0n,
      commissionBasisPoints: 2000,
      creatorDiscountCapPercent: 81,
    }),
    /invalid_discount_cap/,
  );
});

test("undefined rounding on remainder is an error, not implicit floor", () => {
  assert.throws(
    () => quoteAssessmentSale({ priceIRR: 1n, discountIRR: 0n, commissionBasisPoints: 1 }),
    /commission_rounding_required/,
  );
  const floored = quoteAssessmentSale({
    priceIRR: 1n,
    discountIRR: 0n,
    commissionBasisPoints: 1,
    rounding: "floor",
  });
  assert.equal(floored.platformFeeIRR, 0n);
  const ceiled = quoteAssessmentSale({
    priceIRR: 1n,
    discountIRR: 0n,
    commissionBasisPoints: 1,
    rounding: "ceil",
  });
  assert.equal(ceiled.platformFeeIRR, 1n);
});

test("missing commission is not a zero fee", () => {
  assert.throws(
    () => quoteAssessmentSale({ priceIRR: 100000n, discountIRR: 0n, commissionBasisPoints: undefined }),
    /invalid_commission/,
  );
});

test("creator coupon binds product and issuer from trusted rows", () => {
  assertCreatorCoupon({
    productId: "sample-analyzer:document",
    productCreatorId: 4,
    couponProductId: "sample-analyzer:document",
    couponIssuerId: 4,
  });
  assert.throws(
    () =>
      assertCreatorCoupon({
        productId: "sample-analyzer:document",
        productCreatorId: 4,
        couponProductId: "sample-analyzer:interpretation",
        couponIssuerId: 4,
      }),
    /coupon_product_mismatch/,
  );
  assert.throws(
    () =>
      assertCreatorCoupon({
        productId: "sample-analyzer:document",
        productCreatorId: 4,
        couponProductId: "sample-analyzer:document",
        couponIssuerId: 9,
      }),
    /coupon_issuer_mismatch/,
  );
});

test("quote grid stays exact for whole-rial fees", () => {
  let n = 0;
  for (const price of [10000n, 100000n, 250000n, 1000000n]) {
    for (const bps of [0, 500, 1000, 2000, 2500, 10000]) {
      for (const discount of [0n, price / 2n, price]) {
        const quote = quoteAssessmentSale({
          priceIRR: price,
          discountIRR: discount,
          commissionBasisPoints: bps,
        });
        assert.equal(quote.payableIRR + discount, price);
        assert.equal(quote.platformFeeIRR + quote.authorCreditBeforeDiscountIRR, price);
        assert.equal(quote.authorNetIRR, quote.authorCreditBeforeDiscountIRR - discount);
        n += 1;
      }
    }
  }
  assert.equal(n, 72);
});
