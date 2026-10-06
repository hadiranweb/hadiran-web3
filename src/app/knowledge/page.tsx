import { db } from "@/db";
import { knowledge, knowledgeTopics, memoryItems, topics } from "@/db/schema";
import { and, eq, like, or } from "drizzle-orm";
import { publicKnowledgeFilter } from "@/lib/knowledge/public";
import { getCurrentAccount } from "@/lib/auth/session";
import Link from "next/link";
import { Search, PenLine } from "lucide-react";
import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "دانشنامه",
  description: "مقالات، یادداشت‌ها، تحقیق‌ها و ایده‌های هادیران دربارهٔ وب۳، هوش مصنوعی و اتوماسیون.",
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
    <PageShell>
      <PageHeader title="دانشنامه" lede="مقالات، یادداشت‌ها، تحقیق‌ها و ایده‌های هادیران">
        {account?.role === "owner" ? (
          <Link
            href="/workspace/capture"
            className="mt-5 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-ink px-4 py-2 text-sm font-medium text-paper"
          >
            <PenLine className="h-4 w-4" strokeWidth={1.5} />
            نوشتن مطلب
          </Link>
        ) : null}
      </PageHeader>

      <form action="/knowledge" method="get" className="mb-8 flex max-w-xl gap-2">
        {topic ? <input type="hidden" name="topic" value={topic} /> : null}
        <input
          type="text"
          name="q"
          defaultValue={q || ""}
          placeholder="جستجو در دانشنامه..."
          className="flex-1 rounded-[var(--radius-md)] border border-line bg-elev px-4 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-[var(--radius-md)] bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg"
        >
          <Search className="h-4 w-4" strokeWidth={1.5} />
          جستجو
        </button>
      </form>

      {topic ? (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">فیلتر دانشنامه:</span>
          <Link href={`/topics/${topic}`} className="rounded-full border border-line bg-elev px-3 py-1 text-sm text-ink">
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
        <ul className="grid gap-5 md:grid-cols-2">
          {filteredKnowledge.map((item) => (
            <li key={item.id}>
              <Link href={`/knowledge/${item.slug}`} className="surface block h-full p-6 transition hover:border-accent">
                <p className="text-xs font-medium text-mark">{typeLabels[item.type] || item.type}</p>
                <h2 className="mt-2 text-lg font-bold leading-[1.7] text-ink">{item.titleFa}</h2>
                {item.summaryFa ? <p className="mt-2 line-clamp-3 text-sm leading-7 text-muted">{item.summaryFa}</p> : null}
                {topicsMap[item.id]?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {topicsMap[item.id].map((t) => (
                      <span key={t.slug} className="rounded-full bg-paper px-2 py-1 text-xs text-muted">
                        {t.labelFa}
                      </span>
                    ))}
                  </div>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
