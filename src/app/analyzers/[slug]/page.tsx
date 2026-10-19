import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AnalyzerPublicScreen } from "@/components/analyzers/AnalyzerPublicScreen";
import { JsonLd } from "@/components/JsonLd";
import { PageShell } from "@/components/ui/PageShell";
import { analyzerPublicPath } from "@/lib/analyzers/paths";
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
    return { title: "آینه", robots: { index: false, follow: false } };
  }
  return {
    title: pack.nameFa,
    description: pack.summaryFa,
    alternates: { canonical: analyzerPublicPath(pack.slug) },
  };
}

export default async function AnalyzerMemberPage({ params }: Props) {
  const { slug } = await params;
  const account = await getCurrentAccount();
  const pack = await visiblePack(slug, account?.role);
  if (!pack) notFound();

  let resume = false;
  if (account) {
    const attempt = await readAttempt(account.id, pack);
    if (attempt?.status === "submitted") {
      redirect(`${analyzerPublicPath(pack.slug)}/report`);
    }
    resume = attempt?.status === "in_progress";
  }

  const indexable = pack.status === "open";
  const path = analyzerPublicPath(pack.slug);

  return (
    <PageShell width="narrow" className="py-6">
      {indexable ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: pack.nameFa,
            url: absoluteUrl(path),
            inLanguage: "fa",
            description: pack.summaryFa,
            isPartOf: { "@type": "CollectionPage", name: "آینه‌ها", url: absoluteUrl("/analyzers") },
          }}
        />
      ) : null}

      <AnalyzerPublicScreen pack={pack} signedIn={Boolean(account)} resume={resume} />
    </PageShell>
  );
}
