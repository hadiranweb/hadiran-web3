import { attemptKindOf } from "@/lib/analyzers/document-templates";
import { activeAssessmentTariff, hasAssessmentEntitlement } from "./assessment-orders";
import type { AssessmentService } from "@/lib/commerce/assessment-policy";

/** Undefined tariff is not a zero price: the service is not for sale, so existing free access stays. */
export async function canReadPaidAssessmentService(input: {
  slug: string;
  accountId: number;
  attemptId: number;
  service: AssessmentService;
}): Promise<boolean> {
  const tariff = await activeAssessmentTariff(input.slug, input.service);
  if (!tariff) return true;
  return hasAssessmentEntitlement(input.accountId, attemptKindOf(input.slug), input.attemptId, input.service);
}
