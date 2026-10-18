import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AnalyzerRun } from "@/components/analyzers/AnalyzerRun";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { readAttempt } from "@/lib/analyzers/attempts";
import { getCodePack, loadPack } from "@/lib/analyzers/registry";
import { getCurrentAccount } from "@/lib/auth/session";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function visiblePack(slug: string, role?: string) {
  if (getCodePack(slug)) return null;
  const pack = await loadPack(slug);
  if (!pack || pack.status === "archived") return null;
  if (pack.status !== "open" && role !== "owner") return null;
  return pack;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pack = await loadPack(slug);
  if (!pack || getCodePack(slug) || pack.status !== "open") {
    return { title: "تحلیلگر", robots: { index: false, follow: false } };
  }
  return {
    title: pack.nameFa,
    description: pack.summaryFa,
    alternates: { canonical: `/analyzers/${pack.slug}` },
  };
}

export default async function AnalyzerMemberPage({ params }: Props) {
  const { slug } = await params;
  const account = await getCurrentAccount();
  const pack = await visiblePack(slug, account?.role);
  if (!pack) notFound();

  if (account) {
    const attempt = await readAttempt(account.id, pack);
    if (attempt?.status === "submitted") {
      redirect(`/analyzers/${pack.slug}/report`);
    }
  }

  const indexable = pack.status === "open";

  return (
    <PageShell width="narrow">
      {indexable ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: pack.nameFa,
            url: absoluteUrl(`/analyzers/${pack.slug}`),
            inLanguage: "fa",
            description: pack.summaryFa,
            isPartOf: { "@type": "CollectionPage", name: "تحلیلگر‌ها", url: absoluteUrl("/analyzers") },
          }}
        />
      ) : null}

      <p className="mb-4 text-sm">
        <Link href="/analyzers" className="text-muted hover:text-ink">
          تحلیلگر‌ها
        </Link>
      </p>

      <PageHeader title={pack.nameFa} lede={pack.summaryFa} />

      {account ? (
        <AnalyzerRun pack={pack} />
      ) : (
        <section className="surface p-6 sm:p-8">
          <p className="text-sm leading-7 text-muted">برای شروع ارزیابی وارد حساب شوید. سؤال‌ها فرم است، نه گفتگو.</p>
          <Link
            href={`/signin?next=/analyzers/${pack.slug}`}
            className="mt-5 inline-flex rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg"
          >
            ورود و شروع
          </Link>
        </section>
      )}
    </PageShell>
  );
}
