import { db } from "@/db";
import {
  topics,
  knowledge,
  knowledgeTopics,
  memoryItems,
  projects,
  projectTopics,
  courses,
  courseTopics,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, FlaskConical, GraduationCap, Hash } from "lucide-react";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";
import { PublicSourceNotice } from "@/components/ui/PublicSourceNotice";
import {
  publicCourseFilter,
  publicKnowledgeFilter,
  publicKnowledgeJoin,
  publicProjectFilter,
} from "@/lib/public/policy";
import { readPublic } from "@/lib/public/source";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

function topicFallback(labelFa: string) {
  return `${labelFa} یکی از موضوعات اتصال‌دهندهٔ باغ دانش، کارگاه و دوره در خانهٔ هادیران است.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [topic] = await db.select().from(topics).where(eq(topics.slug, slug));
  if (!topic) return { title: "یافت نشد" };
  const description = topic.descriptionFa || topicFallback(topic.labelFa);
  return {
    title: topic.labelFa,
    description,
    alternates: { canonical: `/topics/${slug}` },
    openGraph: {
      title: topic.labelFa,
      description,
      url: `/topics/${slug}`,
      locale: "fa_IR",
      type: "website",
    },
  };
}

export default async function TopicHubPage({ params }: Props) {
  const { slug } = await params;
  const loaded = await readPublic("public topic hub", async () => {
    const [topic] = await db.select().from(topics).where(eq(topics.slug, slug));
    if (!topic) return null;
    const [knowledgeItems, projectItems, courseItems] = await Promise.all([
      db
        .select({
          slug: knowledge.slug,
          titleFa: knowledge.titleFa,
          summaryFa: knowledge.summaryFa,
        })
        .from(knowledgeTopics)
        .innerJoin(knowledge, eq(knowledgeTopics.knowledgeId, knowledge.id))
        .innerJoin(memoryItems, publicKnowledgeJoin)
        .where(and(eq(knowledgeTopics.topicId, topic.id), publicKnowledgeFilter)),
      db
        .select({
          slug: projects.slug,
          nameFa: projects.nameFa,
          descriptionFa: projects.descriptionFa,
        })
        .from(projectTopics)
        .innerJoin(projects, eq(projectTopics.projectId, projects.id))
        .where(and(eq(projectTopics.topicId, topic.id), publicProjectFilter)),
      db
        .select({
          slug: courses.slug,
          titleFa: courses.titleFa,
          descriptionFa: courses.descriptionFa,
        })
        .from(courseTopics)
        .innerJoin(courses, eq(courseTopics.courseId, courses.id))
        .where(and(eq(courseTopics.topicId, topic.id), publicCourseFilter)),
    ]);
    return { topic, knowledgeItems, projectItems, courseItems };
  });

  if (loaded.source !== "live") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <PublicSourceNotice source={loaded.source} />
      </main>
    );
  }
  if (!loaded.data) notFound();

  const { topic, knowledgeItems, projectItems, courseItems } = loaded.data;
  const description = topic.descriptionFa || topicFallback(topic.labelFa);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "DefinedTerm",
          name: topic.labelFa,
          alternateName: topic.labelEn || undefined,
          description,
          url: absoluteUrl(`/topics/${topic.slug}`),
          inDefinedTermSet: {
            "@type": "DefinedTermSet",
            name: "موضوعات هادیران",
            url: absoluteUrl("/topics"),
          },
        }}
      />

      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/" className="hover:text-ink">
          خانه
        </Link>
        <span>/</span>
        <Link href="/topics" className="hover:text-ink">
          موضوعات
        </Link>
        <span>/</span>
        <span className="text-ink">{topic.labelFa}</span>
      </nav>

      <Link
        href="/topics"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        بازگشت به موضوعات
      </Link>

      <article className="surface p-6 sm:p-10">
        <span className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-3 py-1 text-xs font-bold text-mark">
          <Hash className="h-3.5 w-3.5" />
          موضوع
        </span>
        <h1 className="mt-4 text-3xl font-bold text-ink">{topic.labelFa}</h1>
        {topic.labelEn && (
          <p className="mt-1 text-sm text-muted" dir="ltr">
            {topic.labelEn}
          </p>
        )}
        <p className="mt-6 rounded-[var(--radius-md)] bg-paper p-4 text-base leading-[1.85] text-ink">{description}</p>

        {knowledgeItems.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
              <BookOpen className="h-5 w-5 text-mark" />
              دانش مرتبط
            </h2>
            <div className="space-y-3">
              {knowledgeItems.map((item) => (
                <Link
                  key={item.slug}
                  href={`/knowledge/${item.slug}`}
                  className="block rounded-[var(--radius-md)] border border-line bg-paper px-4 py-3 hover:border-accent"
                >
                  <p className="font-semibold text-ink">{item.titleFa}</p>
                  {item.summaryFa && <p className="mt-1 line-clamp-2 text-sm text-muted">{item.summaryFa}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {projectItems.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
              <FlaskConical className="h-5 w-5 text-mark" />
              پروژه‌های مرتبط
            </h2>
            <div className="space-y-3">
              {projectItems.map((item) => (
                <Link
                  key={item.slug}
                  href={`/lab/${item.slug}`}
                  className="block rounded-[var(--radius-md)] border border-line bg-paper px-4 py-3 hover:border-accent"
                >
                  <p className="font-semibold text-ink">{item.nameFa}</p>
                  {item.descriptionFa && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{item.descriptionFa}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {courseItems.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
              <GraduationCap className="h-5 w-5 text-mark" />
              دوره‌های مرتبط
            </h2>
            <div className="space-y-3">
              {courseItems.map((item) => (
                <Link
                  key={item.slug}
                  href={`/courses/${item.slug}`}
                  className="block rounded-[var(--radius-md)] border border-line bg-paper px-4 py-3 hover:border-accent"
                >
                  <p className="font-semibold text-ink">{item.titleFa}</p>
                  {item.descriptionFa && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{item.descriptionFa}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
