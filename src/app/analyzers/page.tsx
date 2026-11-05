import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { AnalyzerDirectory } from "@/components/landing/AnalyzerDirectory";
import { loadAnalyzers } from "@/lib/analyzers/catalog";
import { absoluteUrl } from "@/lib/site";
import { mirrorsCopy } from "@/lib/copy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: mirrorsCopy.title,
  description: mirrorsCopy.lede,
  alternates: { canonical: "/analyzers" },
  openGraph: {
    title: mirrorsCopy.title,
    description: mirrorsCopy.lede,
    url: "/analyzers",
    locale: "fa_IR",
    type: "website",
  },
};

export default async function AnalyzersPage() {
  const analyzers = await loadAnalyzers();

  return (
    <>
      <JsonLd data={{ "@context":"https://schema.org", "@type":"CollectionPage",name:mirrorsCopy.title,url:absoluteUrl("/analyzers"),inLanguage:"fa",description:mirrorsCopy.lede }} />
      <AnalyzerDirectory items={analyzers} />
    </>
  );
}
