import type { ReactNode } from "react";
import Link from "@/components/workspace/WorkspaceLink";
import { ArrowLeft, ArrowUpLeft, Clock3 } from "lucide-react";
import type { knowledge } from "@/db/schema";
import { KnowledgeView } from "@/components/knowledge/KnowledgeView";
import type { KnowledgeSlide } from "@/components/knowledge/SlideReader";
import { markdownHeadings } from "@/lib/markdown";
import { ActiveArticleTOC, ArticleReadingTools, ArticleNotebook } from "./ArticleReadingTools";
import { PreviewNotice } from "./PreviewNotice";
type Article = typeof knowledge.$inferSelect;
export function KnowledgeArticle({ item, slides = [], taxonomy, edit, related = [], preview = false, connections, storageScope = "guest" }: { item: Article; storageScope?: string; connections?: ReactNode; slides?: KnowledgeSlide[]; taxonomy?: ReactNode; edit?: ReactNode; related?: Article[]; preview?: boolean }) {
  const headings = slides.length ? [] : markdownHeadings(item.bodyFa || "");
  const readTime = Math.max(1, Math.ceil((item.bodyFa || "").split(/\s+/).length / 180));
  const date = item.updatedAt || item.createdAt;
  return <main className="lp-page lp-knowledge-page"><div className="lp-article-top"><Link href="/knowledge" className="lp-text-link"><ArrowLeft size={16} /> باغ دانش</Link>{edit}</div>
    {preview && <PreviewNotice compact />}
    <article><header className="lp-article-header"><span className="lp-eyebrow">باغ دانش / {item.type === "note" ? "یادداشت" : item.type === "research" ? "پژوهش" : "مقاله"}</span><h1>{item.titleFa}</h1>{item.titleEn && <p dir="ltr">{item.titleEn}</p>}{item.summaryFa && <p className="lp-article-summary">{item.summaryFa}</p>}<div className="lp-article-meta"><span>هادیران · دانش عمومی</span><span className="lp-reading-time"><Clock3 size={15} /> {readTime.toLocaleString("fa-IR")} دقیقه مطالعه</span>{date && <time dateTime={date.toISOString()}>{new Intl.DateTimeFormat("fa-IR", { dateStyle: "long", timeZone: "Asia/Tehran" }).format(date)}</time>}</div></header>
    <ArticleReadingTools key={`tools:${storageScope}:${item.slug}`} scope={storageScope} slug={item.slug} title={item.titleFa} headings={headings} /><div className="lp-article-layout"><aside className="lp-article-aside"><div className="lp-toc"><span className="lp-eyebrow">در این نوشته</span>{headings.length ? <ActiveArticleTOC headings={headings} /> : <p>متن این نوشته را بخوان؛ اگر نسخهٔ اسلایدی دارد، می‌توانی شیوهٔ مطالعه را تغییر بدهی.</p>}<div className="lp-toc-foot">پرسش خوب،<br />آغاز یک مسیر تازه است.</div></div></aside><div className="lp-article-body"><div className="lp-reading-content"><KnowledgeView title={item.titleFa} bodyFa={item.bodyFa} slides={slides} articleFirst headingAnchors />{taxonomy}</div><ArticleNotebook key={`notes:${storageScope}:${item.slug}`} scope={storageScope} slug={item.slug} title={item.titleFa} /><div className="lp-article-ending"><span aria-hidden="true">✳</span><p>فکر کردن همین‌جا تمام نمی‌شود.</p><Link href="/knowledge" className="lp-text-link">ادامهٔ مسیر در باغ دانش <ArrowLeft size={16} /></Link></div></div></div></article>
    {connections}{related.length > 0 && <section className="lp-related"><div className="lp-section-heading"><div><span className="lp-eyebrow">برای ادامهٔ خواندن</span><h2>از اینجا، یک راه دیگر.</h2></div><Link href="/knowledge" className="lp-text-link">همهٔ نوشته‌ها <ArrowUpLeft size={16} /></Link></div><div className="lp-article-cards">{related.map((row, i) => <Link href={`/knowledge/${row.slug}`} key={row.id}><span className="lp-eyebrow">دانش / {(i + 1).toLocaleString("fa-IR")}</span><h3>{row.titleFa}</h3><p>{row.summaryFa}</p><ArrowUpLeft size={20} /></Link>)}</div></section>}
  </main>;
}
