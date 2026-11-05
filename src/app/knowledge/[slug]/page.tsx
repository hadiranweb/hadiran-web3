import { db } from "@/db";
import { knowledge, knowledgeTopics, topics, knowledgeProjects, projects, knowledgeSlides, memoryItems } from "@/db/schema";
import { eq, asc, and, ne } from "drizzle-orm";
import Link from "@/components/workspace/WorkspaceLink";
import { notFound } from "next/navigation";
import { Hash, FlaskConical, Pencil } from "lucide-react";
import type { Metadata } from "next";
import { getCurrentAccount } from "@/lib/auth/session";
import { getPublicKnowledgeBySlug, publicKnowledgeFilter } from "@/lib/knowledge/public";
import { landingPreviewEnabled, sampleKnowledge } from "@/lib/landing/preview";
import { browserScope } from "@/lib/landing/scope";
import { ResourceConnections } from "@/components/landing/ResourceConnections";
import { KnowledgeArticle } from "@/components/landing/KnowledgeArticle";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicKnowledgeBySlug(slug);
  if (!item) return { title: "یافت نشد", robots: { index: false, follow: false } };
  return { title: item.titleFa, description: item.summaryFa ?? undefined, alternates: { canonical: `/knowledge/${slug}` }, openGraph: { title: item.titleFa, description: item.summaryFa ?? undefined, type: "article", locale: "fa_IR" }, ...(landingPreviewEnabled() ? { robots: { index: false, follow: false } } : {}) };
}
export default async function KnowledgeItemPage({ params }: Props) {
  const { slug } = await params;
  const item = await getPublicKnowledgeBySlug(slug);
  if (!item) notFound();
  const preview = landingPreviewEnabled();
  const account = await getCurrentAccount();
  const itemTopics = preview ? [] : await db.select({ labelFa: topics.labelFa, slug: topics.slug }).from(knowledgeTopics).innerJoin(topics, eq(knowledgeTopics.topicId, topics.id)).where(eq(knowledgeTopics.knowledgeId, item.id));
  const itemProjects = preview ? [] : await db.select({ slug: projects.slug, nameFa: projects.nameFa }).from(knowledgeProjects).innerJoin(projects, eq(knowledgeProjects.projectId, projects.id)).where(eq(knowledgeProjects.knowledgeId, item.id));
  let slides: (typeof knowledgeSlides.$inferSelect)[] = [];
  let related = preview ? sampleKnowledge.filter(row => row.id !== item.id).slice(0, 2) : [];
  if (!preview) {
    try { slides = await db.select().from(knowledgeSlides).where(eq(knowledgeSlides.knowledgeId, item.id)).orderBy(asc(knowledgeSlides.sortOrder)); } catch (error) { console.error("knowledge slides query:", error); }
    try { const rows = await db.select({ item: knowledge }).from(knowledge).innerJoin(memoryItems, eq(knowledge.memoryItemId, memoryItems.id)).where(and(publicKnowledgeFilter, ne(knowledge.id, item.id))).limit(2); related = rows.map(row => row.item); } catch (error) { console.error("knowledge related query:", error); }
  }
  const taxonomy = <>{itemTopics.length > 0 && <div className="mt-8 flex flex-wrap gap-2">{itemTopics.map(topic => <Link key={topic.slug} href={`/topics/${topic.slug}`} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-sm"><Hash size={14} />{topic.labelFa}</Link>)}</div>}{itemProjects.length > 0 && <div className="mt-8 border-t border-line pt-6"><h3 className="mb-3 flex items-center gap-2"><FlaskConical size={18} /> پروژه‌های مرتبط</h3><div className="flex flex-wrap gap-3">{itemProjects.map(project => <Link key={project.slug} href={`/lab/${project.slug}`} className="lp-text-link">{project.nameFa}</Link>)}</div></div>}</>;
  return <KnowledgeArticle connections={<ResourceConnections resourceId={`knowledge:${item.slug}`} />} storageScope={browserScope(account)} item={item} slides={slides.map(s => ({ id: s.id, sortOrder: s.sortOrder, titleFa: s.titleFa, titleEn: s.titleEn, bodyFa: s.bodyFa, bodyEn: s.bodyEn }))} taxonomy={taxonomy} related={related} preview={preview} edit={account?.role === "owner" && !preview ? <Link href={`/knowledge/${item.slug}/edit`} className="lp-text-link"><Pencil size={14} /> ویرایش</Link> : undefined} />;
}
