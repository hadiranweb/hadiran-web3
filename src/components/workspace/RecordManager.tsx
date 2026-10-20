"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpLeft,
  Columns3,
  FileText,
  LayoutGrid,
  List,
  Plus,
  Search,
  X,
} from "lucide-react";
import type { ModuleKind, WorkspaceData, WorkspaceItem } from "@/lib/workspace/types";
import { useWorkspaceLocale } from "./useWorkspaceLocale";
import { RecordRowActions } from "./RecordRowActions";

const labels: Record<string, [string, string]> = {
  article: ["مقاله", "Article"],
  note: ["یادداشت", "Note"],
  research: ["پژوهش", "Research"],
  idea: ["ایده", "Idea"],
  wiki: ["ویکی", "Wiki"],
  captured: ["پیش‌نویس", "Draft"],
  pending_review: ["در بازبینی", "In review"],
  promoted: ["منتشرشده", "Published"],
  published: ["منتشرشده", "Published"],
  draft: ["پیش‌نویس", "Draft"],
  review: ["در بازبینی", "In review"],
  private: ["خصوصی", "Private"],
  public: ["عمومی", "Public"],
  idea_status: ["ایده", "Idea"],
  concept: ["مفهوم", "Concept"],
  prototype: ["نمونه اولیه", "Prototype"],
  development: ["توسعه", "Development"],
  beta: ["آزمایشی", "Beta"],
  production: ["عملیاتی", "Production"],
  archived: ["بایگانی", "Archived"],
  submitted: ["جدید", "New"],
  reviewed: ["بررسی‌شده", "Reviewed"],
  shortlisted: ["فهرست منتخب", "Shortlisted"],
  interview: ["مصاحبه", "Interview"],
  accepted: ["پذیرفته", "Accepted"],
  rejected: ["ردشده", "Rejected"],
};

const moduleTitles: Record<Exclude<ModuleKind, "products">, [string, string]> = {
  knowledge: ["باغ دانش", "Knowledge garden"],
  projects: ["پروژه‌ها", "Projects"],
  collaborations: ["درخواست‌های همکاری", "Collaborations"],
};

const descriptions: Record<Exclude<ModuleKind, "products">, [string, string]> = {
  knowledge: [
    "یک باغ است. پیش‌نویس، بازبینی و انتشار وضعیت همین مطلب‌اند، نه محصول جدا. صفحهٔ عمومی فقط خروجی انتشار است.",
    "One garden. Draft, review, and published are statuses of the same article. The public page is the published output.",
  ],
  projects: ["وضعیت پروژه‌ها و مسیر رسیدن به مرحلهٔ بعد را مرور کن.", "Review project stages and progress."],
  collaborations: ["درخواست‌های دریافتی را بخوان و مرحلهٔ بررسی را مشخص کن.", "Read incoming applications and manage their review stages."],
};

const collaborationStatuses = ["submitted", "reviewed", "shortlisted", "interview", "accepted", "rejected"];

const projectColumns = ["idea", "concept", "research", "prototype", "development", "beta", "production", "archived"];
const knowledgeColumns = ["draft", "review", "published", "archived"];

