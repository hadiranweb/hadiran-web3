import { db } from "@/db";
import {
  topics,
  knowledgeTopics,
  projectTopics,
  courseTopics,
} from "@/db/schema";
import { count } from "drizzle-orm";
import Link from "next/link";
import { Hash } from "lucide-react";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "موضوعات",
  description:
    "موضوعات اتصال‌دهندهٔ دانش، آزمایشگاه و دوره‌های هادیران — پل گراف اکوسیستم، نه یک جهان جدا.",
  alternates: { canonical: "/topics" },
  openGraph: {
    title: "موضوعات هادیران",
    description: "پل بین دانشنامه، آزمایشگاه و آکادمی.",
    url: "/topics",
    locale: "fa_IR",
    type: "website",
  },
};

export default async function TopicsPage() {
  const allTopics = await db.select().from(topics);

  const [knowledgeCounts, projectCounts, courseCounts] = await Promise.all([
    db
      .select({ topicId: knowledgeTopics.topicId, n: count() })
      .from(knowledgeTopics)
      .groupBy(knowledgeTopics.topicId),
    db
      .select({ topicId: projectTopics.topicId, n: count() })
      .from(projectTopics)
      .groupBy(projectTopics.topicId),
    db
      .select({ topicId: courseTopics.topicId, n: count() })
      .from(courseTopics)
      .groupBy(courseTopics.topicId),
  ]);

  const toMap = (rows: { topicId: number; n: number }[]) =>
    Object.fromEntries(rows.map((r) => [r.topicId, Number(r.n)]));
  const knowledgeByTopic = toMap(knowledgeCounts);
  const projectByTopic = toMap(projectCounts);
  const courseByTopic = toMap(courseCounts);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "موضوعات هادیران",
          description:
            "موضوعات اتصال‌دهندهٔ دانش، آزمایشگاه و دوره‌های هادیران.",
          url: absoluteUrl("/topics"),
        }}
      />
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">موضوعات</h1>
        <p className="mt-3 text-slate-600">
          پل گراف اکوسیستم: هر موضوع دانش، پروژه و دورهٔ مرتبط را در یک صفحه جمع می‌کند.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {allTopics.map((topic) => {
          const k = knowledgeByTopic[topic.id] ?? 0;
          const p = projectByTopic[topic.id] ?? 0;
          const c = courseByTopic[topic.id] ?? 0;
          return (
            <Link
              key={topic.id}
              href={`/topics/${topic.slug}`}
              className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              style={topic.color ? { borderTopColor: topic.color, borderTopWidth: 4 } : undefined}
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: topic.color ? `${topic.color}22` : "#eef2ff",
                    color: topic.color || "#4f46e5",
                  }}
                >
                  <Hash className="h-5 w-5" />
                </span>
                {topic.labelEn && (
                  <span className="text-xs text-slate-400" dir="ltr">
                    {topic.labelEn}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700">
                {topic.labelFa}
              </h2>
              {topic.descriptionFa && (
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
                  {topic.descriptionFa}
                </p>
              )}
              <p className="mt-4 text-xs text-slate-500">
                {k.toLocaleString("fa-IR")} دانش · {p.toLocaleString("fa-IR")} پروژه ·{" "}
                {c.toLocaleString("fa-IR")} دوره
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
