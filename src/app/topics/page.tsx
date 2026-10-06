import { db } from "@/db";
import { topics, knowledgeTopics, projectTopics, courseTopics } from "@/db/schema";
import { count } from "drizzle-orm";
import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "موضوعات",
  description: "موضوعات اتصال‌دهندهٔ دانش، آزمایشگاه و دوره‌های هادیران — پل گراف اکوسیستم، نه یک جهان جدا.",
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
    db.select({ topicId: projectTopics.topicId, n: count() }).from(projectTopics).groupBy(projectTopics.topicId),
    db.select({ topicId: courseTopics.topicId, n: count() }).from(courseTopics).groupBy(courseTopics.topicId),
  ]);

  const toMap = (rows: { topicId: number; n: number }[]) => Object.fromEntries(rows.map((r) => [r.topicId, Number(r.n)]));
  const knowledgeByTopic = toMap(knowledgeCounts);
  const projectByTopic = toMap(projectCounts);
  const courseByTopic = toMap(courseCounts);

  return (
    <PageShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "موضوعات هادیران",
          description: "موضوعات اتصال‌دهندهٔ دانش، آزمایشگاه و دوره‌های هادیران.",
          url: absoluteUrl("/topics"),
        }}
      />
      <PageHeader
        title="موضوعات"
        lede="پل گراف اکوسیستم: هر موضوع دانش، پروژه و دورهٔ مرتبط را در یک صفحه جمع می‌کند."
      />

      {allTopics.length === 0 ? (
        <EmptyState title="موضوعی ثبت نشده." />
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {allTopics.map((topic) => {
            const k = knowledgeByTopic[topic.id] ?? 0;
            const p = projectByTopic[topic.id] ?? 0;
            const c = courseByTopic[topic.id] ?? 0;
            return (
              <li key={topic.id}>
                <Link href={`/topics/${topic.slug}`} className="surface block h-full p-6 transition hover:border-accent">
                  <h2 className="text-lg font-bold leading-[1.7] text-ink">{topic.labelFa}</h2>
                  {topic.labelEn ? (
                    <p className="mt-1 text-xs text-muted" dir="ltr">
                      {topic.labelEn}
                    </p>
                  ) : null}
                  {topic.descriptionFa ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-7 text-muted">{topic.descriptionFa}</p>
                  ) : null}
                  <p className="mt-4 text-xs text-muted">
                    {k.toLocaleString("fa-IR")} دانش · {p.toLocaleString("fa-IR")} پروژه · {c.toLocaleString("fa-IR")}{" "}
                    دوره
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
