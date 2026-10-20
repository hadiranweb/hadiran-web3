import { db } from "@/db";
import { knowledge, knowledgeTopics, memoryItems, topics } from "@/db/schema";
import { and, eq, like, or } from "drizzle-orm";
import { publicKnowledgeFilter } from "@/lib/knowledge/public";
import { getCurrentAccount } from "@/lib/auth/session";
import Link from "next/link";
import { ArrowLeft, Search, PenLine } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoomPage } from "@/components/ui/RoomPage";
import { EmptyState } from "@/components/ui/EmptyState";
import { knowledgeCopy } from "@/lib/copy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: knowledgeCopy.title,
  description: knowledgeCopy.lede,
  alternates: { canonical: "/knowledge" },
};

const typeLabels: Record<string, string> = {
  wiki: "ویکی",
  article: "مقاله",
  note: "یادداشت",
  research: "تحقیق",
  idea: "ایده",
};

interface Props {
  searchParams: Promise<{ topic?: string; q?: string }>;
}

export default async function KnowledgePage({ searchParams }: Props) {
  const { topic, q } = await searchParams;
  const account = await getCurrentAccount();

  let allKnowledge: (typeof knowledge.$inferSelect)[] = [];
  try {
    const filters = [publicKnowledgeFilter];
    if (q) {
      filters.push(
        or(
          like(knowledge.titleFa, `%${q}%`),
          like(knowledge.summaryFa, `%${q}%`),
          like(knowledge.bodyFa, `%${q}%`),
        ),
      );
    }
    const rows = await db
      .select({ item: knowledge })
      .from(knowledge)
      .innerJoin(memoryItems, eq(knowledge.memoryItemId, memoryItems.id))
      .where(and(...filters));
    allKnowledge = rows.map((row) => row.item);
  } catch (error) {
    console.error("[hadiran] knowledge list", error);
  }

  const topicLinks = await db
    .select({
      knowledgeId: knowledgeTopics.knowledgeId,
      labelFa: topics.labelFa,
      slug: topics.slug,
    })
    .from(knowledgeTopics)
    .innerJoin(topics, eq(knowledgeTopics.topicId, topics.id));

  const topicsMap: Record<number, { labelFa: string; slug: string }[]> = {};
  for (const row of topicLinks) {
    if (!topicsMap[row.knowledgeId]) topicsMap[row.knowledgeId] = [];
    topicsMap[row.knowledgeId].push({ labelFa: row.labelFa, slug: row.slug });
  }

  const filteredKnowledge = topic
    ? allKnowledge.filter((k) => topicsMap[k.id]?.some((t) => t.slug === topic))
    : allKnowledge;

  const filterLabel =
    (topic &&
      Object.values(topicsMap)
        .flat()
        .find((t) => t.slug === topic)?.labelFa) ||
    topic;

  return (
    <RoomPage
      hero={
        <PageHeader title={knowledgeCopy.title} lede={knowledgeCopy.lede}>
          {account?.role === "owner" ? (
            <Link href="/workspace/capture" className="ws-button ws-primary mt-5">
              <PenLine className="h-4 w-4" strokeWidth={1.5} />
              نوشتن مطلب
            </Link>
          ) : null}
        </PageHeader>
      }
    >
      <form action="/knowledge" method="get" className="mb-8 flex max-w-xl gap-2">
        {topic ? <input type="hidden" name="topic" value={topic} /> : null}
        <input
          type="text"
          name="q"
          defaultValue={q || ""}
          placeholder="جستجو در باغ دانش..."
          className="flex-1 rounded-[var(--radius-md)] border border-line bg-elev px-4 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
        <button type="submit" className="ws-button ws-primary">
          <Search className="h-4 w-4" strokeWidth={1.5} />
          جستجو
        </button>
      </form>

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

      {filteredKnowledge.length === 0 ? (
        <EmptyState title="هنوز مطلب منتشرشده‌ای نیست." />
      ) : (
        <ul className="section-cards listing-cards">
          {filteredKnowledge.map((item) => (
            <li key={item.id}>
              <Link href={`/knowledge/${item.slug}`} className="card card-hover section-card">
                <div className="section-card-copy">
                  <p className="chip">{typeLabels[item.type] || item.type}</p>
                  <h2 className="section-card-title mt-3">{item.titleFa}</h2>
                  {item.summaryFa ? <p className="muted mt-2 line-clamp-3 text-sm leading-7">{item.summaryFa}</p> : null}
                  {topicsMap[item.id]?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {topicsMap[item.id].map((t) => (
                        <span key={t.slug} className="chip">
                          {t.labelFa}
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
