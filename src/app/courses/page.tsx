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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "آکادمی",
  description: "دوره‌های هادیران؛ تا دورهٔ واقعی نیاید فهرست خالی می‌ماند.",
  alternates: { canonical: "/courses" },
};

export default async function CoursesPage() {
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

  return (
    <RoomPage hero={<PageHeader title="دوره‌ها" lede="آموزش در هادیران؛ تا دورهٔ واقعی نیاید فهرست خالی می‌ماند." />}>
      {list.source !== "live" ? (
        <PublicSourceNotice source={list.source} />
      ) : list.items.length === 0 ? (
        <EmptyState title="هنوز دوره‌ای منتشر نشده." />
      ) : (
        <ul className="section-cards listing-cards">
          {list.items.map((course) => (
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