export function RecordManager({
  kind,
  initial,
  source,
  initialFilter = "",
}: {
  kind: Exclude<ModuleKind, "products">;
  initial: WorkspaceItem[];
  source: WorkspaceData["source"];
  initialFilter?: string;
}) {
  const { locale, t, number } = useWorkspaceLocale();
  const router = useRouter();
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const items = useMemo(
    () => initial.map((item) => (overrides[item.id] ? { ...item, status: overrides[item.id] } : item)),
    [initial, overrides],
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(initialFilter);
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"list" | "grid" | "kanban">("list");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const detailDialog = useRef<HTMLDialogElement>(null);
  const selected = items.find((item) => item.id === selectedId);
  const label = (value: string) => (labels[value] ? t(...labels[value]) : value);
  const titleOf = (item: WorkspaceItem) => (locale === "en" ? item.titleEn || item.title : item.title);
  const date = (value: string) =>
    value && !Number.isNaN(Date.parse(value))
      ? new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-GB", { month: "short", day: "numeric" }).format(new Date(value))
      : "—";
  const filtered = items
    .filter(
      (item) =>
        `${item.title} ${item.titleEn || ""} ${item.detail} ${item.category}`.toLowerCase().includes(query.trim().toLowerCase()) &&
        (!filter || (kind === "knowledge" ? item.phase === filter : item.status === filter)),
    )
    .sort((a, b) =>
      sort === "title"
        ? titleOf(a).localeCompare(titleOf(b), locale)
        : sort === "oldest"
          ? a.updated.localeCompare(b.updated)
          : b.updated.localeCompare(a.updated),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 8, currentPage * 8);
  const filterOptions = Array.from(
    new Set(items.map((item) => (kind === "knowledge" ? item.phase : item.status)).filter((value): value is string => Boolean(value))),
  );
  const columns = kind === "collaborations" ? collaborationStatuses : kind === "knowledge" ? knowledgeColumns : projectColumns;

  function hrefFor(item: WorkspaceItem) {
    if (kind === "knowledge") return item.editUrl || `/workspace/records/${item.id}`;
    return item.url || item.editUrl || "#";
  }

  function openDetails(item: WorkspaceItem) {
    setSelectedId(item.id);
    setError("");
    detailDialog.current?.showModal();
  }

  async function updateStatus(status: string) {
    if (!selected || saving || kind !== "collaborations") return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/workspace/collaborations/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error();
      setOverrides((old) => ({ ...old, [selected.id]: status }));
      setNotice(t("مرحلهٔ بررسی به‌روز شد.", "Review stage updated."));
      router.refresh();
    } catch {
      setError(t("ذخیره انجام نشد؛ دوباره تلاش کن.", "Could not save. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  function card(item: WorkspaceItem) {
    return (
      <article className="ws-record-card" key={item.id}>
        <div className="ws-record-card-top">
          <span className="ws-record-icon">
            <FileText size={19} />
          </span>
          <span className={`ws-badge ws-status-${kind === "knowledge" ? item.phase || item.status : item.status}`}>
            {label(kind === "knowledge" ? item.phase || item.status : item.status)}
          </span>
        </div>
        <button type="button" className="ws-card-title" onClick={() => openDetails(item)}>
          {titleOf(item)}
        </button>
        <p>{item.detail}</p>
        {kind === "projects" ? (
          <div className="ws-progress">
            <progress value={item.progress || 0} max={100} />
            <span>{number(item.progress || 0)}%</span>
          </div>
        ) : null}
        <div className="ws-record-card-bottom">
          <span>{kind === "knowledge" ? label(item.visibility || "private") : label(item.category)}</span>
          <span className="flex items-center gap-1">
            {kind === "knowledge" ? (
              <RecordRowActions id={item.id} title={titleOf(item)} phase={item.phase} publicUrl={item.publicUrl} />
            ) : null}
            <button type="button" className="ws-icon-button" onClick={() => openDetails(item)} aria-label={`${t("جزئیات", "Details")}: ${titleOf(item)}`}>
              <ArrowUpLeft size={17} />
            </button>
          </span>
        </div>
      </article>
    );
  }

  return (
    <div className="ws-page">
      <div className="ws-page-heading">
        <div>
          <p className="ws-overline">{t("مدیریت محتوا و فعالیت‌ها", "CONTENT & OPERATIONS")}</p>
          <h1>
            {t(...moduleTitles[kind])}
            <span className="ws-count">{number(items.length)}</span>
          </h1>
          <p>{t(...descriptions[kind])}</p>
        </div>
        {kind === "knowledge" ? (
          <Link className="ws-button ws-primary" href="/workspace/capture">
            <Plus size={17} />
            {t("مطلب تازه", "New article")}
          </Link>
        ) : (
          <span className="ws-read-mode">{t("مرور و بررسی", "Review workspace")}</span>
        )}
      </div>
      {source === "error" ? (
        <p className="ws-notice" role="status">
          {t("داده در دسترس نیست. نمونه جای ردیف واقعی نیامده است.", "Data is unavailable. Sample records have not been substituted.")}
        </p>
      ) : null}
      {notice ? <p className="ws-success">{notice}</p> : null}

      <div className="ws-record-controls">
        <label className="ws-search">
          <Search size={16} />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={t("جست‌وجو", "Search")} />
        </label>
        <label className="ws-filter">
          <select value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }}>
            <option value="">{t("همه", "All")}</option>
            {filterOptions.map((option) => (
              <option key={option} value={option}>
                {label(option)}
              </option>
            ))}
          </select>
        </label>
        <label className="ws-filter">
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="newest">{t("تازه‌ترین", "Newest")}</option>
            <option value="oldest">{t("قدیمی‌ترین", "Oldest")}</option>
            <option value="title">{t("عنوان", "Title")}</option>
          </select>
        </label>
        <div className="ws-view-switch">
          <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")} aria-label={t("فهرست", "List")}>
            <List size={16} />
          </button>
          <button type="button" aria-pressed={view === "grid"} onClick={() => setView("grid")} aria-label={t("کارت", "Grid")}>
            <LayoutGrid size={16} />
          </button>
          <button type="button" aria-pressed={view === "kanban"} onClick={() => setView("kanban")} aria-label={t("ستون وضعیت", "Kanban")}>
            <Columns3 size={16} />
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="ws-empty">{t(...descriptions[kind])}</p>
      ) : view === "kanban" ? (
        <div className="ws-kanban">
          {columns.map((column) => {
            const group = filtered.filter((item) => (kind === "knowledge" ? item.phase === column : item.status === column));
            return (
              <section className="ws-kanban-column" key={column}>
                <h2>
                  {label(column)} <span>{number(group.length)}</span>
                </h2>
                {group.map((item) => card(item))}
              </section>
            );
          })}
        </div>
      ) : view === "grid" ? (
        <div className="ws-record-grid">{visible.map((item) => card(item))}</div>
      ) : (
        <div className="ws-table-scroll">
          <table className="ws-table">
            <thead>
              <tr>
                <th>{t("عنوان", "Title")}</th>
                <th>{t("وضعیت", "Status")}</th>
                <th>
                  {kind === "collaborations"
                    ? t("پروژه", "Project")
                    : kind === "knowledge"
                      ? t("دیدپذیری", "Visibility")
                      : t("نوع", "Type")}
                </th>
                <th>{t("تاریخ", "Updated")}</th>
                {kind === "knowledge" ? <th>{t("اقدام", "Actions")}</th> : null}
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id}>
                  <td>
                    <button type="button" className="ws-table-name" onClick={() => openDetails(item)}>
                      <span className="ws-record-icon">
                        <FileText size={16} />
                      </span>
                      <span>
                        <strong>{titleOf(item)}</strong>
                        <small>{item.detail}</small>
                      </span>
                    </button>
                  </td>
                  <td>
                    <span className={`ws-badge ws-status-${kind === "knowledge" ? item.phase || item.status : item.status}`}>
                      {label(kind === "knowledge" ? item.phase || item.status : item.status)}
                    </span>
                  </td>
                  <td>{kind === "knowledge" ? label(item.visibility || "private") : label(item.category)}</td>
                  <td className="ws-nowrap">{date(item.updated)}</td>
                  {kind === "knowledge" ? (
                    <td>
                      <RecordRowActions id={item.id} title={titleOf(item)} phase={item.phase} publicUrl={item.publicUrl} />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view !== "kanban" && pages > 1 ? (
        <nav className="ws-record-footer">
          <button type="button" className="ws-button" disabled={currentPage <= 1} onClick={() => setPage((value) => value - 1)}>
            {t("قبلی", "Previous")}
          </button>
          <span>
            {t("صفحه", "Page")} {number(currentPage)} / {number(pages)}
          </span>
          <button type="button" className="ws-button" disabled={currentPage >= pages} onClick={() => setPage((value) => value + 1)}>
            {t("بعدی", "Next")}
          </button>
        </nav>
      ) : null}

      <dialog
        ref={detailDialog}
        className="ws-detail-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="ws-dialog-header">
          <h2>{selected ? titleOf(selected) : t("جزئیات", "Details")}</h2>
          <button type="button" className="ws-icon-button" onClick={() => detailDialog.current?.close()} aria-label={t("بستن", "Close")}>
            <X size={18} />
          </button>
        </div>
        {selected ? (
          <div className="ws-detail-body">
            <p>{selected.detail || t("توضیحی ثبت نشده.", "No description recorded.")}</p>
            <dl>
              <div>
                <dt>{t("وضعیت", "Status")}</dt>
                <dd>{label(kind === "knowledge" ? selected.phase || selected.status : selected.status)}</dd>
              </div>
              <div>
                <dt>
                  {kind === "collaborations"
                    ? t("پروژه", "Project")
                    : kind === "knowledge"
                      ? t("دیدپذیری", "Visibility")
                      : t("نوع", "Type")}
                </dt>
                <dd>{kind === "knowledge" ? label(selected.visibility || "private") : label(selected.category)}</dd>
              </div>
              <div>
                <dt>{t("به‌روزرسانی", "Updated")}</dt>
                <dd>{date(selected.updated)}</dd>
              </div>
            </dl>
            {kind === "collaborations" ? (
              <label className="ws-field">
                <span>{t("مرحلهٔ بررسی", "Review stage")}</span>
                <select value={selected.status} disabled={saving} onChange={(event) => updateStatus(event.target.value)}>
                  {collaborationStatuses.map((status) => (
                    <option key={status} value={status}>
                      {label(status)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {error ? <p className="ws-notice">{error}</p> : null}
            <div className="ws-form-actions">
              {hrefFor(selected) !== "#" ? (
                <Link className="ws-button ws-primary" href={hrefFor(selected)} onClick={() => detailDialog.current?.close()}>
                  {t("بازکردن صفحه", "Open page")}
                </Link>
              ) : null}
              {kind === "knowledge" ? (
                <RecordRowActions
                  id={selected.id}
                  title={titleOf(selected)}
                  phase={selected.phase}
                  publicUrl={selected.publicUrl}
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
