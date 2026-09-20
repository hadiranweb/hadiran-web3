import { db } from "@/db";
import { courses, courseTopics, topics } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { GraduationCap, Clock, Layers } from "lucide-react";
import type { Metadata } from "next";

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
    <main className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">آکادمی هادیران</h1>
        <p className="mt-3 text-slate-600">دوره‌های آموزشی برای یادگیری Web3، AI و اتوماسیون</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {allCourses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.slug}`}
            className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <GraduationCap className="h-6 w-6" />
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  course.type === "free"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {course.type === "free" ? "رایگان" : "فروشی"}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 group-hover:text-indigo-700">
              {course.titleFa}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm text-slate-600">{course.descriptionFa}</p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              {course.durationMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {Math.round(course.durationMinutes / 60)} ساعت
                </span>
              )}
              {course.level && (
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  {course.level}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {courseTopicsMap[course.id]?.map((topic) => (
                <span
                  key={topic.slug}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                >
                  {topic.labelFa}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
