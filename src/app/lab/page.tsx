import { db } from "@/db";
import { projects, projectTopics, topics } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

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
    <PageShell>
      <PageHeader title="آزمایشگاه" lede="پروژه‌های در جریان، آزمایش‌ها و فرصت‌های همکاری" />

      {allProjects.length === 0 ? (
        <EmptyState title="هنوز پروژه‌ای ثبت نشده." />
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {allProjects.map((project) => (
            <li key={project.id}>
              <Link href={`/lab/${project.slug}`} className="surface block h-full p-6 transition hover:border-accent">
                <p className="text-xs font-medium text-mark">{statusLabels[project.status] || project.status}</p>
                <h2 className="mt-2 text-xl font-bold leading-[1.7] text-ink">{project.nameFa}</h2>
                {project.descriptionFa ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted">{project.descriptionFa}</p>
                ) : null}
                {typeof project.progress === "number" ? (
                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted">
                      <span>پیشرفت</span>
                      <span>{project.progress.toLocaleString("fa-IR")}٪</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                ) : null}
                {topicsMap[project.id]?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {topicsMap[project.id].map((topic) => (
                      <span key={topic.slug} className="rounded-full bg-paper px-2 py-1 text-xs text-muted">
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
