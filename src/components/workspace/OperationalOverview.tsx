"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpLeft, Bot, FileText, FlaskConical, Receipt, RefreshCw, Users } from "lucide-react";
import { actionKinds, type ActionKind, type OperationalSnapshot } from "@/lib/workspace/operations-types";
import { useWorkspaceLocale } from "./useWorkspaceLocale";
import "./role-home.css";

const labels: Record<ActionKind, [string, string]> = {
  orders: ["بررسی دریافت وجه", "Review payment receipts"],
  notes: ["بازبینی یادداشت‌ها", "Review notes"],
  collaborations: ["درخواست‌های همکاری", "Collaboration requests"],
  analyzers: ["تکمیل آزمون‌های من", "Complete my draft assessments"],
  bots: ["بررسی خطای ربات‌ها", "Review bot errors"],
};

const icons = { orders: Receipt, notes: FileText, collaborations: Users, analyzers: FlaskConical, bots: Bot };

export function OperationalOverview({ snapshot, listOnly = false }: { snapshot: OperationalSnapshot; listOnly?: boolean }) {
  const { t, number } = useWorkspaceLocale();
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const live = snapshot.source === "live";

  return (
    <div className="ws-page rh-home" data-source={snapshot.source} aria-busy={refreshing}>
      <header className="rh-heading">
        <div>
          <p>{live ? t("دادهٔ پایگاه", "DATABASE DATA") : t("بدون اتصال داده", "DATA UNAVAILABLE")}</p>
          <h1>{listOnly ? t("نیازمند اقدام", "Needs your attention") : t("میز کار", "Overview")}</h1>
        </div>
        <div className="rh-tools">
          <button className="rh-button" onClick={() => startRefresh(() => router.refresh())} disabled={refreshing}>
            <RefreshCw size={15} />
            {t("به‌روزرسانی", "Refresh")}
          </button>
        </div>
      </header>

      {!live ? (
        <p className="rh-warning" role="status">
          {t("داده در دسترس نیست. نمونه جای اطلاع واقعی نیامده است.", "Data is unavailable; no sample records have been substituted.")}
        </p>
      ) : null}

      {!listOnly ? (
        <div className="rh-metrics" aria-label={t("کارهای منتظر بررسی", "Pending work")}>
          {(["orders", "notes", "collaborations"] as const).map((kind) => (
            <Link key={kind} className="rh-metric" href={`/workspace/actions?kind=${kind}`}>
              <span>
                {t(...labels[kind])}
                <ArrowUpLeft size={16} />
              </span>
              <strong>{snapshot.counts[kind] == null ? "—" : number(snapshot.counts[kind]!)}</strong>
            </Link>
          ))}
        </div>
      ) : (
        <nav className="rh-filters" aria-label={t("نوع اقدام", "Action type")}>
          {actionKinds.map((kind) => (
            <Link
              key={kind}
              href={`/workspace/actions?kind=${kind}`}
              className="rh-button"
              aria-current={snapshot.filter === kind ? "page" : undefined}
            >
              {t(...labels[kind])}
              {snapshot.counts[kind] != null ? ` · ${number(snapshot.counts[kind]!)}` : ""}
            </Link>
          ))}
        </nav>
      )}

      <section className="rh-panel">
        <div className="rh-section-heading">
          <h2>{t("فهرست", "List")}</h2>
        </div>
        {snapshot.actions.length === 0 ? (
          <p className="rh-empty">{t("اقدام معلقی در این صافی نیست.", "No pending actions in this filter.")}</p>
        ) : (
          <ul className="rh-list">
            {snapshot.actions.map((item) => {
              const Icon = icons[item.kind];
              return (
                <li key={item.key}>
                  <Link href={item.href} className="rh-row">
                    <span className="rh-icon">
                      <Icon size={18} />
                    </span>
                    <span className="rh-copy">
                      <strong>{item.title}</strong>
                      <small>{t(...labels[item.kind])}</small>
                    </span>
                    <ArrowUpLeft size={16} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
