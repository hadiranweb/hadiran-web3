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
  if (
    !Number.isSafeInteger(binding.productCreatorId) ||
    binding.productCreatorId <= 0 ||
    binding.productCreatorId !== binding.couponIssuerId
  ) {
    throw new Error("coupon_issuer_mismatch");
  }
}

export function isAssessmentService(value: string): value is AssessmentService {
  return (ASSESSMENT_SERVICES as readonly string[]).includes(value);
}

export function assessmentProductId(analyzerSlug: string, service: AssessmentService): string {
  return `${analyzerSlug}:${service}`;
}

export function quoteAssessmentSale(input: {
  priceIRR: bigint;
  discountIRR: bigint;
  commissionBasisPoints: number;
  rounding?: "floor" | "ceil";
}) {
  const { priceIRR, discountIRR, commissionBasisPoints, rounding } = input;
  if (typeof priceIRR !== "bigint" || priceIRR <= ZERO) throw new Error("invalid_price");
  if (typeof discountIRR !== "bigint" || discountIRR < ZERO || discountIRR > priceIRR) {
    throw new Error("invalid_discount");
  }
  if (!Number.isInteger(commissionBasisPoints) || commissionBasisPoints < 0 || commissionBasisPoints > 10000) {
    throw new Error("invalid_commission");
  }
  if (rounding !== undefined && rounding !== "floor" && rounding !== "ceil") {
    throw new Error("invalid_rounding");
  }
  const feeNumerator = priceIRR * BigInt(commissionBasisPoints);
  const feeDenominator = FEE_DENOMINATOR;
  const remainder = feeNumerator % feeDenominator;
  // No unapproved implicit rounding policy for fractional rials.
  if (remainder !== ZERO && rounding === undefined) throw new Error("commission_rounding_required");
  const platformFeeIRR = feeNumerator / feeDenominator + (rounding === "ceil" && remainder !== ZERO ? ONE : ZERO);
  const authorCreditBeforeDiscountIRR = priceIRR - platformFeeIRR;
  return {
    currency: "IRR" as const,
    priceIRR,
    discountIRR,
    commissionBasisPoints,
    feeNumerator,
    feeDenominator,
    rounding: rounding ?? "exact",
    payableIRR: priceIRR - discountIRR,
    platformFeeIRR,
    authorCreditBeforeDiscountIRR,
    creatorDiscountDebitIRR: discountIRR,
    // Explicitly signed: creator-funded coupons may create an author debt.
    authorNetIRR: authorCreditBeforeDiscountIRR - discountIRR,
  };
}

export type AssessmentQuote = ReturnType<typeof quoteAssessmentSale>;
