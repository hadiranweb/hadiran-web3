import { db } from "@/db";
import { courses, lessons, courseTopics, courseSkills, topics, skills, courseProjects, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GraduationCap, Clock, Layers, ArrowLeft, BookOpen, FlaskConical, Wrench } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
  if (!course) notFound();

  const courseLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, course.id))
    .orderBy(lessons.order);

  const courseTopicsList = await db
    .select({ labelFa: topics.labelFa, slug: topics.slug })
    .from(courseTopics)
    .innerJoin(topics, eq(courseTopics.topicId, topics.id))
    .where(eq(courseTopics.courseId, course.id));

  const courseSkillsList = await db
    .select({ labelFa: skills.labelFa, slug: skills.slug })
    .from(courseSkills)
    .innerJoin(skills, eq(courseSkills.skillId, skills.id))
    .where(eq(courseSkills.courseId, course.id));

  const courseProjectsList = await db
    .select({ slug: projects.slug, nameFa: projects.nameFa })
    .from(courseProjects)
    .innerJoin(projects, eq(courseProjects.projectId, projects.id))
    .where(eq(courseProjects.courseId, course.id));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/courses"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" />
        بازگشت به دوره‌ها
      </Link>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                  course.type === "free" ? "bg-emerald-500/30" : "bg-amber-500/30"
                }`}
              >
                {course.type === "free" ? "رایگان" : "فروشی"}
              </span>
              <h1 className="mt-3 text-3xl font-bold">{course.titleFa}</h1>
              <p className="mt-2 max-w-2xl text-indigo-100">{course.descriptionFa}</p>
            </div>
            <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 sm:flex">
              <GraduationCap className="h-8 w-8" />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            {course.durationMinutes && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {Math.round(course.durationMinutes / 60)} ساعت
              </span>
            )}
            {course.level && (
              <span className="flex items-center gap-1.5">
                <Layers className="h-4 w-4" />
                {course.level}
              </span>
            )}
            {course.price && (
              <span className="font-bold">
                {course.price.toLocaleString("fa-IR")} {course.currency || "تومان"}
              </span>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                دروس
              </h2>
              <div className="space-y-3">
                {courseLessons.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{lesson.titleFa}</p>
                      {lesson.durationMinutes && (
                        <p className="text-xs text-slate-500">{lesson.durationMinutes} دقیقه</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="space-y-8">
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                  <Layers className="h-4 w-4 text-indigo-600" />
                  موضوعات
                </h3>
                <div className="flex flex-wrap gap-2">
                  {courseTopicsList.map((topic) => (
                    <Link
                      key={topic.slug}
                      href={`/topics/${topic.slug}`}
                      className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700"
                    >
                      {topic.labelFa}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                  <Wrench className="h-4 w-4 text-emerald-600" />
                  مهارت‌ها
                </h3>
                <div className="flex flex-wrap gap-2">
                  {courseSkillsList.map((skill) => (
                    <span
                      key={skill.slug}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-700"
                    >
                      {skill.labelFa}
                    </span>
                  ))}
                </div>
              </div>

              {courseProjectsList.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                    <FlaskConical className="h-4 w-4 text-violet-600" />
                    پروژه‌های مرتبط
                  </h3>
                  <div className="space-y-2">
                    {courseProjectsList.map((project) => (
                      <Link
                        key={project.slug}
                        href={`/lab/${project.slug}`}
                        className="block rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        {project.nameFa}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
