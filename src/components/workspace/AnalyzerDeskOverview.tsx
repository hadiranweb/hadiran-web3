"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpLeft, ArrowUpRight, FlaskConical, Plus, RefreshCw } from "lucide-react";
import { deskFilters, type DeskFilter, type DeskSnapshot } from "@/lib/workspace/role-home-types";
import { useWorkspaceLocale } from "./useWorkspaceLocale";
import "./role-home.css";

const labels: Record<DeskFilter, [string, string]> = {
  all: ["همهٔ آزمون‌های مجاز", "All accessible assessments"],
  drafts: ["پیش‌نویس‌های قابل ویرایش", "Editable drafts"],
  responses: ["دسترسی به پاسخ‌ها", "Response access"],
  mine: ["ساخته‌های من", "Created by me"],
};

const states: Record<string, [string, string]> = {
  draft: ["پیش‌نویس", "Draft"],
  open: ["باز", "Open"],
  archived: ["بایگانی", "Archived"],
};

export function AnalyzerDeskOverview({ snapshot, canCreate }: { snapshot: DeskSnapshot; canCreate: boolean }) {
  const { t, locale, number } = useWorkspaceLocale();
  const router = useRouter();
  const [busy, refresh] = useTransition();
  const Arrow = locale === "fa" ? ArrowUpLeft : ArrowUpRight;
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(
      new Date(value),
    );
  const href = (filter: DeskFilter, page = 1) => `/workspace/analyzers?filter=${filter}&page=${page}`;

  return (
    <div className="ws-page rh-home analyzer-home" data-source={snapshot.source} aria-busy={busy}>
      <header className="rh-heading">
        <div>
          <p>{t("آزمون‌های خودم و دسترسی‌های واگذارشده", "My assessments and delegated access")}</p>
          <h1>{t("میز آزمون‌ساز", "Assessment desk")}</h1>
        </div>
        <div className="rh-tools">
          <button className="rh-button" disabled={busy} onClick={() => refresh(() => router.refresh())}>
            <RefreshCw size={15} />
            {t("به‌روزرسانی", "Refresh")}
          </button>
          {canCreate && snapshot.source === "live" ? (
            <Link className="rh-button" href="/workspace/analyzers/new">
              <Plus size={15} />
              {t("آزمون تازه", "New assessment")}
            </Link>
          ) : null}
        </div>
      </header>
      {snapshot.source !== "live" ? (
        <p className="rh-warning" role="status">
          {t("داده‌ها در دسترس نیستند؛ دادهٔ نمونه جایگزین نشده است.", "Data is unavailable; no sample records have been substituted.")}
        </p>
      ) : null}
      <div className="rh-metrics">
        {(["all", "drafts", "responses"] as const).map((filter) => (
          <Link className="rh-metric" href={href(filter)} key={filter} data-desk-metric={filter}>
            <span>
              {t(...labels[filter])}
              <Arrow size={16} />
            </span>
            <strong>{snapshot.counts[filter] == null ? "—" : number(snapshot.counts[filter]!)}</strong>
          </Link>
        ))}
      </div>
      <nav className="rh-filters" aria-label={t("فیلتر آزمون‌ها", "Assessment filter")}>
        {deskFilters.map((filter) => (
          <Link
            className="rh-button"
            href={href(filter)}
            key={filter}
            aria-current={snapshot.filter === filter ? "page" : undefined}
          >
            {t(...labels[filter])} · {snapshot.counts[filter] == null ? "—" : number(snapshot.counts[filter]!)}
          </Link>
        ))}
      </nav>
      <section className="rh-panel">
        <div className="rh-section-heading">
          <h2>{t(...labels[snapshot.filter])}</h2>
        </div>
        {snapshot.items.length ? (
          <ul className="rh-list">
            {snapshot.items.map((item) => (
              <li key={item.slug} data-desk-slug={item.slug}>
                <Link className="rh-row" href={`/workspace/analyzers/${encodeURIComponent(item.slug)}`}>
                  <span className="rh-icon">
                    <FlaskConical size={18} />
                  </span>
                  <span className="rh-copy">
                    <strong>{item.title}</strong>
                    <small>
                      {states[item.status] ? t(...states[item.status]) : item.status} ·{" "}
                      {item.mine ? t("ساختهٔ من", "Created by me") : t("واگذارشده", "Delegated")} ·{" "}
                      {item.edit ? t("ویرایش", "Edit") : t("مشاهده", "View")}
                      {item.responses ? ` · ${t("پاسخ‌ها", "Responses")}` : ""}
                      {item.grant ? ` · ${t("اعطای دسترسی", "Manage access")}` : ""}
                    </small>
                  </span>
                  <time dateTime={item.updatedAt}>{date(item.updatedAt)}</time>
                  <Arrow size={16} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rh-empty">{snapshot.source === "live" ? t("آزمونی در این فهرست نیست.", "No assessments in this list.") : "—"}</p>
        )}
        {snapshot.source === "live" ? (
          <nav className="rh-pages" aria-label={t("صفحه‌ها", "Pages")}>
            {snapshot.page > 1 ? (
              <Link className="rh-button" href={href(snapshot.filter, snapshot.page - 1)}>
                {t("قبلی", "Previous")}
              </Link>
            ) : null}
            <span>
              {t("صفحه", "Page")} {number(snapshot.page)}
            </span>
            {snapshot.page * snapshot.pageSize < (snapshot.counts[snapshot.filter] ?? 0) ? (
              <Link className="rh-button" href={href(snapshot.filter, snapshot.page + 1)}>
                {t("بعدی", "Next")}
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>
      <p className="rh-source">
        {t("آخرین دریافت موفق", "Last successful read")}: {snapshot.asOf ? `${date(snapshot.asOf)} UTC` : "—"}
      </p>
    </div>
  );
}
