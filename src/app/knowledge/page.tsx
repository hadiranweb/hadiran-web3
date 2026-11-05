import { db } from "@/db";
import { knowledge, knowledgeTopics, memoryItems, topics } from "@/db/schema";
import { and, eq, like, or } from "drizzle-orm";
import { publicKnowledgeFilter } from "@/lib/knowledge/public";
import { getCurrentAccount } from "@/lib/auth/session";
import Link from "@/components/workspace/WorkspaceLink";
import { Search, PenLine, ArrowUpLeft } from "lucide-react";
import type { Metadata } from "next";
import { knowledgeCopy } from "@/lib/copy";
import { landingPreviewEnabled, sampleKnowledge } from "@/lib/landing/preview";
import { KnowledgeExplorer } from "@/components/landing/KnowledgeExplorer";
import { browserScope } from "@/lib/landing/scope";
import { PreviewNotice } from "@/components/landing/PreviewNotice";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: knowledgeCopy.title, description: knowledgeCopy.lede, alternates: { canonical: "/knowledge" } };

export default async function KnowledgePage({ searchParams }: { searchParams: Promise<{ topic?: string; q?: string }> }) {
  const { topic, q } = await searchParams;
  const preview = landingPreviewEnabled();
  const account = await getCurrentAccount();
  let allKnowledge: (typeof knowledge.$inferSelect)[] = [];
  const topicsMap: Record<number, { labelFa: string; slug: string }[]> = {};
  if (preview) allKnowledge = sampleKnowledge.filter(item => !q || `${item.titleFa} ${item.summaryFa} ${item.bodyFa}`.includes(q));
  else try {
    const filters = [publicKnowledgeFilter];
    if (q) filters.push(or(like(knowledge.titleFa, `%${q}%`), like(knowledge.summaryFa, `%${q}%`), like(knowledge.bodyFa, `%${q}%`)));
    const rows = await db.select({ item: knowledge }).from(knowledge).innerJoin(memoryItems, eq(knowledge.memoryItemId, memoryItems.id)).where(and(...filters));
    allKnowledge = rows.map(row => row.item);
    const topicLinks = await db.select({ knowledgeId: knowledgeTopics.knowledgeId, labelFa: topics.labelFa, slug: topics.slug }).from(knowledgeTopics).innerJoin(topics, eq(knowledgeTopics.topicId, topics.id));
    for (const row of topicLinks) (topicsMap[row.knowledgeId] ||= []).push({ labelFa: row.labelFa, slug: row.slug });
  } catch (error) { console.error("[hadiran] knowledge list", error); }
  const items = topic ? allKnowledge.filter(item => topicsMap[item.id]?.some(t => t.slug === topic)) : allKnowledge;
  const filterLabel = topic && Object.values(topicsMap).flat().find(t => t.slug === topic)?.labelFa;
  return <main className="lp-page lp-knowledge-index"><header className="lp-collection-header"><span className="lp-eyebrow">باغ دانش / یادگیری در مسیر</span><h1>برای دیدن،<br /><span>از نو نگاه کنیم.</span></h1><div className="lp-collection-intro"><p>یادداشت‌ها، پرسش‌ها و تجربه‌هایی برای فهمیدنِ رابطه‌ها.<br />اینجا فکرها تمام نمی‌شوند؛ به فکرهای تازه راه می‌دهند.</p>{account?.role === "owner" && !preview ? <Link href="/workspace/capture" className="lp-text-link"><PenLine size={17} /> نوشتن مطلب</Link> : <span className="lp-eyebrow">مشاهده · ارتباط · یادگیری</span>}</div></header>
    {preview && <PreviewNotice compact />}
    <div className="lp-catalog-bar"><span>{items.length.toLocaleString("fa-IR")} نوشته{topic ? ` · ${filterLabel || topic}` : " برای ادامهٔ فکر کردن"}</span><form action="/knowledge" method="get" className="lp-search">{topic && <input type="hidden" name="topic" value={topic} />}<label className="sr-only" htmlFor="knowledge-search">جست‌وجو در باغ دانش</label><input id="knowledge-search" name="q" defaultValue={q || ""} placeholder="دنبال چه فکری می‌گردی؟" /><button aria-label="جست‌وجو" type="submit"><Search size={19} /></button></form></div>
    {(q || topic) && <div className="lp-search-context"><span>{q ? `نتیجه برای «${q}»` : filterLabel || topic}</span><Link href="/knowledge">پاک کردن فیلتر ×</Link></div>}
    <KnowledgeExplorer scope={browserScope(account)} items={items.map(item => ({ slug: item.slug, titleFa: item.titleFa, summaryFa: item.summaryFa, type: item.type, minutes: Math.max(1, Math.ceil((item.bodyFa || "").split(/\s+/).length / 180)), updated: (item.updatedAt || item.createdAt)?.toISOString() || "", topics: topicsMap[item.id] || [] }))} />
    <div className="lp-knowledge-footer"><span aria-hidden="true">✳</span><p>هر نوشته، یک دریچه است؛ نه آخرین کلمه.</p><Link href="/analyzers" className="lp-text-link">نگاهی هم به آینه‌ها بینداز <ArrowUpLeft size={17} /></Link></div>
  </main>;
}
