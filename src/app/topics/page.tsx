import { db } from "@/db";
import { topics, projectTopics, courseTopics, projects, courses } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoomPage } from "@/components/ui/RoomPage";
import { EmptyState } from "@/components/ui/EmptyState";
import { PublicSourceNotice } from "@/components/ui/PublicSourceNotice";
import { loadPublicTopicKnowledgeCounts } from "@/lib/public/catalog";
import { publicCourseFilter, publicProjectFilter } from "@/lib/public/policy";
import { readPublicCollection } from "@/lib/public/source";

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
  const topicList = await readPublicCollection("public topics", () => db.select().from(topics));
  const knowledgeCounts = await loadPublicTopicKnowledgeCounts();
  const projectCounts = await readPublicCollection("public topic project counts", async () =>
    db
      .select({ topicId: projectTopics.topicId, n: count() })
      .from(projectTopics)
      .innerJoin(projects, eq(projectTopics.projectId, projects.id))
      .where(publicProjectFilter)
      .groupBy(projectTopics.topicId),
  );
  const courseCounts = await readPublicCollection("public topic course counts", async () =>
    db
      .select({ topicId: courseTopics.topicId, n: count() })
      .from(courseTopics)
      .innerJoin(courses, eq(courseTopics.courseId, courses.id))
      .where(publicCourseFilter)
      .groupBy(courseTopics.topicId),
  );

  const toMap = (rows: { topicId: number; n: number }[]) => Object.fromEntries(rows.map((row) => [row.topicId, Number(row.n)]));
  const knowledgeByTopic = toMap(knowledgeCounts.items);
  const projectByTopic = toMap(projectCounts.items);
  const courseByTopic = toMap(courseCounts.items);
  const segment = (source: string, value: number) =>
    source === "live" ? value.toLocaleString("fa-IR") : "—";

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
      {topicList.source !== "live" ? (
        <PublicSourceNotice source={topicList.source} />
      ) : topicList.items.length === 0 ? (
        <EmptyState title="موضوعی ثبت نشده." />
      ) : (
        <ul className="section-cards listing-cards">
          {topicList.items.map((topic) => {
            const k = segment(knowledgeCounts.source, knowledgeByTopic[topic.id] ?? 0);
            const p = segment(projectCounts.source, projectByTopic[topic.id] ?? 0);
            const c = segment(courseCounts.source, courseByTopic[topic.id] ?? 0);
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
                      {k} دانش · {p} پروژه · {c} دوره
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
