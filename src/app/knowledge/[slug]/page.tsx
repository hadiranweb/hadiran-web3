import { db } from "@/db";
import {
  knowledge,
  knowledgeTopics,
  topics,
  knowledgeProjects,
  projects,
  knowledgeSlides,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Hash, FlaskConical, Pencil } from "lucide-react";
import type { Metadata } from "next";
import { KnowledgeView } from "@/components/knowledge/KnowledgeView";
import { getCurrentAccount } from "@/lib/auth/session";
import { getPublicKnowledgeBySlug } from "@/lib/knowledge/public";

export const dynamic = "force-dynamic";

const typeLabels: Record<string, string> = {
  wiki: "ویکی",
  article: "مقاله",
  note: "یادداشت",
  research: "تحقیق",
  idea: "ایده",
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicKnowledgeBySlug(slug);
  if (!item) return { title: "یافت نشد", robots: { index: false, follow: false } };
  return {
    title: item.titleFa,
    description: item.summaryFa ?? undefined,
    alternates: { canonical: `/knowledge/${slug}` },
    openGraph: {
      title: item.titleFa,
      description: item.summaryFa ?? undefined,
      type: "article",
      locale: "fa_IR",
    },
  };
}

export default async function KnowledgeItemPage({ params }: Props) {
  const { slug } = await params;
  const item = await getPublicKnowledgeBySlug(slug);
  if (!item) notFound();
  const account = await getCurrentAccount();

  const itemTopics = await db
    .select({ labelFa: topics.labelFa, slug: topics.slug })
    .from(knowledgeTopics)
    .innerJoin(topics, eq(knowledgeTopics.topicId, topics.id))
    .where(eq(knowledgeTopics.knowledgeId, item.id));

  const itemProjects = await db
    .select({ slug: projects.slug, nameFa: projects.nameFa })
    .from(knowledgeProjects)
    .innerJoin(projects, eq(knowledgeProjects.projectId, projects.id))
    .where(eq(knowledgeProjects.knowledgeId, item.id));

  let slides: (typeof knowledgeSlides.$inferSelect)[] = [];
  try {
    slides = await db
      .select()
      .from(knowledgeSlides)
      .where(eq(knowledgeSlides.knowledgeId, item.id))
      .orderBy(asc(knowledgeSlides.sortOrder));
  } catch (error) {
    console.error("knowledge slides query:", error);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href="/knowledge" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          بازگشت به دانشنامه
        </Link>
        {account?.role === "owner" && (
          <Link
            href={`/knowledge/${item.slug}/edit`}
            className="inline-flex items-center gap-1 text-sm font-medium text-accent"
          >
            <Pencil className="h-3.5 w-3.5" />
            ویرایش
          </Link>
        )}
      </div>

      <article className="surface p-6 sm:p-10">
        <span className="inline-block rounded-full border border-line bg-paper px-3 py-1 text-xs font-medium text-mark">
          {typeLabels[item.type] || item.type}
        </span>
        <h1 className="mt-4 text-3xl font-extrabold leading-[1.35] text-ink">{item.titleFa}</h1>
        {item.titleEn && (
          <p className="mt-1 text-sm text-muted" dir="ltr">
            {item.titleEn}
          </p>
        )}

        {item.summaryFa && (
          <p className="mt-6 rounded-[var(--radius-md)] bg-paper p-4 text-base leading-[1.85] text-ink">{item.summaryFa}</p>
        )}

        <KnowledgeView
          title={item.titleFa}
          bodyFa={item.bodyFa}
          slides={slides.map((s) => ({
            id: s.id,
            sortOrder: s.sortOrder,
            titleFa: s.titleFa,
            titleEn: s.titleEn,
            bodyFa: s.bodyFa,
            bodyEn: s.bodyEn,
          }))}
        />

        <div className="mt-8 flex flex-wrap gap-2">
          {itemTopics.map((topic) => (
            <Link
              key={topic.slug}
              href={`/topics/${topic.slug}`}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-3 py-1 text-sm text-ink hover:border-accent"
            >
              <Hash className="h-3.5 w-3.5" />
              {topic.labelFa}
            </Link>
          ))}
        </div>

        {itemProjects.length > 0 && (
          <div className="mt-8 border-t border-line pt-6">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-ink">
              <FlaskConical className="h-5 w-5 text-muted" strokeWidth={1.5} />
              پروژه‌های مرتبط
            </h3>
            <div className="flex flex-wrap gap-2">
              {itemProjects.map((project) => (
                <Link
                  key={project.slug}
                  href={`/lab/${project.slug}`}
                  className="rounded-[var(--radius-sm)] border border-line bg-paper px-4 py-2 text-sm font-medium text-ink hover:border-accent"
                >
                  {project.nameFa}
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </main>
  );
}
