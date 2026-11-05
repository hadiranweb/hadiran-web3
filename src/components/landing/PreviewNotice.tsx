import Link from "@/components/workspace/WorkspaceLink";
export function PreviewNotice({ compact = false }: { compact?: boolean }) {
  return <div className={`lp-preview ${compact ? "lp-preview-compact" : ""}`}><span>پیش‌نمایش طراحی</span><p>محتوا و قیمت‌های نمونه؛ خرید واقعی فعال نیست.</p>{!compact && <Link href="/shop">دیدن محصولات <span aria-hidden="true">←</span></Link>}</div>;
}
