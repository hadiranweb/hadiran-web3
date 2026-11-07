import { attemptKindOf } from "@/lib/analyzers/document-templates";
import { activeAssessmentTariff, hasAssessmentEntitlement } from "./assessment-orders";
import type { AssessmentService } from "@/lib/commerce/assessment-policy";

/** A service without a complete active tariff is unavailable; an undefined tariff is never treated as free. */
export async function canReadPaidAssessmentService(input: {
  slug: string;
  accountId: number;
  attemptId: number;
  service: AssessmentService;
}): Promise<boolean> {
  const tariff = await activeAssessmentTariff(input.slug, input.service);
  if (!tariff) return false;
  return hasAssessmentEntitlement(input.accountId, attemptKindOf(input.slug), input.attemptId, input.service);
}
