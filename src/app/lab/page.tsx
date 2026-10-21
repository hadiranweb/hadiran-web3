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
import { getSiteCopy } from "@/lib/content/site-copy";
import { loadPublicProjects } from "@/lib/public/catalog";
import { readPublicCollection } from "@/lib/public/source";
import { CollectionChips, CollectionEmpty, CollectionSearch } from "@/components/ui/CollectionControls";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getSiteCopy();
  return {
    title: copy.labCopy.title,
    description: copy.labCopy.lede,
    alternates: { canonical: "/lab" },
  };
}

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

interface Props {
  searchParams: Promise<{ q?: string; status?: string }>;
}

const statusFilters = [
  { value: "", label: "همه" },
  { value: "idea", label: "ایده" },
  { value: "concept", label: "مفهوم" },
  { value: "research", label: "تحقیق" },
  { value: "prototype", label: "نمونه اولیه" },
  { value: "development", label: "توسعه" },
  { value: "beta", label: "بتا" },
  { value: "production", label: "تولید" },
];

export default async function LabPage({ searchParams }: Props) {
  const copy = await getSiteCopy();
  const { q = "", status = "" } = await searchParams;
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

  const query = q.trim().toLowerCase();
  const visible = list.items
    .filter((project) => (status ? project.status === status : true))
    .filter((project) =>
      query
        ? `${project.nameFa} ${project.descriptionFa ?? ""}`.toLowerCase().includes(query)
        : true,
    );

  const statusLinks = statusFilters
    .filter((filter) => !filter.value || list.items.some((project) => project.status === filter.value))
    .map((filter) => {
      const params = new URLSearchParams();
      if (filter.value) params.set("status", filter.value);
      if (q) params.set("q", q);
      const search = params.toString();
      return {
        href: search ? `/lab?${search}` : "/lab",
        label: filter.label,
        active: status === filter.value,
      };
    });

  return (
    <RoomPage hero={<PageHeader title={copy.labCopy.title} lede={copy.labCopy.lede} />}>
      <CollectionSearch
        action="/lab"
        q={q}
        placeholder="جستجو در نام و توضیح پروژه‌ها..."
        hidden={{ status }}
      />
      <CollectionChips label="وضعیت" links={statusLinks} />

      {list.source !== "live" ? (
        <PublicSourceNotice source={list.source} />
      ) : list.items.length === 0 ? (
        <EmptyState title="هنوز پروژه‌ای ثبت نشده." />
      ) : visible.length === 0 ? (
        <CollectionEmpty title="با این صافی پروژه‌ای نبود." hint="صافی وضعیت یا جستجو را بردار." />
      ) : (
        <ul className="section-cards listing-cards">
          {visible.map((project) => (
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
