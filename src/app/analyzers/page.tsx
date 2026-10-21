import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoomPage } from "@/components/ui/RoomPage";
import { analyzerHref, loadAnalyzers } from "@/lib/analyzers/catalog";
import { absoluteUrl } from "@/lib/site";
import { mirrorsCopy } from "@/lib/copy";
import { CollectionChips, CollectionEmpty, CollectionSearch } from "@/components/ui/CollectionControls";

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

interface Props {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function AnalyzersPage({ searchParams }: Props) {
  const { q = "", status = "" } = await searchParams;
  const analyzers = await loadAnalyzers();
  const query = q.trim().toLowerCase();
  const visible = analyzers
    .filter((item) => (status ? item.status === status : true))
    .filter((item) => (query ? `${item.nameFa} ${item.summaryFa}`.toLowerCase().includes(query) : true));

  return (
    <RoomPage
      hero={
        <>
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
          <PageHeader title={mirrorsCopy.title} lede={mirrorsCopy.lede} />
        </>
      }
    >
      <CollectionSearch
        action="/analyzers"
        q={q}
        placeholder="جستجو در نام آزمون‌ها..."
        hidden={{ status }}
      />
      <CollectionChips
        label="وضعیت"
        links={[
          { href: "/analyzers", label: "همه", active: !status },
          { href: "/analyzers?status=open", label: "باز", active: status === "open" },
          { href: "/analyzers?status=preparing", label: "در آماده‌سازی", active: status === "preparing" },
          { href: "/analyzers?status=archived", label: "بایگانی", active: status === "archived" },
        ]}
      />

      {visible.length === 0 ? (
        <CollectionEmpty title="با این صافی آزمونی نبود." hint="صافی وضعیت یا جستجو را بردار." />
      ) : null}

      <ul className="section-cards listing-cards">
        {visible.map((item) => {
          const href = analyzerHref(item);
          const body = (
            <>
              <div className="section-card-copy">
                <p className="chip">{statusFa[item.status]}</p>
                <h2 className="section-card-title mt-3">{item.nameFa}</h2>
                <p className="muted mt-2 text-sm leading-7">{item.summaryFa}</p>
              </div>
              {href ? (
                <span className="more">
                  شروع
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                </span>
              ) : null}
            </>
          );

          return (
            <li key={item.slug}>
              {href ? (
                <Link href={href} className="card card-hover section-card">
                  {body}
                </Link>
              ) : (
                <article className="card section-card">{body}</article>
              )}
            </li>
          );
        })}
      </ul>
    </RoomPage>
  );
}
