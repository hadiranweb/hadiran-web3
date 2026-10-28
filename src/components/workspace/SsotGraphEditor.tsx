"use client";

import { useMemo, useState } from "react";
import type { GraphEditorView } from "@/lib/analyzers/graph/editor-service";
import type { GraphManifest, IntegrityIssue } from "@/lib/analyzers/graph/types";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400";
const buttonClass =
  "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50";
const primaryClass =
  "rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50";

type Tab = "overview" | "keywords" | "measurement" | "causal" | "audit";

const TABS: { id: Tab; fa: string }[] = [
  { id: "overview", fa: "نمای کلی" },
  { id: "keywords", fa: "کلیدواژه‌ها" },
  { id: "measurement", fa: "ماتریس اندازه‌گیری" },
  { id: "causal", fa: "گراف علّی" },
  { id: "audit", fa: "ممیزی و تاریخچه" },
];

function faNum(value: number | null | undefined): string {
  if (value == null) return "—";
  return Number(value).toLocaleString("fa-IR", { maximumFractionDigits: 4 });
}

function issueTone(issue: IntegrityIssue): string {
  return issue.level === "error" ? "text-rose-700" : "text-amber-700";
}

export function SsotGraphEditor({
  view,
  domain,
}: {
  view: GraphEditorView;
  domain: "DOM.CASIO_SS" | "DOM.MINDSET_GATE";
}) {
  const [manifest, setManifest] = useState<GraphManifest>(view.manifest);
  const [tab, setTab] = useState<Tab>("overview");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [keywordFilter, setKeywordFilter] = useState<string>("");

  const edgesByKeyword = useMemo(() => {
    const map = new Map<string, { item: string; weight: number; rationale: string | null }[]>();
    for (const edge of manifest.edges) {
      if (edge.edgeKind !== "item_keyword") continue;
      const list = map.get(edge.targetCode) ?? [];
      list.push({ item: edge.sourceCode, weight: edge.weight, rationale: edge.rationaleFa });
      map.set(edge.targetCode, list);
    }
    return map;
  }, [manifest]);

  const dirty = useMemo(
    () => JSON.stringify(manifest) !== JSON.stringify(view.manifest),
    [manifest, view.manifest],
  );

  async function save() {
    setBusy(true);
    setStatus("");
    const response = await fetch("/api/workspace/graph", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ manifest }),
    });
    const data = await response.json();
    setStatus(response.ok ? `ذخیره شد — هش ${String(data.hash).slice(0, 10)}` : `خطا: ${JSON.stringify(data.issues ?? data.error)}`);
    setBusy(false);
  }

  async function publish() {
    setBusy(true);
    setStatus("");
    const response = await fetch("/api/workspace/graph/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ domainCode: domain, noteFa: "ویرایش از میز کار گراف" }),
    });
    const data = await response.json();
    setStatus(
      response.ok
        ? `نسخهٔ ${faNum(data.revision)} منتشر شد و موتور از همین لحظه از آن امتیاز می‌گیرد.`
        : `انتشار مسدود شد: ${JSON.stringify(data.issues ?? data.error)}`,
    );
    setBusy(false);
  }

  async function reseed() {
    if (!confirm("پیش‌نویس فعلی با بذر مخزن جایگزین شود؟ ویرایش‌های منتشرنشده از بین می‌روند.")) return;
    setBusy(true);
    const response = await fetch("/api/workspace/graph/reseed", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    });
    const data = await response.json();
    setStatus(response.ok ? "بذر مخزن بازنشر شد." : `خطا: ${data.error ?? data.detail}`);
    setBusy(false);
  }

  function setEdgeWeight(keywordCode: string, itemCode: string, weight: number) {
    setManifest((prev) => ({
      ...prev,
      edges: prev.edges.map((edge) =>
        edge.edgeKind === "item_keyword" && edge.targetCode === keywordCode && edge.sourceCode === itemCode
          ? { ...edge, weight }
          : edge,
      ),
    }));
  }

  function setKeywordLabel(code: string, labelFa: string) {
    setManifest((prev) => ({
      ...prev,
      keywords: prev.keywords.map((keyword) => (keyword.canonicalCode === code ? { ...keyword, labelFa } : keyword)),
    }));
  }

  function setSubKeywordLabel(code: string, labelFa: string) {
    setManifest((prev) => ({
      ...prev,
      subKeywords: prev.subKeywords.map((sub) => (sub.canonicalCode === code ? { ...sub, labelFa } : sub)),
    }));
  }

  function setCausalWeight(edgeKey: string, weight: number) {
    setManifest((prev) => ({
      ...prev,
      causalEdges: prev.causalEdges.map((edge) => (edge.edgeKey === edgeKey ? { ...edge, weight } : edge)),
    }));
  }

  const keywords = manifest.keywords.filter((keyword) =>
    keywordFilter.trim()
      ? `${keyword.canonicalCode} ${keyword.labelFa}`.includes(keywordFilter.trim())
      : true,
  );
  const legacyOf = new Map(manifest.items.map((item) => [item.canonicalCode, item.legacyId] as const));

  return (
    <div className="space-y-4">
      <div className="ws-notice flex flex-wrap items-center gap-3">
        <span>
          نسخهٔ منبع حقیقت: <strong>{manifest.ssotVersion}</strong> · کدینگ: <strong>{manifest.codingVersion}</strong>
        </span>
        <span>
          آخرین انتشار:{" "}
          <strong>{view.revision ? `#${faNum(view.revision.revision)}` : "هنوز منتشر نشده"}</strong>
          {view.drift.dirty ? " · پیش‌نویس منتشرنشده دارد" : " · پیش‌نویس هم‌راستاست"}
        </span>
        {dirty ? <span className="text-amber-700">تغییرات ذخیره‌نشده در فرم</span> : null}
        <span className="ms-auto flex gap-2">
          <button className={buttonClass} onClick={reseed} disabled={busy}>
            بازنشر بذر مخزن
          </button>
          <button className={buttonClass} onClick={save} disabled={busy || !dirty}>
            ذخیرهٔ پیش‌نویس
          </button>
          <button className={primaryClass} onClick={publish} disabled={busy || view.blocking > 0}>
            انتشار نسخهٔ جدید
          </button>
        </span>
      </div>

      {status ? <p className="ws-muted">{status}</p> : null}

      <div className="ws-metrics">
        {[
          { label: "گویه‌ها", value: manifest.items.length },
          { label: "کلیدواژه‌ها", value: manifest.keywords.length },
          { label: "زیرکلیدواژه‌ها", value: manifest.subKeywords.length },
          { label: "یال‌های اندازه‌گیری", value: manifest.edges.length },
          { label: "یال‌های علّی", value: manifest.causalEdges.length },
          { label: "منابع اعلام‌شده", value: manifest.sources.length },
          { label: "خطاهای بازدارنده", value: view.blocking },
        ].map((metric) => (
          <div key={metric.label} className="ws-metric">
            <span>{metric.label}</span>
            <strong>{faNum(metric.value)}</strong>
          </div>
        ))}
      </div>

      <div className="ws-filter flex gap-2">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            className={entry.id === tab ? primaryClass : buttonClass}
            onClick={() => setTab(entry.id)}
          >
            {entry.fa}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="ws-panel">
          <h2 className="ws-panel-title">سلامت ساختاری گراف</h2>
          {view.issues.length === 0 ? (
            <p className="ws-muted">هیچ هشدار یا خطایی؛ انتشار مجاز است.</p>
          ) : (
            <ul className="space-y-1">
              {view.issues.map((issue, index) => (
                <li key={`${issue.code}-${index}`} className={issueTone(issue)}>
                  <code>{issue.entity}</code> — {issue.messageFa} <span className="ws-muted">({issue.code})</span>
                </li>
              ))}
            </ul>
          )}
          <p className="ws-muted mt-3">
            هش: پیش‌نویس <code>{view.draftHash.slice(0, 16)}</code> · بذر مخزن <code>{view.seedHash.slice(0, 16)}</code>
            {view.draftHash === view.seedHash ? " (یکسان)" : " (جدا شده — دیتابیس منبع است)"}
          </p>
        </div>
      ) : null}

      {tab === "keywords" ? (
        <div className="ws-panel space-y-3">
          <input
            className={fieldClass}
            value={keywordFilter}
            onChange={(event) => setKeywordFilter(event.target.value)}
            placeholder="جست‌وجوی کد یا برچسب کلیدواژه"
          />
          {keywords.map((keyword) => (
            <div key={keyword.canonicalCode} className="ws-record-card">
              <div className="flex items-center gap-2">
                <code className="ws-badge">{keyword.canonicalCode}</code>
                <input
                  className={fieldClass}
                  value={keyword.labelFa}
                  onChange={(event) => setKeywordLabel(keyword.canonicalCode, event.target.value)}
                />
              </div>
              <p className="ws-muted mt-1">
                لایه {faNum(keyword.layerNo)} · ISM {faNum(keyword.ismLevel)} · {keyword.micmacQuadrant ?? "بدون طبقه"} ·{" "}
                {faNum((edgesByKeyword.get(keyword.canonicalCode) ?? []).length)} یال اندازه‌گیری
              </p>
              <ul className="mt-2 space-y-1">
                {manifest.subKeywords
                  .filter((sub) => sub.keywordCode === keyword.canonicalCode)
                  .map((sub) => (
                    <li key={sub.canonicalCode} className="flex items-center gap-2">
                      <code className="ws-muted">{sub.canonicalCode}</code>
                      <input
                        className={fieldClass}
                        value={sub.labelFa}
                        onChange={(event) => setSubKeywordLabel(sub.canonicalCode, event.target.value)}
                      />
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "measurement" ? (
        <div className="ws-panel space-y-3">
          {keywords.map((keyword) => {
            const links = edgesByKeyword.get(keyword.canonicalCode) ?? [];
            const total = links.reduce((sum, link) => sum + link.weight, 0);
            return (
              <div key={keyword.canonicalCode} className="ws-record-card">
                <h3 className="ws-card-title">
                  <code>{keyword.canonicalCode}</code> {keyword.labelFa}
                  <span className="ws-muted"> — مجموع وزن {faNum(total)}</span>
                </h3>
                <ul className="space-y-1">
                  {links
                    .slice()
                    .sort((a, b) => b.weight - a.weight)
                    .map((link) => (
                      <li key={`${link.item}-${keyword.canonicalCode}`} className="flex items-center gap-2">
                        <code className="ws-muted">{legacyOf.get(link.item) ?? link.item}</code>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={link.weight}
                          onChange={(event) =>
                            setEdgeWeight(keyword.canonicalCode, link.item, Number(event.target.value))
                          }
                          className="flex-1"
                        />
                        <input
                          className={`${fieldClass} w-24`}
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={link.weight}
                          onChange={(event) =>
                            setEdgeWeight(keyword.canonicalCode, link.item, Number(event.target.value))
                          }
                        />
                      </li>
                    ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : null}

      {tab === "causal" ? (
        <div className="ws-panel">
          <h2 className="ws-panel-title">مؤثرها و متأثرها (DEMATEL / ISM / MICMAC)</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="ws-overline text-start">
                <th className="p-2">کلیدواژهٔ مؤثر</th>
                <th className="p-2">متأثر</th>
                <th className="p-2">نوع یال</th>
                <th className="p-2">شدت</th>
              </tr>
            </thead>
            <tbody>
              {manifest.causalEdges.map((edge) => (
                <tr key={edge.edgeKey} className="border-t border-slate-100">
                  <td className="p-2">
                    <code>{edge.fromCode}</code>
                  </td>
                  <td className="p-2">
                    <code>{edge.toCode}</code>
                  </td>
                  <td className="p-2">{edge.edgeType}</td>
                  <td className="p-2 w-40">
                    <input
                      className={fieldClass}
                      type="number"
                      step="0.05"
                      min="0.05"
                      max="1"
                      value={edge.weight}
                      onChange={(event) => setCausalWeight(edge.edgeKey, Number(event.target.value))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "audit" ? (
        <div className="ws-panel space-y-2">
          <h2 className="ws-panel-title">تاریخچه (فقط افزودنی — قابل ویرایش نیست)</h2>
          {view.audit.length === 0 ? (
            <p className="ws-muted">هنوز رکوردی ثبت نشده است.</p>
          ) : (
            view.audit.map((row) => (
              <div key={String(row.id)} className="ws-recent-row">
                <strong>{row.action}</strong>
                <small>
                  {row.entity}
                  {row.entityCode ? ` · ${row.entityCode}` : ""} ·{" "}
                  {row.createdAt ? new Date(row.createdAt).toLocaleString("fa-IR") : ""}
                  {row.payloadHash ? ` · ${row.payloadHash.slice(0, 10)}` : ""}
                </small>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
