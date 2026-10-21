import { db } from "@/db";
import {
  knowledge,
  knowledgeTopics,
  topics,
  knowledgeProjects,
  knowledgeReferences,
  knowledgeSlides,
  memoryItems,
  projects,
  semanticRecords,
} from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { publicKnowledgeFilter, publicKnowledgeJoin, publicProjectFilter } from "@/lib/public/policy";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Hash, FlaskConical, Pencil } from "lucide-react";
import type { Metadata } from "next";
import { KnowledgeArticle } from "@/components/knowledge/KnowledgeArticle";
import { ReadingTools } from "@/components/knowledge/ReadingTools";
import { getCurrentAccount } from "@/lib/auth/session";
import { getPublicKnowledgeBySlug } from "@/lib/knowledge/public";
import { growthLabel, minutesFa, type KnowledgeGrowth } from "@/lib/knowledge/article";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicKnowledgeBySlug(slug);
  if (!item) return { title: "یافت نشد", robots: { index: false, follow: false } };
  return {
    title: item.titleFa,
    description: item.lineFa || item.summaryFa || undefined,
    alternates: { canonical: `/knowledge/${slug}` },
    openGraph: {
      title: item.titleFa,
      description: item.lineFa || item.summaryFa || undefined,
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
  let editHref: string | null = null;
  if (account?.role === "owner") {
    if (item.memoryItemId) {
      const [source] = await db
        .select({ id: semanticRecords.id })
        .from(semanticRecords)
        .where(eq(semanticRecords.promotedMemoryId, item.memoryItemId))
        .limit(1);
      editHref = source ? `/workspace/records/${source.id}` : "/workspace/knowledge";
    } else {
      editHref = "/workspace/knowledge";
    }
  }

  const itemTopics = await db
    .select({ labelFa: topics.labelFa, slug: topics.slug })
    .from(knowledgeTopics)
    .innerJoin(topics, eq(knowledgeTopics.topicId, topics.id))
    .where(eq(knowledgeTopics.knowledgeId, item.id));

  const itemProjects = await db
    .select({ slug: projects.slug, nameFa: projects.nameFa })
    .from(knowledgeProjects)
    .innerJoin(projects, eq(knowledgeProjects.projectId, projects.id))
    .where(and(eq(knowledgeProjects.knowledgeId, item.id), publicProjectFilter));

  const related = await db
    .select({
      slug: knowledge.slug,
      titleFa: knowledge.titleFa,
      summaryFa: knowledge.summaryFa,
      growth: knowledge.growth,
      lineFa: knowledge.lineFa,
    })
    .from(knowledgeReferences)
    .innerJoin(knowledge, eq(knowledgeReferences.targetKnowledgeId, knowledge.id))
    .innerJoin(memoryItems, publicKnowledgeJoin)
    .where(and(eq(knowledgeReferences.sourceKnowledgeId, item.id), publicKnowledgeFilter));

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

  const growth = growthLabel(item.growth as KnowledgeGrowth);
  const minutes = minutesFa(item.readingMinutes);
  const topicLine = itemTopics.map((topic) => topic.labelFa).join(" و ");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href="/knowledge" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          بازگشت به باغ دانش
        </Link>
        {editHref ? (
          <Link href={editHref} className="inline-flex items-center gap-1 text-sm font-medium text-accent">
            <Pencil className="h-3.5 w-3.5" />
            ویرایش مطلب
          </Link>
        ) : null}
      </div>

      <ReadingTools title={item.titleFa} />

      <article className="surface reading-surface p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-mark">
          {growth ? <span className="chip">{growth}</span> : null}
          {topicLine ? <span className="muted">موضوع: {topicLine}</span> : null}
          {minutes ? <span className="muted">{minutes}</span> : null}
        </div>
        <h1 className="mt-4 text-3xl font-extrabold leading-[1.35] text-ink">{item.titleFa}</h1>
        {item.titleEn ? (
          <p className="mt-1 text-sm text-muted" dir="ltr">
            {item.titleEn}
          </p>
        ) : null}

        <KnowledgeArticle
          titleFa={item.titleFa}
          lineFa={item.lineFa}
          summaryFa={item.summaryFa}
          bodyFa={item.bodyFa}
          growth={item.growth}
          readingMinutes={item.readingMinutes}
          questionFa={item.questionFa}
          rootFa={item.rootFa}
          firstStepFa={item.firstStepFa}
          marginNoteFa={item.marginNoteFa}
          prunedAt={item.prunedAt}
          audioUrl={item.audioUrl}
          simulator={item.simulator}
          closingQuestionFa={item.closingQuestionFa}
          closingOptions={item.closingOptions}
          closingPromptFa={item.closingPromptFa}
          related={related}
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

        {itemProjects.length > 0 ? (
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
        ) : null}
      </article>
    </main>
  );
}
