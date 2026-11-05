/** Pure quotation rules only. Authorization, posting and fulfillment stay server-side. */
export const ASSESSMENT_SERVICES = ["interpretation", "document"] as const;
export type AssessmentService = (typeof ASSESSMENT_SERVICES)[number];

const ZERO = BigInt(0);
const ONE = BigInt(1);
const FEE_DENOMINATOR = BigInt(10000);

type CreatorCouponBinding = {
  productId: string;
  productCreatorId: number;
  couponProductId: string;
  couponIssuerId: number;
};

/** Pass values loaded from trusted product/coupon rows, never request-body identity. */
export function assertCreatorCoupon(binding: CreatorCouponBinding): void {
  if (typeof binding.productId !== "string" || !binding.productId || binding.productId !== binding.couponProductId) {
    throw new Error("coupon_product_mismatch");
  }
  if (!Number.isSafeInteger(binding.productCreatorId) || binding.productCreatorId <= 0 ||
      binding.productCreatorId !== binding.couponIssuerId) {
    throw new Error("coupon_issuer_mismatch");
  }
}

export const FEE_ROUNDING_MODES = ["reject_fraction", "floor", "ceil", "half_up"] as const;
export type FeeRounding = (typeof FEE_ROUNDING_MODES)[number];
/** All inputs stay integer IRR; never silently choose a financial rounding policy. */
export function calculateCommissionFee(priceIRR: bigint, basisPoints: number, rounding?: FeeRounding): bigint {
  if (typeof priceIRR !== "bigint" || priceIRR < ZERO) throw new Error("invalid_price");
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10000) throw new Error("invalid_commission");
  if (rounding !== undefined && !FEE_ROUNDING_MODES.includes(rounding)) throw new Error("invalid_rounding");
  const numerator = priceIRR * BigInt(basisPoints), remainder = numerator % FEE_DENOMINATOR;
  if (remainder !== ZERO && (rounding === undefined || rounding === "reject_fraction")) throw new Error("commission_rounding_required");
  const roundUp = rounding === "ceil" ? remainder !== ZERO : rounding === "half_up" && remainder * BigInt(2) >= FEE_DENOMINATOR;
  return numerator / FEE_DENOMINATOR + (roundUp ? ONE : ZERO);
}

export function quoteAssessmentSale(input: {
  priceIRR: bigint;
  discountIRR: bigint;
  commissionBasisPoints: number;
  rounding?: FeeRounding;
}) {
  const { priceIRR, discountIRR, commissionBasisPoints, rounding } = input;
  if (typeof priceIRR !== "bigint" || priceIRR <= ZERO) throw new Error("invalid_price");
  if (typeof discountIRR !== "bigint" || discountIRR < ZERO || discountIRR > priceIRR) throw new Error("invalid_discount");
  const platformFeeIRR = calculateCommissionFee(priceIRR, commissionBasisPoints, rounding);
  const authorCreditBeforeDiscountIRR = priceIRR - platformFeeIRR;
  return {
    currency: "IRR" as const,
    priceIRR, discountIRR, commissionBasisPoints,
    feeNumerator: priceIRR * BigInt(commissionBasisPoints), feeDenominator: FEE_DENOMINATOR,
    rounding: rounding ?? "exact", payableIRR: priceIRR - discountIRR,
    platformFeeIRR, authorCreditBeforeDiscountIRR, creatorDiscountDebitIRR: discountIRR,
    // Creator-funded coupons may create author debt; insufficient credit is not a coupon veto.
    authorNetIRR: authorCreditBeforeDiscountIRR - discountIRR,
  };
}
