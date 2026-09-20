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
  const [item] = await db.select().from(knowledge).where(eq(knowledge.slug, slug));
  if (!item) return { title: "یافت نشد" };
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
  const [item] = await db.select().from(knowledge).where(eq(knowledge.slug, slug));
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
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          بازگشت به دانشنامه
        </Link>
        {account && (
          <Link
            href={`/knowledge/${item.slug}/edit`}
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            <Pencil className="h-3.5 w-3.5" />
            ویرایش
          </Link>
        )}
      </div>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
          {typeLabels[item.type] || item.type}
        </span>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">{item.titleFa}</h1>
        {item.titleEn && <p className="mt-1 text-sm text-slate-500">{item.titleEn}</p>}

        {item.summaryFa && (
          <p className="mt-6 rounded-2xl bg-slate-50 p-4 text-base leading-relaxed text-slate-700">
            {item.summaryFa}
          </p>
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
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
            >
              <Hash className="h-3.5 w-3.5" />
              {topic.labelFa}
            </Link>
          ))}
        </div>

        {itemProjects.length > 0 && (
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
              <FlaskConical className="h-5 w-5 text-violet-600" />
              پروژه‌های مرتبط
            </h3>
            <div className="flex flex-wrap gap-2">
              {itemProjects.map((project) => (
                <Link
                  key={project.slug}
                  href={`/lab/${project.slug}`}
                  className="rounded-xl bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100"
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
