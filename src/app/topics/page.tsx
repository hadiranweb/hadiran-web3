import { db } from "@/db";
import { topics, knowledgeTopics, projectTopics, courseTopics } from "@/db/schema";
import { count } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoomPage } from "@/components/ui/RoomPage";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "موضوعات",
  description: "موضوعات اتصال‌دهندهٔ باغ دانش، کارگاه و دوره‌های هادیران — پل خانه، نه یک جهان جدا.",
  alternates: { canonical: "/topics" },
  openGraph: {
    title: "موضوعات هادیران",
    description: "پل بین باغ دانش، کارگاه و دوره‌ها.",
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
    <RoomPage
      hero={
        <>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "موضوعات هادیران",
              description: "موضوعات اتصال‌دهندهٔ باغ دانش، کارگاه و دوره‌های هادیران.",
              url: absoluteUrl("/topics"),
            }}
          />
          <PageHeader
            title="موضوعات"
            lede="پل خانه: هر موضوع باغ دانش، ظرف کارگاه و دورهٔ مرتبط را در یک صفحه جمع می‌کند."
          />
        </>
      }
    >
      {allTopics.length === 0 ? (
        <EmptyState title="موضوعی ثبت نشده." />
      ) : (
        <ul className="section-cards listing-cards">
          {allTopics.map((topic) => {
            const k = knowledgeByTopic[topic.id] ?? 0;
            const p = projectByTopic[topic.id] ?? 0;
            const c = courseByTopic[topic.id] ?? 0;
            return (
              <li key={topic.id}>
                <Link href={`/topics/${topic.slug}`} className="card card-hover section-card">
                  <div className="section-card-copy">
                    <h2 className="section-card-title">{topic.labelFa}</h2>
                    {topic.labelEn ? (
                      <p className="muted mt-1 text-xs" dir="ltr">
                        {topic.labelEn}
                      </p>
                    ) : null}
                    {topic.descriptionFa ? (
                      <p className="muted mt-2 line-clamp-3 text-sm leading-7">{topic.descriptionFa}</p>
                    ) : null}
                    <p className="chip mt-4">
                      {k.toLocaleString("fa-IR")} دانش · {p.toLocaleString("fa-IR")} پروژه · {c.toLocaleString("fa-IR")}{" "}
                      دوره
                    </p>
                  </div>
                  <span className="more">
                    ورود
                    <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </RoomPage>
  );
}
