import { withStudioTakeover } from "@/components/studio/StudioTakeover";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { absoluteUrl } from "@/lib/site";
import { privacyDetails, privacySummary, privacyUseTerms } from "@/lib/privacy/content";

export const metadata: Metadata = {
  title: "حریم خصوصی",
  description: privacySummary,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "حریم خصوصی",
    description: privacySummary,
    url: "/privacy",
    locale: "fa_IR",
    type: "website",
  },
};

function PrivacyPage() {
  return (
    <PageShell width="narrow">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "حریم خصوصی",
          url: absoluteUrl("/privacy"),
          inLanguage: "fa",
          description: privacySummary,
        }}
      />
      <PageHeader title="حریم خصوصی" />

      <section className="mb-10">
        <h2 className="text-sm font-medium text-mark">خلاصه</h2>
        <p className="mt-2 text-base leading-[1.85] text-ink">{privacySummary}</p>
      </section>

      <div className="space-y-8 text-sm leading-7 text-muted">
        <section>
          <h2 className="text-lg font-bold leading-[1.7] text-ink">شرایط استفاده</h2>
          <ul className="mt-3 list-disc space-y-1 ps-5">
            {privacyUseTerms.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-bold leading-[1.7] text-ink">جزئیات</h2>
          <ul className="mt-3 list-disc space-y-1 ps-5">
            {privacyDetails.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}

export default withStudioTakeover("privacy", PrivacyPage);
