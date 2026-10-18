"use client";

import { previewFetch as fetch } from "@/lib/auth/preview-fetch";

import { useMemo, useRef, useState, type FormEvent } from "react";
import Link from "./WorkspaceLink";
import { useRouter } from "next/navigation";
import { Search, Plus, List, LayoutGrid, Columns3, X, FileText, ArrowUpLeft, ArrowUpRight, ChevronLeft, ChevronRight, Pencil, Check, SlidersHorizontal, Package, Inbox } from "lucide-react";
import type { ModuleKind, WorkspaceItem, WorkspaceData } from "@/lib/workspace/types";
import { useWorkspace } from "./WorkspaceContext";
import { demoKeys, useDemoItems } from "./useDemoItems";
import { MarkdownReadonly } from "@/components/MarkdownReadonly";

const labels: Record<string, [string, string]> = {
  article: ["مقاله", "Article"], note: ["یادداشت", "Note"], research: ["پژوهش", "Research"], idea: ["ایده", "Idea"], wiki: ["ویکی", "Wiki"],
  captured: ["ثبت خام / خصوصی", "Captured / private"], pending_review: ["در بازبینی", "In review"], approved: ["تأییدشده", "Approved"], published: ["منتشر", "Published"],
  sample: ["نمونه", "Sample"], saved: ["ثبت‌شده", "Saved"], draft: ["پیش‌نویس", "Draft"], ready: ["آماده", "Ready"], archived: ["بایگانی", "Archived"],
  concept: ["مفهوم", "Concept"], prototype: ["نمونه اولیه", "Prototype"], development: ["توسعه", "Development"], beta: ["آزمایشی", "Beta"], production: ["عملیاتی", "Production"],
  submitted: ["جدید", "New"], reviewed: ["بررسی‌شده", "Reviewed"], shortlisted: ["فهرست منتخب", "Shortlisted"], interview: ["مصاحبه", "Interview"], accepted: ["پذیرفته", "Accepted"], rejected: ["ردشده", "Rejected"],
  platform: ["پلتفرم", "Platform"], ai: ["هوش مصنوعی", "AI"], education: ["یادگیری", "Learning"], project: ["پروژه", "Project"],
};
const moduleTitles: Record<ModuleKind, [string, string]> = { knowledge: ["دانشنامه", "Knowledge"], projects: ["پروژه‌ها", "Projects"], collaborations: ["پیشنهادهای همکاری", "Collaborations"], products: ["محصولات", "Products"] };
const descriptions: Record<ModuleKind, [string, string]> = {
  knowledge: ["ثبت‌های خام و دانش تأییدشده را مرور کن؛ ذخیره به معنی انتشار نیست.", "Find, read and maintain your knowledge library."],
  projects: ["وضعیت پروژه‌ها و مسیر رسیدن به مرحلهٔ بعد را مرور کن.", "Review project stages and progress toward the next milestone."],
  collaborations: ["درخواست‌های دریافتی را بخوان و مرحلهٔ بررسی را مشخص کن.", "Read incoming applications and manage their review stages."],
  products: ["کاتالوگ محصولات دیجیتال را در محیط آزمایشی آماده کن.", "Prepare your digital catalog in this demo environment."],
};
const collaborationStatuses = ["submitted", "reviewed", "shortlisted", "interview", "accepted", "rejected"];

