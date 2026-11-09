import { attemptKindOf } from "@/lib/analyzers/document-templates";
import { hasAssessmentEntitlement } from "./assessment-orders";
import type { AssessmentService } from "@/lib/commerce/assessment-policy";

/** A service without a complete active tariff is unavailable; an undefined tariff is never treated as free. */
export async function canReadPaidAssessmentService(input: {
  slug: string;
  accountId: number;
  attemptId: number;
  service: AssessmentService;
}): Promise<boolean> {
  // Entitlements persist for paid/sponsored orders even after a tariff is retired.
  return hasAssessmentEntitlement(input.accountId, attemptKindOf(input.slug), input.attemptId, input.service);
}
