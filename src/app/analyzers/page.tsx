import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoomPage } from "@/components/ui/RoomPage";
import { analyzerHref, loadAnalyzers } from "@/lib/analyzers/catalog";
import { absoluteUrl } from "@/lib/site";
import { getSiteCopy } from "@/lib/content/site-copy";
import { CollectionChips, CollectionEmpty, CollectionSearch } from "@/components/ui/CollectionControls";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getSiteCopy();
  return {
    title: copy.mirrorsCopy.title,
    description: copy.mirrorsCopy.lede,
    alternates: { canonical: "/analyzers" },
    openGraph: {
      title: copy.mirrorsCopy.title,
      description: copy.mirrorsCopy.lede,
      url: "/analyzers",
      locale: "fa_IR",
      type: "website",
    },
  };
}

const statusFa: Record<"preparing" | "open" | "archived", string> = {
  preparing: "در آماده‌سازی",
  open: "باز",
  archived: "بایگانی",
};

interface Props {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function AnalyzersPage({ searchParams }: Props) {
  const copy = await getSiteCopy();
  const { q = "", status = "" } = await searchParams;
  const analyzers = await loadAnalyzers();
  const query = q.trim().toLowerCase();
  const withQuery = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ q: q.trim() || undefined, ...patch })) {
      if (value) params.set(key, value);
    }
    const search = params.toString();
    return search ? `/analyzers?${search}` : "/analyzers";
  };

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
              name: copy.mirrorsCopy.title,
              url: absoluteUrl("/analyzers"),
              inLanguage: "fa",
              description: copy.mirrorsCopy.lede,
            }}
          />
          <PageHeader title={copy.mirrorsCopy.title} lede={copy.mirrorsCopy.lede} />
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
          { href: withQuery({ status: undefined }), label: "همه", active: !status },
          { href: withQuery({ status: "open" }), label: "باز", active: status === "open" },
          { href: withQuery({ status: "preparing" }), label: "در آماده‌سازی", active: status === "preparing" },
          { href: withQuery({ status: "archived" }), label: "بایگانی", active: status === "archived" },
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
                <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                  <span title="تخمین از روی تعداد و نوع پرسش‌ها">{item.estimateLabelFa}</span>
                  <span>{item.estimate.questionCount.toLocaleString("fa-IR")} پرسش</span>
                  <span>{item.estimate.sectionCount.toLocaleString("fa-IR")} بخش</span>
                </p>
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
