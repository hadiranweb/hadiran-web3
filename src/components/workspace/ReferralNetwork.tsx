"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Maximize2, Minimize2, Minus, Plus, RefreshCw, RotateCcw, Search, X } from "lucide-react";
import { layoutReferralNodes, type NetworkSnapshot, type ReferralNode } from "@/lib/workspace/network-types";
import { useWorkspaceLocale } from "./useWorkspaceLocale";
import "./role-home.css";
import "./referral-network.css";

const roleLabels: Record<ReferralNode["role"], [string, string]> = {
  owner: ["مدیر", "Owner"],
  author: ["آزمون‌ساز", "Author"],
  member: ["عضو", "Member"],
};

export function ReferralNetwork({ snapshot }: { snapshot: NetworkSnapshot }) {
  const { t, locale, number } = useWorkspaceLocale();
  const router = useRouter();
  const [busy, refresh] = useTransition();
  const [query, setQuery] = useState(snapshot.query.q);
  const [role, setRole] = useState(snapshot.query.role);
  const [depth, setDepth] = useState(snapshot.query.depth);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [width, setWidth] = useState(800);
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<ReferralNode | null>(null);
  const host = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const expandButton = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ x: number; y: number; pan: { x: number; y: number } } | null>(null);
  const marker = useId().replace(/:/g, "");
  const layout = useMemo(() => layoutReferralNodes(snapshot.nodes), [snapshot.nodes]);
  const live = snapshot.source === "live";
  const height = expanded ? Math.max(340, Math.min(640, width * 0.7)) : 430;
  const scale = Math.min((width - 48) / layout.size, (height - 48) / layout.size, 1) * zoom;
  const nameOf = (node: ReferralNode) => (node.name === "بدون نام" ? t("بدون نام", "Unnamed") : node.name);
  const matches = (node: ReferralNode) =>
    (role === "all" || node.role === role) &&
    `${node.name} ${node.code}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());

  const path = (patch: Partial<{ root: string | null; q: string; role: string; depth: number; page: number }>) => {
    const next = { ...snapshot.query, ...patch };
    const params = new URLSearchParams();
    if (next.root) params.set("root", next.root);
    if (next.q) params.set("q", next.q);
    if (next.role !== "all") params.set("role", next.role);
    params.set("depth", String(next.depth));
    if (next.page > 1) params.set("page", String(next.page));
    return `/workspace/network?${params}`;
  };

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const chrome = [...document.querySelectorAll<HTMLElement>("#workspace-navigation, header.print-hide")].map((el) => ({
      el,
      inert: el.inert,
    }));
    chrome.forEach(({ el }) => {
      el.inert = true;
    });
    const key = (event: KeyboardEvent) => {
      if (dialog.current?.open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setExpanded(false);
        expandButton.current?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      chrome.forEach(({ el, inert }) => {
        el.inert = inert;
      });
      document.removeEventListener("keydown", key);
    };
  }, [expanded]);

  function choose(node: ReferralNode) {
    setSelected(node);
    dialog.current?.showModal();
  }
  function reset() {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }
  function zoomBy(factor: number) {
    setZoom((current) => Math.max(0.35, Math.min(16, current * factor)));
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    refresh(() => router.push(path({ q: query.trim(), role, depth, page: 1 })));
  }
  function tree(node: ReferralNode, seen: Set<string>): ReactNode {
    if (seen.has(node.code)) {
      return (
        <li key={`cycle:${node.code}`} className="ng-cycle">
          {t("رابطهٔ بازگشتی به", "Back-reference to")} <bdi>{node.code}</bdi>
        </li>
      );
    }
    const next = new Set(seen).add(node.code);
    const children = snapshot.nodes.filter((child) => child.referrerCode === node.code);
    return (
      <li key={node.code}>
        <button type="button" onClick={() => choose(node)}>
          <span>{nameOf(node)}</span> <bdi>{node.code}</bdi> · {t(...roleLabels[node.role])}
        </button>
        {children.length ? <ul>{children.map((child) => tree(child, next))}</ul> : null}
      </li>
    );
  }

  return (
    <div className="ws-page rh-home ng-home" data-source={snapshot.source} aria-busy={busy}>
      <header className="rh-heading">
        <div>
          <p>{live ? t("دادهٔ پایگاه", "DATABASE DATA") : t("بدون اتصال داده", "DATA UNAVAILABLE")}</p>
          <h1>{t("درخت روابط معرف", "Referral network")}</h1>
        </div>
        <div className="rh-tools">
          <button className="rh-button" disabled={busy} onClick={() => refresh(() => router.refresh())}>
            <RefreshCw size={15} />
            {t("به‌روزرسانی", "Refresh")}
          </button>
        </div>
      </header>
      {!live ? (
        <p className="rh-warning" role="status">
          {t(
            "اطلاعات پایگاه در دسترس نیست؛ دادهٔ نمونه جایگزین نشده است.",
            "Database data is unavailable; no sample records have been substituted.",
          )}
        </p>
      ) : null}

      <section
        ref={host}
        className={`ng-workbench ${expanded ? "ng-expanded" : ""}`}
        role={expanded ? "dialog" : undefined}
        aria-modal={expanded ? true : undefined}
        aria-label={t("کاوش روابط معرف", "Explore referral relationships")}
      >
        <form className="ng-filters" onSubmit={submit}>
          <label className="ng-search">
            <Search size={16} />
            <span className="sr-only">{t("نام یا کد عمومی", "Name or public code")}</span>
            <input
              disabled={!live}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("نام یا کد عمومی", "Name or public code")}
              maxLength={80}
            />
          </label>
          <label>
            <span>{t("نقش", "Role")}</span>
            <select disabled={!live} value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
              <option value="all">{t("همهٔ نقش‌ها", "All roles")}</option>
              {(["owner", "author", "member"] as const).map((item) => (
                <option key={item} value={item}>
                  {t(...roleLabels[item])}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t("عمق نما", "View depth")}</span>
            <select disabled={!live} value={depth} onChange={(event) => setDepth(Number(event.target.value))}>
              {[1, 2, 3, 4].map((value) => (
                <option value={value} key={value}>
                  {number(value)}
                </option>
              ))}
            </select>
          </label>
          <button className="rh-button" disabled={!live || busy}>
            {t("اعمال", "Apply")}
          </button>
          <button
            type="button"
            className="rh-button"
            ref={expandButton}
            onClick={() => setExpanded((value) => !value)}
            aria-pressed={expanded}
          >
            {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{expanded ? t("خروج از نمای گسترده", "Exit fullscreen view") : t("نمای گسترده", "Fullscreen view")}</span>
          </button>
        </form>

        <div className="ng-caption">
          <span>
            {t("حساب‌های فعال با کد عمومی", "Active accounts with public codes")}:{" "}
            {snapshot.total == null ? "—" : number(snapshot.total)} · {t("در این نما", "In this view")}:{" "}
            {live ? number(snapshot.nodes.length) : "—"}
          </span>
          {snapshot.query.root ? <Link href={path({ root: null, page: 1 })}>{t("بازگشت به ریشه‌ها", "Back to roots")}</Link> : null}
        </div>
        {snapshot.truncated ? (
          <p className="ng-warning" role="status">
            {t(
              "نمای محدود؛ همهٔ روابط بارگیری نشده‌اند. برای ادامه، شاخه‌ای را انتخاب کنید.",
              "Bounded view; not all relationships are loaded. Select a branch to continue.",
            )}
          </p>
        ) : null}
        {snapshot.cycle ? (
          <p className="ng-warning" role="status">
            {t(
              "در روابط این نما حلقه وجود دارد؛ رابطهٔ ثبت‌شده بدون تغییر نمایش داده شده است.",
              "This view contains a referral cycle; recorded relationships have not been altered.",
            )}
          </p>
        ) : null}

        <div className="ng-canvas" ref={canvas}>
          {snapshot.nodes.length ? (
            <svg
              role="group"
              viewBox={`0 0 ${width} ${height}`}
              width="100%"
              height={height}
              tabIndex={0}
              aria-label={t("گراف روابط معرف", "Referral graph")}
              aria-describedby={`${marker}-keys`}
              onKeyDown={(event) => {
                if ((event.target as Element).closest("[data-network-code]")) return;
                if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "Home"].includes(event.key)) {
                  event.preventDefault();
                }
                if (event.key === "+" || event.key === "=") zoomBy(1.2);
                else if (event.key === "-") zoomBy(1 / 1.2);
                else if (event.key === "Home") reset();
                else if (event.key.startsWith("Arrow")) {
                  setPan((current) => ({
                    x: current.x + (event.key === "ArrowLeft" ? -40 : event.key === "ArrowRight" ? 40 : 0),
                    y: current.y + (event.key === "ArrowUp" ? -40 : event.key === "ArrowDown" ? 40 : 0),
                  }));
                }
              }}
              onPointerDown={(event) => {
                if ((event.target as Element).closest("[data-network-code]")) return;
                drag.current = { x: event.clientX, y: event.clientY, pan };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const start = drag.current;
                if (start) setPan({ x: start.pan.x + event.clientX - start.x, y: start.pan.y + event.clientY - start.y });
              }}
              onPointerUp={() => {
                drag.current = null;
              }}
              onPointerCancel={() => {
                drag.current = null;
              }}
            >
              <defs>
                <marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0 0L6 3L0 6" fill="none" stroke="currentColor" />
                </marker>
              </defs>
              <g
                data-network-transform
                transform={`translate(${width / 2 + pan.x} ${height / 2 + pan.y}) scale(${scale}) translate(${-layout.size / 2} ${-layout.size / 2})`}
              >
                {snapshot.edges.map((edge) => {
                  const from = layout.positions[edge.from];
                  const to = layout.positions[edge.to];
                  if (!from || !to) return null;
                  const dx = to.x - from.x;
                  const dy = to.y - from.y;
                  const len = Math.hypot(dx, dy) || 1;
                  const offset = 18;
                  return (
                    <path
                      className="ng-edge"
                      data-network-edge={`${edge.from}:${edge.to}`}
                      key={`${edge.from}:${edge.to}`}
                      markerEnd={`url(#${marker})`}
                      d={
                        edge.from === edge.to
                          ? `M${from.x + 8},${from.y - 13} C${from.x + 85},${from.y - 90} ${from.x + 85},${from.y + 70} ${from.x + 13},${from.y + 8}`
                          : `M${from.x + (dx * offset) / len},${from.y + (dy * offset) / len} L${to.x - (dx * offset) / len},${to.y - (dy * offset) / len}`
                      }
                    />
                  );
                })}
                {snapshot.nodes.map((node) => {
                  const position = layout.positions[node.code];
                  if (!position) return null;
                  const match = matches(node);
                  return (
                    <g
                      key={node.code}
                      data-network-code={node.code}
                      transform={`translate(${position.x} ${position.y})`}
                      className={`ng-node ng-role-${node.role} ${selected?.code === node.code ? "ng-selected" : ""}`}
                      role="button"
                      tabIndex={match ? 0 : -1}
                      opacity={match ? 1 : 0.18}
                      aria-label={`${nameOf(node)} ${node.code} · ${t(...roleLabels[node.role])}`}
                      onClick={() => choose(node)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          choose(node);
                        }
                      }}
                    >
                      <title>{`${nameOf(node)} · ${node.code}`}</title>
                      <circle r="15" />
                      <text textAnchor="middle" y="5" className="ng-initial" aria-hidden="true">
                        {nameOf(node).slice(0, 1)}
                      </text>
                      {snapshot.nodes.length <= 24 || selected?.code === node.code ? (
                        <text y="37" textAnchor="middle" className="ng-label" aria-hidden="true">
                          {nameOf(node).length > 20 ? `${nameOf(node).slice(0, 19)}…` : nameOf(node)}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </g>
            </svg>
          ) : (
            <p className="rh-empty">
              {live
                ? snapshot.total
                  ? t("ریشه‌ای در این نما نیست؛ حسابی را از فهرست انتخاب کنید.", "No roots in this view; select an account from the directory.")
                  : t("حساب فعالی با کد عمومی نیست.", "No active accounts with public codes.")
                : "—"}
            </p>
          )}
          <div className="ng-tools">
            <button className="rh-button" type="button" onClick={() => zoomBy(1.2)} aria-label={t("بزرگ‌نمایی", "Zoom in")}>
              <Plus size={16} />
            </button>
            <output dir="ltr">{Math.round(zoom * 100)}%</output>
            <button className="rh-button" type="button" onClick={() => zoomBy(1 / 1.2)} aria-label={t("کوچک‌نمایی", "Zoom out")}>
              <Minus size={16} />
            </button>
            <button className="rh-button" type="button" onClick={reset} aria-label={t("بازنشانی گراف", "Reset graph")}>
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
        <p className="ng-legend">
          {t("جهت پیکان: معرف ← معرفی‌شده؛ رنگ فقط نشان‌دهندهٔ نقش حساب است.", "Arrow direction: referrer to referred account; color indicates account role only.")}
        </p>
        <p id={`${marker}-keys`} className="sr-only">
          {t(
            "کلیدهای جهت برای جابه‌جایی، مثبت و منفی برای زوم و Home برای بازنشانی؛ فهرست متنی نیز در دسترس است.",
            "Arrow keys pan, plus and minus zoom, Home resets. A text directory is also available.",
          )}
        </p>
        <details className="ng-tree">
          <summary>{t("نمای متنی درختِ همین نما", "Text tree of this view")}</summary>
          <ul>{snapshot.nodes.filter((node) => node.depth === 0).map((node) => tree(node, new Set()))}</ul>
        </details>
        <section className="ng-directory rh-panel">
          <div className="rh-section-heading">
            <h2>{t("فهرست حساب‌ها", "Account directory")}</h2>
            <span>{snapshot.directoryTotal == null ? "—" : number(snapshot.directoryTotal)}</span>
          </div>
          {snapshot.directory.length ? (
            <ul className="rh-list">
              {snapshot.directory.map((node) => (
                <li key={node.code} data-directory-code={node.code}>
                  <div className="rh-row">
                    <button type="button" className="rh-copy" onClick={() => choose(node)}>
                      <strong>{nameOf(node)}</strong>
                      <small>
                        <bdi>{node.code}</bdi> · {t(...roleLabels[node.role])}
                      </small>
                    </button>
                    <Link className="rh-button" href={path({ root: node.code, page: 1 })}>
                      {t("شاخه", "Branch")}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rh-empty">{live ? t("حسابی با این فیلتر پیدا نشد.", "No accounts match these filters.") : "—"}</p>
          )}
          {live ? (
            <nav className="rh-pages" aria-label={t("صفحه‌های فهرست", "Directory pages")}>
              {snapshot.query.page > 1 ? (
                <Link className="rh-button" href={path({ page: snapshot.query.page - 1 })}>
                  {t("قبلی", "Previous")}
                </Link>
              ) : null}
              <span>
                {t("صفحه", "Page")} {number(snapshot.query.page)}
              </span>
              {snapshot.query.page * snapshot.pageSize < (snapshot.directoryTotal ?? 0) ? (
                <Link className="rh-button" href={path({ page: snapshot.query.page + 1 })}>
                  {t("بعدی", "Next")}
                </Link>
              ) : null}
            </nav>
          ) : null}
        </section>
      </section>
      <footer className="rh-source">
        {t("آخرین دریافت موفق", "Last successful read")}:{" "}
        {snapshot.asOf
          ? `${new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "UTC",
            }).format(new Date(snapshot.asOf))} UTC`
          : "—"}
        {snapshot.withoutCode
          ? ` · ${t("حساب فعالِ بدون کد عمومی معتبر", "Active accounts without valid public code")}: ${number(snapshot.withoutCode)}`
          : ""}
      </footer>
      <dialog
        className="ng-detail"
        ref={dialog}
        aria-labelledby={`${marker}-detail`}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <button className="ng-close rh-button" type="button" onClick={() => dialog.current?.close()} aria-label={t("بستن جزئیات", "Close details")}>
          <X size={18} />
        </button>
        {selected ? (
          <>
            <h2 id={`${marker}-detail`}>{nameOf(selected)}</h2>
            <dl>
              <dt>{t("کد عمومی", "Public code")}</dt>
              <dd>
                <bdi>{selected.code}</bdi>
              </dd>
              <dt>{t("نقش", "Role")}</dt>
              <dd>{t(...roleLabels[selected.role])}</dd>
              <dt>{t("معرف ثبت‌شده", "Recorded referrer")}</dt>
              <dd>
                {selected.referrerCode ? (
                  <Link
                    onClick={() => dialog.current?.close()}
                    href={path({ root: selected.referrerCode, page: 1 })}
                  >
                    <bdi>{selected.referrerCode}</bdi>
                  </Link>
                ) : selected.hasReferrer ? (
                  t("خارج از حساب‌های فعالِ دارای کد عمومی", "Outside active coded accounts")
                ) : (
                  t("ثبت نشده", "Not recorded")
                )}
              </dd>
            </dl>
            <Link className="rh-button" onClick={() => dialog.current?.close()} href={path({ root: selected.code, page: 1 })}>
              {t("بازکردن شاخهٔ این حساب", "Open this account’s branch")}
            </Link>
          </>
        ) : null}
      </dialog>
    </div>
  );
}
