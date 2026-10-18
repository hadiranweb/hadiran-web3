import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AnalyzerPublicScreen } from "@/components/analyzers/AnalyzerPublicScreen";
import { JsonLd } from "@/components/JsonLd";
import { PageShell } from "@/components/ui/PageShell";
import { resolveLivePack } from "@/lib/analyzers/authored";
import { readAttempt } from "@/lib/analyzers/casio-ss/attempts";
import { buildCasioAuthoredPack } from "@/lib/analyzers/casio-ss/authored-pack";
import { INTRO_SUMMARY } from "@/lib/analyzers/casio-ss/instrument";
import { analyzerPublicPath } from "@/lib/analyzers/paths";
import { getCurrentAccount } from "@/lib/auth/session";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const PATH = analyzerPublicPath("casio-ss");

async function livePack() {
  return (await resolveLivePack("casio-ss")) ?? buildCasioAuthoredPack();
}

export async function generateMetadata(): Promise<Metadata> {
  const pack = await livePack();
  return {
    title: pack.nameFa,
    description: pack.summaryFa || INTRO_SUMMARY,
    alternates: { canonical: PATH },
    openGraph: {
      title: pack.nameFa,
      description: pack.summaryFa || INTRO_SUMMARY,
      url: PATH,
      locale: "fa_IR",
      type: "website",
    },
  };
}

export default async function CasioSsPage() {
  const pack = await livePack();
  const account = await getCurrentAccount();
  let resume = false;
  if (account) {
    const attempt = await readAttempt(account.id);
    if (attempt?.status === "submitted") {
      redirect(`${PATH}/report`);
    }
    resume = attempt?.status === "in_progress";
  }

  return (
    <PageShell width="narrow" className="py-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: pack.nameFa,
          url: absoluteUrl(PATH),
          inLanguage: "fa",
          description: pack.summaryFa,
          isPartOf: { "@type": "CollectionPage", name: "تحلیلگر‌ها", url: absoluteUrl("/analyzers") },
        }}
      />

      <AnalyzerPublicScreen pack={pack} signedIn={Boolean(account)} resume={resume} />
    </PageShell>
  );
}
