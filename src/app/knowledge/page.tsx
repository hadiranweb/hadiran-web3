import { db } from "@/db";
import { knowledge, knowledgeTopics, memoryItems, topics } from "@/db/schema";
import { and, eq, like, or } from "drizzle-orm";
import { publicKnowledgeFilter } from "@/lib/knowledge/public";
import { getCurrentAccount } from "@/lib/auth/session";
import Link from "next/link";
import { BookOpen, Hash, Search, PenLine } from "lucide-react";
import type { Metadata } from "next";

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

const typeStyles: Record<string, string> = {
  wiki: "bg-blue-50 text-blue-700",
  article: "bg-indigo-50 text-indigo-700",
  note: "bg-amber-50 text-amber-700",
  research: "bg-purple-50 text-purple-700",
  idea: "bg-rose-50 text-rose-700",
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
          like(knowledge.bodyFa, `%${q}%`)
        )
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
    <main className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">دانشنامه</h1>
        <p className="mt-3 text-slate-600">مقالات، یادداشت‌ها، تحقیق‌ها و ایده‌های هادیران</p>
        {account?.role === "owner" ? (
          <Link
            href="/workspace/capture"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <PenLine className="h-4 w-4" />
            نوشتن مطلب
          </Link>
        ) : null}
      </header>

      <form action="/knowledge" method="get" className="mx-auto mb-8 flex max-w-xl gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q || ""}
          placeholder="جستجو در دانشنامه..."
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="submit"
          className="flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Search className="h-4 w-4" />
          جستجو
        </button>
      </form>

      {topic && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">فیلتر دانشنامه:</span>
          <Link
            href={`/topics/${topic}`}
            className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
          >
            {filterLabel}
          </Link>
          <Link href="/knowledge" className="text-sm text-slate-400 hover:text-slate-600">
            پاک کردن فیلتر
          </Link>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredKnowledge.map((item) => (
          <Link
            key={item.id}
            href={`/knowledge/${item.slug}`}
            className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  typeStyles[item.type] || "bg-slate-100 text-slate-700"
                }`}
              >
                {typeLabels[item.type] || item.type}
              </span>
              <BookOpen className="h-5 w-5 text-slate-300 group-hover:text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700">
              {item.titleFa}
            </h2>
            <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{item.summaryFa}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {topicsMap[item.id]?.map((t) => (
                <span
                  key={t.slug}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
                >
                  <Hash className="h-3 w-3" />
                  {t.labelFa}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
