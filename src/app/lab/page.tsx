import { db } from "@/db";
import { projects, projectTopics, topics } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { FlaskConical, Hash } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "آزمایشگاه",
  description: "پروژه‌های در جریان، آزمایش‌ها و فرصت‌های همکاری در اکوسیستم هادیران.",
  alternates: { canonical: "/lab" },
};

const statusLabels: Record<string, string> = {
  idea: "ایده",
  concept: "مفهوم",
  research: "تحقیق",
  prototype: "نمونه اولیه",
  development: "توسعه",
  beta: "بتا",
  production: "تولید",
  archived: "بایگانی‌شده",
};

const statusStyles: Record<string, string> = {
  idea: "bg-slate-100 text-slate-600",
  concept: "bg-blue-50 text-blue-700",
  research: "bg-purple-50 text-purple-700",
  prototype: "bg-amber-50 text-amber-700",
  development: "bg-indigo-50 text-indigo-700",
  beta: "bg-pink-50 text-pink-700",
  production: "bg-emerald-50 text-emerald-700",
  archived: "bg-gray-100 text-gray-600",
};

export default async function LabPage() {
  const allProjects = await db.select().from(projects);

  const topicLinks = await db
    .select({ projectId: projectTopics.projectId, labelFa: topics.labelFa, slug: topics.slug })
    .from(projectTopics)
    .innerJoin(topics, eq(projectTopics.topicId, topics.id));

  const topicsMap: Record<number, { labelFa: string; slug: string }[]> = {};
  for (const row of topicLinks) {
    if (!topicsMap[row.projectId]) topicsMap[row.projectId] = [];
    topicsMap[row.projectId].push({ labelFa: row.labelFa, slug: row.slug });
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">آزمایشگاه</h1>
        <p className="mt-3 text-slate-600">پروژه‌های در جریان، آزمایش‌ها و فرصت‌های همکاری</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {allProjects.map((project) => (
          <Link
            key={project.id}
            href={`/lab/${project.slug}`}
            className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <FlaskConical className="h-6 w-6" />
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  statusStyles[project.status] || "bg-slate-100 text-slate-700"
                }`}
              >
                {statusLabels[project.status] || project.status}
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 group-hover:text-indigo-700">
              {project.nameFa}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm text-slate-600">{project.descriptionFa}</p>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                <span>پیشرفت</span>
                <span>{project.progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {topicsMap[project.id]?.map((topic) => (
                <span
                  key={topic.slug}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
                >
                  <Hash className="h-3 w-3" />
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
