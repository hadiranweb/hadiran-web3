import { db } from "@/db";
import { courses, courseTopics, topics } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "آکادمی",
  description: "دوره‌های آموزشی هادیران برای یادگیری وب۳، هوش مصنوعی و اتوماسیون.",
  alternates: { canonical: "/courses" },
};

export default async function CoursesPage() {
  const allCourses = await db.select().from(courses);

  const courseTopicsMap: Record<number, { labelFa: string; slug: string }[]> = {};
  const links = await db
    .select({ courseId: courseTopics.courseId, labelFa: topics.labelFa, slug: topics.slug })
    .from(courseTopics)
    .innerJoin(topics, eq(courseTopics.topicId, topics.id));

  for (const row of links) {
    if (!courseTopicsMap[row.courseId]) courseTopicsMap[row.courseId] = [];
    courseTopicsMap[row.courseId].push({ labelFa: row.labelFa, slug: row.slug });
  }

  return (
    <PageShell>
      <PageHeader title="دوره‌ها" lede="آموزش در هادیران؛ تا دورهٔ واقعی نیاید فهرست خالی می‌ماند." />

      {allCourses.length === 0 ? (
        <EmptyState title="هنوز دوره‌ای منتشر نشده." />
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {allCourses.map((course) => (
            <li key={course.id}>
              <Link href={`/courses/${course.slug}`} className="surface block h-full p-6 transition hover:border-accent">
                <p className="text-xs font-medium text-mark">{course.type === "free" ? "رایگان" : "فروشی"}</p>
                <h2 className="mt-2 text-xl font-bold leading-[1.7] text-ink">{course.titleFa}</h2>
                {course.descriptionFa ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted">{course.descriptionFa}</p>
                ) : null}
                {courseTopicsMap[course.id]?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {courseTopicsMap[course.id].map((topic) => (
                      <span key={topic.slug} className="rounded-full bg-paper px-2.5 py-1 text-xs text-muted">
                        {topic.labelFa}
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
