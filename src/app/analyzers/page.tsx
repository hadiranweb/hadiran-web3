import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { analyzerHref, loadAnalyzers } from "@/lib/analyzers/catalog";
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

const statusFa: Record<"preparing" | "open" | "archived", string> = {
  preparing: "در آماده‌سازی",
  open: "باز",
  archived: "بایگانی",
};

export default async function AnalyzersPage() {
  const analyzers = await loadAnalyzers();

  return (
    <PageShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: mirrorsCopy.title,
          url: absoluteUrl("/analyzers"),
          inLanguage: "fa",
          description: mirrorsCopy.lede,
        }}
      />

      <PageHeader
        title={mirrorsCopy.title}
        lede={mirrorsCopy.lede}
      />

      <ul className="grid gap-5 md:grid-cols-2">
        {analyzers.map((item) => {
          const href = analyzerHref(item);
          const body = (
            <>
              <p className="text-xs font-medium text-mark">{statusFa[item.status]}</p>
              <h2 className="mt-2 text-xl font-bold leading-[1.7] text-ink">{item.nameFa}</h2>
              <p className="mt-2 text-sm leading-7 text-muted">{item.summaryFa}</p>
            </>
          );

          return (
            <li key={item.slug}>
              {href ? (
                <Link href={href} className="surface block h-full p-6 transition hover:border-accent">
                  {body}
                </Link>
              ) : (
                <article className="surface h-full p-6">{body}</article>
              )}
            </li>
          );
        })}
      </ul>
    </PageShell>
  );
}
