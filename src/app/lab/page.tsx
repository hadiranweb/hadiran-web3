import { db } from "@/db";
import { projectTopics, topics } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoomPage } from "@/components/ui/RoomPage";
import { EmptyState } from "@/components/ui/EmptyState";
import { PublicSourceNotice } from "@/components/ui/PublicSourceNotice";
import { labCopy } from "@/lib/copy";
import { loadPublicProjects } from "@/lib/public/catalog";
import { readPublicCollection } from "@/lib/public/source";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "کارگاه",
  description: labCopy.lede,
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
  const list = await loadPublicProjects();
  const topicLinks = await readPublicCollection("public project topics", async () =>
    db
      .select({ projectId: projectTopics.projectId, labelFa: topics.labelFa, slug: topics.slug })
      .from(projectTopics)
      .innerJoin(topics, eq(projectTopics.topicId, topics.id)),
  );

  const topicsMap: Record<number, { labelFa: string; slug: string }[]> = {};
  for (const row of topicLinks.items) {
    if (!topicsMap[row.projectId]) topicsMap[row.projectId] = [];
    topicsMap[row.projectId].push({ labelFa: row.labelFa, slug: row.slug });
  }

  return (
    <RoomPage hero={<PageHeader title={labCopy.title} lede={labCopy.lede} />}>
      {list.source !== "live" ? (
        <PublicSourceNotice source={list.source} />
      ) : list.items.length === 0 ? (
        <EmptyState title="هنوز پروژه‌ای ثبت نشده." />
      ) : (
        <ul className="section-cards listing-cards">
          {list.items.map((project) => (
            <li key={project.id}>
              <Link href={`/lab/${project.slug}`} className="card card-hover section-card">
                <div className="section-card-copy">
                  <p className="chip">{statusLabels[project.status] || project.status}</p>
                  <h2 className="section-card-title mt-3">{project.nameFa}</h2>
                  {project.descriptionFa ? (
                    <p className="muted mt-2 line-clamp-2 text-sm leading-7">{project.descriptionFa}</p>
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
