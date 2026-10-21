import { db } from "@/db";
import { courseTopics, topics } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoomPage } from "@/components/ui/RoomPage";
import { EmptyState } from "@/components/ui/EmptyState";
import { PublicSourceNotice } from "@/components/ui/PublicSourceNotice";
import { loadPublicCourses } from "@/lib/public/catalog";
import { readPublicCollection } from "@/lib/public/source";
import { CollectionChips, CollectionEmpty, CollectionSearch } from "@/components/ui/CollectionControls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "دوره‌ها",
  description: "دوره‌های هادیران؛ تا دورهٔ واقعی نیاید فهرست خالی می‌ماند.",
  alternates: { canonical: "/courses" },
};

interface Props {
  searchParams: Promise<{ q?: string; type?: string; topic?: string }>;
}

function coursesHref(patch: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(patch)) if (value) params.set(key, value);
  const query = params.toString();
  return query ? `/courses?${query}` : "/courses";
}

export default async function CoursesPage({ searchParams }: Props) {
  const { q = "", type = "", topic = "" } = await searchParams;
  const list = await loadPublicCourses();
  const links = await readPublicCollection("public course topics", async () =>
    db
      .select({ courseId: courseTopics.courseId, labelFa: topics.labelFa, slug: topics.slug })
      .from(courseTopics)
      .innerJoin(topics, eq(courseTopics.topicId, topics.id)),
  );

  const courseTopicsMap: Record<number, { labelFa: string; slug: string }[]> = {};
  for (const row of links.items) {
    if (!courseTopicsMap[row.courseId]) courseTopicsMap[row.courseId] = [];
    courseTopicsMap[row.courseId].push({ labelFa: row.labelFa, slug: row.slug });
  }

  const query = q.trim().toLowerCase();
  const visible = list.items
    .filter((course) => (type === "free" || type === "paid" ? course.type === type : true))
    .filter((course) => (topic ? courseTopicsMap[course.id]?.some((entry) => entry.slug === topic) : true))
    .filter((course) =>
      query ? `${course.titleFa} ${course.descriptionFa ?? ""}`.toLowerCase().includes(query) : true,
    );
  const topicLinksList = Object.values(courseTopicsMap)
    .flat()
    .filter((entry, index, all) => all.findIndex((row) => row.slug === entry.slug) === index)
    .slice(0, 8)
    .map((entry) => ({
      href: coursesHref({ q, type, topic: entry.slug }),
      label: entry.labelFa,
      active: topic === entry.slug,
    }));

  return (
    <RoomPage hero={<PageHeader title="دوره‌ها" lede="آموزش در هادیران؛ تا دورهٔ واقعی نیاید فهرست خالی می‌ماند." />}>
      <CollectionSearch action="/courses" q={q} placeholder="جستجو در دوره‌ها..." hidden={{ type, topic }} />
      <CollectionChips
        label="نوع"
        links={[
          { href: coursesHref({ q, topic }), label: "همه", active: !type },
          { href: coursesHref({ q, topic, type: "free" }), label: "رایگان", active: type === "free" },
          { href: coursesHref({ q, topic, type: "paid" }), label: "فروشی", active: type === "paid" },
        ]}
      />
      <CollectionChips label="موضوع" links={topicLinksList} />

      {list.source !== "live" ? (
        <PublicSourceNotice source={list.source} />
      ) : list.items.length === 0 ? (
        <EmptyState title="هنوز دوره‌ای منتشر نشده." />
      ) : visible.length === 0 ? (
        <CollectionEmpty title="با این صافی دوره‌ای نبود." hint="صافی نوع، موضوع یا جستجو را بردار." />
      ) : (
        <ul className="section-cards listing-cards">
          {visible.map((course) => (
            <li key={course.id}>
              <Link href={`/courses/${course.slug}`} className="card card-hover section-card">
                <div className="section-card-copy">
                  <p className="chip">{course.type === "free" ? "رایگان" : "فروشی"}</p>
                  <h2 className="section-card-title mt-3">{course.titleFa}</h2>
                  {course.descriptionFa ? (
                    <p className="muted mt-2 line-clamp-2 text-sm leading-7">{course.descriptionFa}</p>
                  ) : null}
                  {courseTopicsMap[course.id]?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {courseTopicsMap[course.id].map((topic) => (
                        <span key={topic.slug} className="chip">
                          {topic.labelFa}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <span className="more">
                  ورود
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
