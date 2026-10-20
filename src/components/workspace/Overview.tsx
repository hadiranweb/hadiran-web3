import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, ChevronLeft, FileText, FolderKanban, Handshake, Package } from "lucide-react";
import type { PulseCounts } from "@/lib/workspace/pulse";
import { recordStatusFa } from "@/lib/workspace/pulse";
import type { WorkspaceData } from "@/lib/workspace/types";

function whenFa(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fa-IR");
}

function formatCount(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("fa-IR");
}

const openCollab = new Set(["submitted", "reviewed", "shortlisted", "interview"]);

export function Overview({
  pulse,
  data,
  deskNotice,
  children,
}: {
  pulse: PulseCounts;
  data: WorkspaceData;
  deskNotice?: ReactNode;
  children?: ReactNode;
}) {
  const recent = data.knowledge.slice(0, 5);
  const pending = data.collaborations.filter((item) => openCollab.has(item.status));
  const nextHref = pending.length > 0 ? "/workspace/collaborations" : "/workspace/capture";
  const nextTitle = pending.length > 0 ? "صندوق همکاری را ببین" : "ثبت تازه";
  const nextBody =
    pending.length > 0
      ? `${pending.length.toLocaleString("fa-IR")} درخواست همکاری هنوز باز است.`
      : "صورت‌مسئله را ثبت کن؛ صف اقدام از همان‌جا پر می‌شود.";

  const metrics = [
    {
      href: "/workspace/knowledge",
      label: "باغ دانش",
      value: data.knowledge.length,
      hint: "ثبت‌های میز",
      icon: BookOpen,
      tone: "ws-tone-teal",
    },
    {
      href: "/workspace/projects",
      label: "کارگاه",
      value: data.projects.length,
      hint: "ظرف‌ها",
      icon: FolderKanban,
      tone: "ws-tone-blue",
    },
    {
      href: "/workspace/collaborations",
      label: "همکاری",
      value: data.collaborations.length,
      hint: "درخواست‌ها",
      icon: Handshake,
      tone: "ws-tone-amber",
    },
    {
      href: "/workspace/shop",
      label: "فروشگاه",
      value: data.productCount ?? 0,
      hint: "فهرست کالا",
      icon: Package,
      tone: "ws-tone-purple",
    },
  ] as const;

  const pulseTiles = [
    {
      href: "/workspace#open",
      label: "ثبت خام",
      value: pulse.captured,
    },
    {
      href: "/workspace#open",
      label: "آمادهٔ ارتقا",
      value: pulse.readyToPromote,
    },
    {
      href: "/knowledge",
      label: "منتشر عمومی",
      value: pulse.publicMemory,
    },
    {
      href: "/knowledge",
      label: "باغ دانش",
      value: pulse.knowledgeProjections,
    },
  ];

  return (
    <div className="ws-page">
      <header className="ws-page-heading">
        <div>
          <p className="ws-overline">همه‌چیز در یک نگاه</p>
          <h1>میز کار</h1>
          <p>پالس، صف اقدام و کار باز — همان ثبت‌ها و ربات‌های واقعی، بدون پیش‌نمایش جدا از پایگاه.</p>
        </div>
        <Link href="/workspace/capture" className="ws-button ws-primary">
          ثبت تازه
        </Link>
      </header>

      {deskNotice}

      <section className="ws-canonical-pulse" aria-label="پالس دانش">
        {pulseTiles.map((tile) => (
          <Link key={tile.label} href={tile.href}>
            <span>{tile.label}</span>
            <strong>{formatCount(tile.value)}</strong>
          </Link>
        ))}
      </section>

      <section className="ws-metrics" aria-label="شمار ماژول‌ها">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Link key={metric.href} href={metric.href} className="ws-metric">
              <div>
                <span className={`ws-module-icon ${metric.tone}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
              </div>
              <strong>{formatCount(metric.value)}</strong>
              <h2>{metric.label}</h2>
              <p>{metric.hint}</p>
            </Link>
          );
        })}
      </section>

      <div className="ws-overview-grid">
        <section className="ws-panel">
          <div className="ws-panel-title">
            <h2>یادداشت اخیر</h2>
            <Link href="/workspace/knowledge">همه</Link>
          </div>
          {recent.length === 0 ? (
            <p className="ws-empty">هنوز ثبتی نیست.</p>
          ) : (
            recent.map((item) => (
              <Link key={item.id} href={item.editUrl || `/workspace/records/${item.id}`} className="ws-recent-row">
                <span className="ws-record-icon">
                  <FileText className="h-4 w-4" strokeWidth={1.5} />
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {recordStatusFa(item.status)}
                    {item.updated ? ` · ${whenFa(item.updated)}` : ""}
                  </small>
                </span>
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            ))
          )}
        </section>

        <section className="ws-panel ws-next-steps">
          <p className="ws-overline">گام بعد</p>
          <h2>{nextTitle}</h2>
          <p>{nextBody}</p>
          <Link href={nextHref} className="ws-button ws-primary">
            ادامه
          </Link>
          <Link href="/workspace/actions" className="ws-text-link">
            صف اقدام
          </Link>
        </section>
      </div>

      <section className="ws-panel ws-bottom-panel">
        <div className="ws-inbox-summary">
          <span className="ws-module-icon ws-tone-amber">
            <Handshake className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div>
            <strong>صندوق همکاری</strong>
            <p>
              {pending.length === 0
                ? "درخواست بازی نیست."
                : `${pending.length.toLocaleString("fa-IR")} مورد باز — از صفحهٔ همان کار پاسخ بده.`}
            </p>
          </div>
          <Link href="/workspace/collaborations" className="ws-text-link" style={{ marginInlineStart: "auto" }}>
            همکاری‌ها
          </Link>
        </div>
      </section>

      {children}
    </div>
  );
}
