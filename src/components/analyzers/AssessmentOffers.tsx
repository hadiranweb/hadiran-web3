import { attemptKindOf } from "@/lib/analyzers/document-templates";
import { ASSESSMENT_SERVICES } from "@/lib/commerce/assessment-policy";
import { activeAssessmentTariff, hasAssessmentEntitlement } from "@/lib/finance/assessment-orders";
import { AssessmentPurchasePanel } from "./AssessmentPurchasePanel";

const TITLES = {
  interpretation: "تفسیر کامل این نوبت",
  document: "سند چندصفحهٔ این نوبت",
} as const;

export async function AssessmentOffers({
  slug,
  attemptId,
  accountId,
}: {
  slug: string;
  attemptId: number;
  accountId: number;
}) {
  const kind = attemptKindOf(slug);
  const cards = [];
  for (const service of ASSESSMENT_SERVICES) {
    const tariff = await activeAssessmentTariff(slug, service);
    if (!tariff) continue;
    const entitled = await hasAssessmentEntitlement(accountId, kind, attemptId, service);
    cards.push(
      <AssessmentPurchasePanel
        key={service}
        slug={slug}
        attemptId={attemptId}
        service={service}
        title={TITLES[service]}
        payableIrr={String(tariff.priceIrr)}
        entitled={entitled}
      />,
    );
  }
  if (!cards.length) return null;
  return <div className="print:hidden">{cards}</div>;
}
