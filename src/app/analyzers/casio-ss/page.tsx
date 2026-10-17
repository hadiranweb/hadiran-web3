import type { Metadata } from "next";
import Link from "next/link";
import { CasioSsRun } from "@/components/analyzers/CasioSsRun";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { INTRO_SUMMARY } from "@/lib/analyzers/casio-ss/instrument";
import { getCurrentAccount } from "@/lib/auth/session";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "عارضه‌یابی سازمانی",
  description: INTRO_SUMMARY,
  alternates: { canonical: "/analyzers/casio-ss" },
  openGraph: {
    title: "عارضه‌یابی سازمانی",
    description: INTRO_SUMMARY,
    url: "/analyzers/casio-ss",
    locale: "fa_IR",
    type: "website",
  },
};

export default async function CasioSsPage() {
  const account = await getCurrentAccount();

  return (
    <PageShell width="narrow">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "عارضه‌یابی سازمانی",
          url: absoluteUrl("/analyzers/casio-ss"),
          inLanguage: "fa",
          description: INTRO_SUMMARY,
          isPartOf: { "@type": "CollectionPage", name: "تحلیلگر‌ها", url: absoluteUrl("/analyzers") },
        }}
      />

      <p className="mb-4 text-sm">
        <Link href="/analyzers" className="text-muted hover:text-ink">
          تحلیلگر‌ها
        </Link>
      </p>

      <PageHeader title="عارضه‌یابی سازمانی" lede={INTRO_SUMMARY} />

      {account ? (
        <CasioSsRun />
      ) : (
        <section className="surface p-6 sm:p-8">
          <p className="text-sm leading-7 text-muted">
            برای شروع ارزیابی وارد حساب شوید. سؤال‌ها فرم است، نه گفتگو.
          </p>
          <Link
            href="/signin?next=/analyzers/casio-ss"
            className="mt-5 inline-flex rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg"
          >
            ورود و شروع
          </Link>
        </section>
      )}
    </PageShell>
  );
}
