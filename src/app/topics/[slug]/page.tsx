import { db } from "@/db";
import {
  topics,
  knowledge,
  knowledgeTopics,
  projects,
  projectTopics,
  courses,
  courseTopics,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, FlaskConical, GraduationCap, Hash } from "lucide-react";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

function topicFallback(labelFa: string) {
  return `${labelFa} یکی از موضوعات اتصال‌دهندهٔ دانش، پروژه و دوره در اکوسیستم هادیران است.`;
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
  const [topic] = await db.select().from(topics).where(eq(topics.slug, slug));
  if (!topic) notFound();

  const description = topic.descriptionFa || topicFallback(topic.labelFa);

  const [knowledgeItems, projectItems, courseItems] = await Promise.all([
    db
      .select({
        slug: knowledge.slug,
        titleFa: knowledge.titleFa,
        summaryFa: knowledge.summaryFa,
      })
      .from(knowledgeTopics)
      .innerJoin(knowledge, eq(knowledgeTopics.knowledgeId, knowledge.id))
      .where(eq(knowledgeTopics.topicId, topic.id)),
    db
      .select({
        slug: projects.slug,
        nameFa: projects.nameFa,
        descriptionFa: projects.descriptionFa,
      })
      .from(projectTopics)
      .innerJoin(projects, eq(projectTopics.projectId, projects.id))
      .where(eq(projectTopics.topicId, topic.id)),
    db
      .select({
        slug: courses.slug,
        titleFa: courses.titleFa,
        descriptionFa: courses.descriptionFa,
      })
      .from(courseTopics)
      .innerJoin(courses, eq(courseTopics.courseId, courses.id))
      .where(eq(courseTopics.topicId, topic.id)),
  ]);

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

      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-indigo-600">
          خانه
        </Link>
        <span>/</span>
        <Link href="/topics" className="hover:text-indigo-600">
          موضوعات
        </Link>
        <span>/</span>
        <span className="text-slate-700">{topic.labelFa}</span>
      </nav>

      <Link
        href="/topics"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" />
        بازگشت به موضوعات
      </Link>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <span
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
          style={{
            backgroundColor: topic.color ? `${topic.color}22` : "#eef2ff",
            color: topic.color || "#4338ca",
          }}
        >
          <Hash className="h-3.5 w-3.5" />
          موضوع
        </span>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">{topic.labelFa}</h1>
        {topic.labelEn && (
          <p className="mt-1 text-sm text-slate-500" dir="ltr">
            {topic.labelEn}
          </p>
        )}
        <p className="mt-6 rounded-2xl bg-slate-50 p-4 text-base leading-relaxed text-slate-700">
          {description}
        </p>

        {knowledgeItems.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              دانش مرتبط
            </h2>
            <div className="space-y-3">
              {knowledgeItems.map((item) => (
                <Link
                  key={item.slug}
                  href={`/knowledge/${item.slug}`}
                  className="block rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50/40"
                >
                  <p className="font-semibold text-slate-900">{item.titleFa}</p>
                  {item.summaryFa && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.summaryFa}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {projectItems.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <FlaskConical className="h-5 w-5 text-violet-600" />
              پروژه‌های مرتبط
            </h2>
            <div className="space-y-3">
              {projectItems.map((item) => (
                <Link
                  key={item.slug}
                  href={`/lab/${item.slug}`}
                  className="block rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-violet-200 hover:bg-violet-50/40"
                >
                  <p className="font-semibold text-slate-900">{item.nameFa}</p>
                  {item.descriptionFa && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.descriptionFa}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {courseItems.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <GraduationCap className="h-5 w-5 text-amber-600" />
              دوره‌های مرتبط
            </h2>
            <div className="space-y-3">
              {courseItems.map((item) => (
                <Link
                  key={item.slug}
                  href={`/courses/${item.slug}`}
                  className="block rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-amber-200 hover:bg-amber-50/40"
                >
                  <p className="font-semibold text-slate-900">{item.titleFa}</p>
                  {item.descriptionFa && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.descriptionFa}</p>
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
