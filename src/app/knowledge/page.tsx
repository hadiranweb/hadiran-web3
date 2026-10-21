import { db } from "@/db";
import { knowledgeTopics, topics } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentAccount } from "@/lib/auth/session";
import { loadPublicKnowledgeList } from "@/lib/public/catalog";
import { readPublicCollection } from "@/lib/public/source";
import Link from "next/link";
import { ArrowLeft, PenLine } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoomPage } from "@/components/ui/RoomPage";
import { EmptyState } from "@/components/ui/EmptyState";
import { PublicSourceNotice } from "@/components/ui/PublicSourceNotice";
import { getSiteCopy } from "@/lib/content/site-copy";
import { CollectionChips, CollectionEmpty, CollectionSearch } from "@/components/ui/CollectionControls";
import { growthLabel, minutesFa, type KnowledgeGrowth } from "@/lib/knowledge/article";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getSiteCopy();
  return {
    title: copy.knowledgeCopy.title,
    description: copy.knowledgeCopy.lede,
    alternates: { canonical: "/knowledge" },
  };
}

const typeLabels: Record<string, string> = {
  wiki: "ویکی",
  article: "مقاله",
  note: "یادداشت",
  research: "تحقیق",
  idea: "ایده",
};

interface Props {
  searchParams: Promise<{ topic?: string; q?: string; sort?: string; view?: string; short?: string }>;
}

export default async function KnowledgePage({ searchParams }: Props) {
  const copy = await getSiteCopy();
  const { topic, q = "", sort: sortRaw, view: viewRaw, short } = await searchParams;
  const account = await getCurrentAccount();
  const list = await loadPublicKnowledgeList(q);
  const sort = sortRaw === "old" || sortRaw === "title" ? sortRaw : "new";
  const view = viewRaw === "list" ? "list" : "cards";
  const shortOnly = short === "1";

  const topicLinks = await readPublicCollection("public knowledge topics", async () =>
    db
      .select({
        knowledgeId: knowledgeTopics.knowledgeId,
        labelFa: topics.labelFa,
        slug: topics.slug,
      })
      .from(knowledgeTopics)
      .innerJoin(topics, eq(knowledgeTopics.topicId, topics.id)),
  );

  const topicsMap: Record<number, { labelFa: string; slug: string }[]> = {};
  for (const row of topicLinks.items) {
    if (!topicsMap[row.knowledgeId]) topicsMap[row.knowledgeId] = [];
    topicsMap[row.knowledgeId].push({ labelFa: row.labelFa, slug: row.slug });
  }

  const baseList = list.items
    .filter((item) => (topic ? topicsMap[item.id]?.some((entry) => entry.slug === topic) : true))
    .filter((item) => (shortOnly ? typeof item.readingMinutes === "number" && item.readingMinutes <= 5 : true));
  const filteredKnowledge = [...baseList].sort((a, b) => {
    if (sort === "title") return a.titleFa.localeCompare(b.titleFa, "fa");
    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return sort === "old" ? at - bt : bt - at;
  });
  const keep = { topic, q: q || undefined, sort, view, short: shortOnly ? "1" : undefined };
  const withParams = (patch: Record<string, string | undefined>) => {
    const merged = { ...keep, ...patch };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) if (value) params.set(key, value);
    const query = params.toString();
    return query ? `/knowledge?${query}` : "/knowledge";
  };

  const filterLabel =
    (topic &&
      Object.values(topicsMap)
        .flat()
        .find((entry) => entry.slug === topic)?.labelFa) ||
    topic;

  return (
    <RoomPage
      hero={
        <PageHeader title={copy.knowledgeCopy.title} lede={copy.knowledgeCopy.lede}>
          {account?.role === "owner" ? (
            <Link href="/workspace/capture" className="ws-button ws-primary mt-5">
              <PenLine className="h-4 w-4" strokeWidth={1.5} />
              نوشتن مطلب
            </Link>
          ) : null}
        </PageHeader>
      }
    >
      <CollectionSearch
        action="/knowledge"
        q={q}
        placeholder="جستجو در باغ دانش..."
        hidden={{ topic, sort, view, short: shortOnly ? "1" : undefined }}
      />

      <CollectionChips
        label="مرتب‌سازی"
        links={[
          { href: withParams({ sort: "new" }), label: "تازه‌ترین", active: sort === "new" },
          { href: withParams({ sort: "old" }), label: "قدیمی‌ترین", active: sort === "old" },
          { href: withParams({ sort: "title" }), label: "الفبا", active: sort === "title" },
        ]}
      />
      <CollectionChips
        label="نمایش"
        links={[
          { href: withParams({ view: "cards" }), label: "کارت", active: view === "cards" },
          { href: withParams({ view: "list" }), label: "فهرست", active: view === "list" },
          {
            href: withParams({ short: shortOnly ? undefined : "1" }),
            label: "نوشتهٔ کوتاه (≤۵ دقیقه)",
            active: shortOnly,
          },
        ]}
      />

      {topic ? (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">فیلتر باغ دانش:</span>
          <Link href={`/topics/${topic}`} className="chip">
            {filterLabel}
          </Link>
          <Link href="/knowledge" className="text-sm text-muted hover:text-ink">
            پاک کردن فیلتر
          </Link>
        </div>
      ) : null}

      {list.source !== "live" ? (
        <PublicSourceNotice source={list.source} />
      ) : filteredKnowledge.length === 0 ? (
        list.items.length === 0 ? (
          <EmptyState title="هنوز مطلب منتشرشده‌ای نیست." />
        ) : (
          <CollectionEmpty
            title="با این صافی چیزی نبود."
            hint="جستجو یا صافی کوتاه را بردار؛ فهرست منتشرشده دست‌نخورده است."
          />
        )
      ) : (
        <ul className={view === "list" ? "section-cards listing-cards is-compact" : "section-cards listing-cards"}>
          {filteredKnowledge.map((item) => (
            <li key={item.id}>
              <Link href={`/knowledge/${item.slug}`} className="card card-hover section-card">
                <div className="section-card-copy">
                  <p className="chip">
                    {growthLabel(item.growth as KnowledgeGrowth) || typeLabels[item.type] || item.type}
                    {minutesFa(item.readingMinutes) ? ` · ${minutesFa(item.readingMinutes)}` : ""}
                  </p>
                  <h2 className="section-card-title mt-3">{item.titleFa}</h2>
                  {item.lineFa || item.summaryFa ? (
                    <p className="muted mt-2 line-clamp-3 text-sm leading-7">{item.lineFa || item.summaryFa}</p>
                  ) : null}
                  {topicsMap[item.id]?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {topicsMap[item.id].map((entry) => (
                        <span key={entry.slug} className="chip">
                          {entry.labelFa}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <span className="more">
                  خواندن
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </RoomPage>
  );
}