export function RecordManager({ kind, initial, source }: { kind: ModuleKind; initial: WorkspaceItem[]; source: WorkspaceData["source"] }) {
  const { locale, t, number } = useWorkspace();
  const router = useRouter();
  const demoMode = source === "demo" || kind === "products";
  const { items: storedItems, save } = useDemoItems(demoKeys[kind], initial, demoMode && kind !== "knowledge");
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const items = useMemo(() => storedItems.map((item) => overrides[item.id] ? { ...item, status: overrides[item.id] } : item), [storedItems, overrides]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"list" | "grid" | "kanban">("list");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find((item) => item.id === selectedId);
  const detailDialog = useRef<HTMLDialogElement>(null);
  const formDialog = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<WorkspaceItem | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const label = (value: string) => labels[value] ? t(...labels[value]) : value;
  const title = (item: WorkspaceItem) => locale === "en" ? item.titleEn || item.title : item.title;
  const date = (value: string) => value && !Number.isNaN(Date.parse(value)) ? new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", { month: "short", day: "numeric" }).format(new Date(value)) : "—";
  const price = (item: WorkspaceItem) => Number(item.price) === 0 ? t("رایگان", "Free") : `${number(Number(item.price) || 0)} ${t("تومان", "toman")}`;
  const Arrow = locale === "fa" ? ArrowUpLeft : ArrowUpRight;
  const Back = locale === "fa" ? ChevronRight : ChevronLeft;
  const Next = locale === "fa" ? ChevronLeft : ChevronRight;
  const filterKey = kind === "knowledge" ? "category" : "status";
  const filtered = items.filter((item) => `${item.title} ${item.titleEn || ""} ${item.detail} ${item.category}`.toLowerCase().includes(query.trim().toLowerCase()) && (!filter || item[filterKey] === filter)).sort((a, b) => sort === "title" ? title(a).localeCompare(title(b), locale) : sort === "oldest" ? a.updated.localeCompare(b.updated) : b.updated.localeCompare(a.updated));
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 8, currentPage * 8);
  const filterOptions = Array.from(new Set(items.map((item) => item[filterKey])));
  const openDetails = (item: WorkspaceItem) => { setSelectedId(item.id); setError(""); detailDialog.current?.showModal(); };
  function openProduct(item: WorkspaceItem | null) { setEditing(item); setError(""); formDialog.current?.showModal(); }

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("title") || "").trim();
    if (!name) return;
    const item: WorkspaceItem = {
      id: editing?.id || crypto.randomUUID(), title: name, titleEn: String(form.get("titleEn") || "").trim(), category: String(form.get("format") || "PDF"),
      status: String(form.get("status") || "draft"), detail: String(form.get("detail") || "").trim(), price: String(form.get("price") || "0"),
      slug: editing?.slug || name.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, "-"), updated: new Date().toISOString(),
    };
    try { save(editing ? items.map((p) => p.id === item.id ? item : p) : [item, ...items]); formDialog.current?.close(); setNotice(t("محصول در کاتالوگ آزمایشی این مرورگر ذخیره شد؛ در سایت منتشر نشده است.", "Saved in this browser’s demo catalog. Not published to the website.")); } catch { setError(t("ذخیره در مرورگر ممکن نیست؛ تنظیمات ذخیره‌سازی را بررسی کن.", "Browser storage is unavailable. Check your storage settings.")); }
  }
  async function updateStatus(status: string) {
    if (!selected || saving) return;
    setSaving(true); setError("");
    try {
      if (demoMode) save(items.map((i) => i.id === selected.id ? { ...i, status } : i));
      else {
        const response = await fetch(`/api/workspace/collaborations/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
        if (!response.ok) throw new Error();
        setOverrides((old) => ({ ...old, [selected.id]: status })); router.refresh();
      }
      setNotice(t("مرحلهٔ بررسی به‌روز شد.", "Review stage updated."));
    } catch { setError(t("ذخیره انجام نشد؛ دوباره تلاش کن.", "Could not save. Please try again.")); } finally { setSaving(false); }
  }
  const categoryHeading = kind === "products" ? t("قالب / قیمت", "Format / price") : kind === "collaborations" ? t("پروژه", "Project") : t("نوع", "Type");
  function card(item: WorkspaceItem) {
    return <article className="ws-record-card" key={item.id}><div className="ws-record-card-top"><span className="ws-record-icon">{kind === "products" ? <Package size={19} /> : <FileText size={19} />}</span><span className={`ws-badge ws-status-${item.status}`}>{label(item.status)}</span></div><button className="ws-card-title" onClick={() => openDetails(item)}>{title(item)}</button><p>{item.detail}</p>{kind === "projects" ? <div className="ws-progress"><progress value={item.progress || 0} max={100} /><span>{number(item.progress || 0)}%</span></div> : null}<div className="ws-record-card-bottom"><span>{kind === "products" ? price(item) : label(item.category)}</span><button className="ws-icon-button" onClick={() => openDetails(item)} aria-label={`${t("جزئیات", "Details")}: ${title(item)}`}><Arrow size={17} /></button></div></article>;
  }

  return <main className="ws-page">
    <div className="ws-page-heading"><div><p className="ws-overline">{t("مدیریت محتوا و فعالیت‌ها", "CONTENT & OPERATIONS")}</p><h1>{t(...moduleTitles[kind])}<span className="ws-count">{number(items.length)}</span></h1><p>{t(...descriptions[kind])}</p></div>{kind === "knowledge" ? <Link className="ws-button ws-primary" href="/workspace/capture"><Plus size={17} />{t("یادداشت جدید", "New note")}</Link> : kind === "products" ? <button className="ws-button ws-primary" onClick={() => openProduct(null)}><Plus size={17} />{t("محصول جدید", "New product")}</button> : <span className="ws-read-mode">{t("مرور و بررسی", "Review workspace")}</span>}</div>
    {kind === "products" ? <p className="ws-notice">{t("مدیریت محصولات فعلاً آزمایشی است؛ اطلاعات فقط در این مرورگر می‌ماند و به فروشگاه عمومی یا پرداخت متصل نیست.", "Product management is a prototype. Records stay in this browser and are not connected to the public shop or payments.")}</p> : null}
    {source === "error" && kind !== "products" ? <p className="ws-notice ws-error" role="alert">{t("دریافت اطلاعات از دیتابیس انجام نشد.", "Could not load database records.")}</p> : null}
    {notice ? <p className="ws-success" role="status"><Check size={16} />{notice}</p> : null}
    <section className="ws-panel ws-records-panel" aria-label={t(...moduleTitles[kind])}>
      <div className="ws-record-controls"><label className="ws-search"><Search size={17} /><input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder={t("جست‌وجو در این بخش…", "Search this module…")} aria-label={t("جست‌وجو در رکوردها", "Search records")} />{query ? <button className="ws-icon-button" onClick={() => { setQuery(""); setPage(1); }} aria-label={t("پاک‌کردن جست‌وجو", "Clear search")}><X size={14} /></button> : null}</label><label className="ws-filter"><SlidersHorizontal size={15} /><span className="sr-only">{t("فیلتر", "Filter")}</span><select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}><option value="">{kind === "knowledge" ? t("همه نوع‌ها", "All types") : t("همه وضعیت‌ها", "All statuses")}</option>{filterOptions.map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></label><label className="ws-filter"><span className="sr-only">{t("مرتب‌سازی", "Sort")}</span><select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}><option value="newest">{t("جدیدترین", "Newest first")}</option><option value="oldest">{t("قدیمی‌ترین", "Oldest first")}</option><option value="title">{t("عنوان", "Name A–Z")}</option></select></label><div className="ws-view-switch" aria-label={t("نوع نمایش", "View mode")}>{([{ value: "list", icon: List, fa: "فهرست", en: "List" }, { value: "grid", icon: LayoutGrid, fa: "کارت", en: "Cards" }, ...(kind === "projects" ? [{ value: "kanban", icon: Columns3, fa: "کانبان", en: "Kanban" }] : [])] as const).map((v) => <button key={v.value} className="ws-icon-button" aria-pressed={view === v.value} onClick={() => setView(v.value as typeof view)} aria-label={t(v.fa, v.en)} title={t(v.fa, v.en)}><v.icon size={17} /></button>)}</div></div>
      {filtered.length === 0 ? <div className="ws-empty"><Inbox size={30} /><h2>{t("چیزی پیدا نشد", "No records found")}</h2><p>{query || filter ? t("عبارت جست‌وجو یا فیلتر را تغییر بده.", "Try another search or filter.") : t("هنوز رکوردی در این بخش ثبت نشده است.", "There are no records in this module yet.")}</p>{query || filter ? <button className="ws-button" onClick={() => { setQuery(""); setFilter(""); setPage(1); }}>{t("پاک‌کردن فیلترها", "Clear filters")}</button> : null}</div> : view === "list" ? <div className="ws-table-scroll"><table className="ws-table"><thead><tr><th>{kind === "collaborations" ? t("متقاضی", "Applicant") : t("عنوان", "Name")}</th><th>{categoryHeading}</th><th>{t("وضعیت", "Status")}</th><th>{t("به‌روزرسانی", "Updated")}</th><th><span className="sr-only">{t("عملیات", "Actions")}</span></th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td><button className="ws-table-name" onClick={() => openDetails(item)}><span className="ws-record-icon">{kind === "products" ? <Package size={17} /> : <FileText size={17} />}</span><span><strong>{title(item)}</strong><small>{item.slug || item.email || item.detail}</small></span></button></td><td>{label(item.category)}{kind === "products" ? <small className="ws-cell-sub">{price(item)}</small> : null}</td><td><span className={`ws-badge ws-status-${item.status}`}>{label(item.status)}</span></td><td className="ws-nowrap">{date(item.updated)}</td><td>{kind === "products" ? <button className="ws-icon-button" onClick={() => openProduct(item)} aria-label={`${t("ویرایش", "Edit")}: ${title(item)}`}><Pencil size={16} /></button> : <button className="ws-icon-button" onClick={() => openDetails(item)} aria-label={`${t("جزئیات", "Details")}: ${title(item)}`}><Arrow size={16} /></button>}</td></tr>)}</tbody></table></div> : view === "grid" ? <div className="ws-record-grid">{visible.map(card)}</div> : <div className="ws-kanban">{Array.from(new Set(filtered.map((i) => i.status))).map((status) => <section className="ws-kanban-column" key={status}><h2>{label(status)}<span>{number(filtered.filter((i) => i.status === status).length)}</span></h2>{filtered.filter((i) => i.status === status).map(card)}</section>)}</div>}
      <div className="ws-record-footer"><span role="status">{number(filtered.length)} {t("نتیجه", "results")}</span>{view !== "kanban" ? <div><button className="ws-icon-button" aria-label={t("صفحه قبل", "Previous page")} disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><Back size={16} /></button><span>{number(currentPage)} / {number(pages)}</span><button className="ws-icon-button" aria-label={t("صفحه بعد", "Next page")} disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}><Next size={16} /></button></div> : <span>{t("نمای مرحله‌ای · بدون جابه‌جایی کشیدنی", "Stage view · no drag-and-drop")}</span>}</div>
    </section>
    <dialog ref={detailDialog} className="ws-detail-dialog" onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
      <div className="ws-dialog-header"><h2>{t("جزئیات رکورد", "Record details")}</h2><button className="ws-icon-button" onClick={() => detailDialog.current?.close()} aria-label={t("بستن", "Close")}><X size={18} /></button></div>
      {selected ? <div className="ws-detail-body"><span className={`ws-badge ws-status-${selected.status}`}>{label(selected.status)}</span><h3>{title(selected)}</h3><p>{selected.detail}</p>{selected.body ? <MarkdownReadonly source={selected.body} /> : null}<dl><div><dt>{categoryHeading}</dt><dd>{label(selected.category)}</dd></div><div><dt>{t("تاریخ", "Date")}</dt><dd>{date(selected.updated)}</dd></div>{selected.email ? <div><dt>{t("ایمیل", "Email")}</dt><dd dir="ltr">{selected.email}</dd></div> : null}{kind === "products" ? <div><dt>{t("قیمت", "Price")}</dt><dd>{price(selected)}</dd></div> : null}</dl>
      {kind === "collaborations" ? <label className="ws-field"><span>{t("مرحلهٔ بررسی", "Review stage")}</span><select value={selected.status} disabled={saving} onChange={(e) => void updateStatus(e.target.value)}>{collaborationStatuses.map((status) => <option value={status} key={status}>{label(status)}</option>)}</select><small>{demoMode ? t("تغییرات فقط در این مرورگر ذخیره می‌شوند.", "Changes are saved only in this browser.") : t("تغییر مرحله در دیتابیس ذخیره می‌شود.", "Stage changes are saved to the database.")}</small></label> : null}
      {error ? <p role="alert" className="ws-error">{error}</p> : null}
      <div className="ws-form-actions">{kind === "knowledge" ? <Link className="ws-button ws-primary" href={selected.editUrl || "/workspace/knowledge"} onClick={() => detailDialog.current?.close()}><Pencil size={16} />{t("ویرایش یادداشت", "Edit note")}</Link> : null}{selected.url ? <Link className="ws-button" href={selected.url}>{t("مشاهده در سایت", "View on website")}<Arrow size={16} /></Link> : null}{kind === "products" ? <button className="ws-button ws-primary" onClick={() => { detailDialog.current?.close(); openProduct(selected); }}><Pencil size={16} />{t("ویرایش محصول", "Edit product")}</button> : null}</div></div> : null}
    </dialog>
    <dialog ref={formDialog} className="ws-detail-dialog" onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
      <div className="ws-dialog-header"><h2>{editing ? t("ویرایش محصول", "Edit product") : t("محصول جدید", "New product")}</h2><button className="ws-icon-button" onClick={() => formDialog.current?.close()} aria-label={t("بستن", "Close")}><X size={18} /></button></div>
      <form className="ws-form" onSubmit={saveProduct} key={editing?.id || "new"}><p className="ws-notice">{t("این فرم فقط کاتالوگ آزمایشی مرورگر را تغییر می‌دهد.", "This form updates the browser’s demo catalog only.")}</p><label className="ws-field"><span>{t("نام محصول", "Product name")} *</span><input name="title" required maxLength={256} defaultValue={editing?.title} /></label><label className="ws-field"><span>{t("نام انگلیسی (اختیاری)", "English name (optional)")}</span><input name="titleEn" dir="ltr" defaultValue={editing?.titleEn} /></label><div className="ws-form-columns"><label className="ws-field"><span>{t("قالب", "Format")}</span><select name="format" defaultValue={editing?.category || "PDF"}><option>PDF</option><option>Template</option><option>Bundle</option></select></label><label className="ws-field"><span>{t("وضعیت", "Status")}</span><select name="status" defaultValue={editing?.status || "draft"}>{["draft", "ready", "archived"].map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></label></div><label className="ws-field"><span>{t("قیمت به تومان؛ صفر برای رایگان", "Price in toman; zero for free")}</span><input name="price" type="number" min="0" step="1" required defaultValue={editing?.price || "0"} /></label><label className="ws-field"><span>{t("توضیح", "Description")}</span><textarea name="detail" rows={4} defaultValue={editing?.detail} /></label>{error ? <p role="alert" className="ws-error">{error}</p> : null}<div className="ws-form-actions"><button className="ws-button ws-primary" type="submit">{t("ذخیره آزمایشی", "Save demo product")}</button><button className="ws-button" type="button" onClick={() => formDialog.current?.close()}>{t("انصراف", "Cancel")}</button></div></form>
    </dialog>
  </main>;
}
