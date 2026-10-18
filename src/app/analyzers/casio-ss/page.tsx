import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CasioSsRun } from "@/components/analyzers/CasioSsRun";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { resolveLivePack } from "@/lib/analyzers/authored";
import { readAttempt } from "@/lib/analyzers/casio-ss/attempts";
import { buildCasioAuthoredPack } from "@/lib/analyzers/casio-ss/authored-pack";
import { INTRO_SUMMARY } from "@/lib/analyzers/casio-ss/instrument";
import { getCurrentAccount } from "@/lib/auth/session";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

async function livePack() {
  return (await resolveLivePack("casio-ss")) ?? buildCasioAuthoredPack();
}

export async function generateMetadata(): Promise<Metadata> {
  const pack = await livePack();
  return {
    title: pack.nameFa,
    description: pack.summaryFa || INTRO_SUMMARY,
    alternates: { canonical: "/analyzers/casio-ss" },
    openGraph: {
      title: pack.nameFa,
      description: pack.summaryFa || INTRO_SUMMARY,
      url: "/analyzers/casio-ss",
      locale: "fa_IR",
      type: "website",
    },
  };
}

export default async function CasioSsPage() {
  const pack = await livePack();
  const account = await getCurrentAccount();
  if (account) {
    const attempt = await readAttempt(account.id);
    if (attempt?.status === "submitted") {
      redirect("/analyzers/casio-ss/report");
    }
  }

  return (
    <PageShell width="narrow">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: pack.nameFa,
          url: absoluteUrl("/analyzers/casio-ss"),
          inLanguage: "fa",
          description: pack.summaryFa,
          isPartOf: { "@type": "CollectionPage", name: "تحلیلگر‌ها", url: absoluteUrl("/analyzers") },
        }}
      />

      <p className="mb-4 text-sm">
        <Link href="/analyzers" className="text-muted hover:text-ink">
          تحلیلگر‌ها
        </Link>
      </p>

      <PageHeader title={pack.nameFa} lede={pack.summaryFa} />

      {account ? (
        <CasioSsRun pack={pack} />
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
