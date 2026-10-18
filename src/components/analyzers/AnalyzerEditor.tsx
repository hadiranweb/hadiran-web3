"use client";

import { useMemo, useState } from "react";
import type {
  AnalyzerPack,
  AnalyzerPackStatus,
  CrossPattern,
  Finding,
  Formula,
  FormulaOp,
  Item,
  Keyword,
  LayerBand,
  PackReport,
  Section,
} from "@/lib/analyzers/pack";
import { DEFAULT_ANCHORS } from "@/lib/analyzers/sanitize";
import { AnalyzerResponses } from "@/components/analyzers/AnalyzerResponses";
import { AnalyzerInterpretation } from "@/components/analyzers/AnalyzerInterpretation";
import { AnalyzerGrants } from "@/components/analyzers/AnalyzerGrants";
import { summaryPlaceholders } from "@/lib/analyzers/summary-template";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400";
const ops: FormulaOp[] = [
  "mean",
  "sum",
  "sum_div",
  "weighted_sum",
  "argmin",
  "band",
  "reverse",
  "cap_if",
  "matmul",
];

type Tab = "meta" | "items" | "score" | "report" | "responses" | "interpret" | "access";

function emptyReport(): PackReport {
  return {
    hideGateScores: true,
    closingFa: "",
    userSummaryTemplateFa: "",
    businessNameItemId: "",
    contextFields: [],
    layerBands: [],
    crossPatterns: [],
  };
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function clonePack(pack: AnalyzerPack): AnalyzerPack {
  return JSON.parse(JSON.stringify(pack)) as AnalyzerPack;
}

export function AnalyzerEditor({
  initial,
  canEdit = true,
  canReadResponses = true,
  canGrant = false,
}: {
  initial: AnalyzerPack;
  canEdit?: boolean;
  canReadResponses?: boolean;
  canGrant?: boolean;
}) {
  const [pack, setPack] = useState<AnalyzerPack>(() => clonePack(initial));
  const [tab, setTab] = useState<Tab>(canEdit ? "meta" : "responses");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const itemCount = useMemo(
    () => pack.sections.reduce((sum, section) => sum + section.items.length, 0),
    [pack.sections],
  );

  function patch(next: AnalyzerPack) {
    setPack(next);
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/workspace/analyzers/${pack.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pack),
    });
    const data = (await res.json()) as { error?: string; pack?: AnalyzerPack };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "ذخیره نشد.");
      return;
    }
    if (data.pack) setPack(data.pack);
    setSaved(true);
  }

  function addSection() {
    const next = clonePack(pack);
    next.sections.push({ id: uid("section"), titleFa: "بخش تازه", items: [] });
    patch(next);
  }

  function addItem(sectionIndex: number, kind: Item["kind"]) {
    const next = clonePack(pack);
    const section = next.sections[sectionIndex];
    if (!section) return;
    const id = uid("Q");
    if (kind === "range") {
      section.items.push({ kind: "range", id, text: "سؤال تازه", reverse: false, anchors: { ...DEFAULT_ANCHORS } });
    } else if (kind === "text") {
      section.items.push({ kind: "text", id, text: "سؤال متنی", maxLength: 128 });
    } else {
      section.items.push({
        kind: "choice",
        id,
        text: "سؤال گزینه‌ای",
        options: [
          { value: "a", label: "گزینه ۱" },
          { value: "b", label: "گزینه ۲" },
        ],
      });
    }
    patch(next);
  }

  function suggestFormulas() {
    const next = clonePack(pack);
    const have = new Set(next.formulas.map((row) => row.id));
    for (const section of next.sections) {
      if (section.id === "business") continue;
      const rangeIds = section.items.filter((item) => item.kind === "range").map((item) => item.id);
      if (!rangeIds.length || have.has(section.id)) continue;
      next.formulas.push({ id: section.id, op: "mean", of: rangeIds });
      have.add(section.id);
      if (!next.findings.some((row) => row.id === section.id)) {
        next.findings.push({ id: section.id, titleFa: section.titleFa, kind: "layer" });
      }
    }
    patch(next);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ...(canEdit
              ? ([
                  ["meta", "مشخصات"],
                  ["items", `سؤال‌ها (${itemCount})`],
                  ["score", "نمره"],
                  ["report", "گزارش"],
                ] as [Tab, string][])
              : []),
            ...(canReadResponses
              ? ([
                  ["responses", "پاسخ‌ها"],
                  ["interpret", "تفسیر اولیه"],
                ] as [Tab, string][])
              : []),
            ...(canGrant ? ([["access", "دسترسی"]] as [Tab, string][]) : []),
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              tab === id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "meta" ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs text-slate-500">شناسه: {pack.slug} — بعد از ساخت عوض نمی‌شود.</p>
          <p className="text-xs text-slate-500">
            آدرس عمومی:{" "}
            <a href={`/analyzers/${pack.slug}`} className="text-indigo-700" dir="ltr">
              /analyzers/{pack.slug}
            </a>
            {pack.status !== "open" ? " — تا وضعیت «باز» باشد برای مهمان دیده نمی‌شود." : null}
          </p>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">نام</span>
            <input
              className={fieldClass}
              value={pack.nameFa}
              onChange={(event) => patch({ ...pack, nameFa: event.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">خلاصهٔ هب</span>
            <textarea
              className={`${fieldClass} min-h-24`}
              value={pack.summaryFa}
              onChange={(event) => patch({ ...pack, summaryFa: event.target.value })}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">نسخه</span>
              <input
                className={fieldClass}
                dir="ltr"
                value={pack.version}
                onChange={(event) => patch({ ...pack, version: event.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">وضعیت</span>
              <select
                className={fieldClass}
                value={pack.status}
                onChange={(event) => patch({ ...pack, status: event.target.value as AnalyzerPackStatus })}
              >
                <option value="draft">پیش‌نویس (noindex، فقط مالک اجرا می‌کند)</option>
                <option value="open">باز روی هب</option>
                <option value="archived">بایگانی</option>
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">عنوان رضایت</span>
            <input
              className={fieldClass}
              value={pack.consent.titleFa}
              onChange={(event) =>
                patch({ ...pack, consent: { ...pack.consent, titleFa: event.target.value } })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">برچسب دکمهٔ رضایت</span>
            <input
              className={fieldClass}
              value={pack.consent.acceptLabelFa}
              onChange={(event) =>
                patch({ ...pack, consent: { ...pack.consent, acceptLabelFa: event.target.value } })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">متن رضایت (هر خط یک پاراگراف)</span>
            <textarea
              className={`${fieldClass} min-h-32`}
              value={pack.consent.bodyFa.join("\n")}
              onChange={(event) =>
                patch({
                  ...pack,
                  consent: {
                    ...pack.consent,
                    bodyFa: event.target.value.split("\n").map((line) => line.trimEnd()),
                  },
                })
              }
            />
          </label>
        </section>
      ) : null}

      {tab === "items" ? (
        <section className="space-y-5">
          <p className="text-sm text-slate-500">
            مقیاس فقط کاشی ۰ تا ۱۰ است. بخش با شناسهٔ <span dir="ltr">business</span> در نمره نمی‌آید.
          </p>
          {pack.sections.map((section, sectionIndex) => (
            <SectionCard
              key={section.id}
              section={section}
              onChange={(next) => {
                const copy = clonePack(pack);
                copy.sections[sectionIndex] = next;
                patch(copy);
              }}
              onRemove={() => {
                const copy = clonePack(pack);
                copy.sections.splice(sectionIndex, 1);
                patch(copy);
              }}
              onAdd={(kind) => addItem(sectionIndex, kind)}
            />
          ))}
          <button type="button" onClick={addSection} className="text-sm font-medium text-indigo-700">
            + بخش
          </button>
        </section>
      ) : null}

      {tab === "score" ? (
        <section className="space-y-6">
          <p className="text-sm text-slate-500">
            فرمول اعلانی است؛ جاوااسکریپت و eval پذیرفته نمی‌شود. یال سؤال→بخش هنگام ذخیره از روی بخش‌ها ساخته می‌شود.
          </p>
          <button
            type="button"
            onClick={suggestFormulas}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            پیشنهاد میانگین هر بخش
          </button>
          <FindingsEditor
            findings={pack.findings}
            onChange={(findings) => patch({ ...pack, findings })}
          />
          <KeywordsEditor
            keywords={pack.keywords}
            edgesFrom={pack.edges.filter((edge) => pack.keywords.some((keyword) => keyword.id === edge.to))}
            onChange={(keywords, extraEdges) => {
              const kept = pack.edges.filter((edge) => !pack.keywords.some((keyword) => keyword.id === edge.to));
              patch({ ...pack, keywords, edges: [...kept, ...extraEdges] });
            }}
          />
          <FormulasEditor formulas={pack.formulas} onChange={(formulas) => patch({ ...pack, formulas })} />
        </section>
      ) : null}

      {tab === "report" ? (
        <ReportEditor
          pack={pack}
          report={pack.report ?? emptyReport()}
          onChange={(report) => patch({ ...pack, report })}
        />
      ) : null}

      {tab === "responses" ? <AnalyzerResponses slug={pack.slug} /> : null}
      {tab === "interpret" ? <AnalyzerInterpretation slug={pack.slug} pack={pack} /> : null}
      {tab === "access" ? <AnalyzerGrants slug={pack.slug} /> : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {saved ? <p className="text-sm text-teal-800">ذخیره شد.</p> : null}
      {canEdit ? (
        <button
          type="button"
          onClick={() => void save()}
          disabled={busy}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "در حال ذخیره…" : "ذخیره"}
        </button>
      ) : (
        <p className="text-sm text-slate-500">این آزمون برای شما فقط خواندنی است.</p>
      )}
    </div>
  );
}

function SectionCard({
  section,
  onChange,
  onRemove,
  onAdd,
}: {
  section: Section;
  onChange: (section: Section) => void;
  onRemove: () => void;
  onAdd: (kind: Item["kind"]) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={fieldClass}
          value={section.titleFa}
          onChange={(event) => onChange({ ...section, titleFa: event.target.value })}
          placeholder="عنوان بخش"
        />
        <input
          className={fieldClass}
          dir="ltr"
          value={section.id}
          onChange={(event) => onChange({ ...section, id: event.target.value })}
          placeholder="id"
        />
      </div>
      <input
        className={`${fieldClass} mt-3`}
        value={section.introFa ?? ""}
        onChange={(event) => onChange({ ...section, introFa: event.target.value })}
        placeholder="مقدمهٔ اختیاری"
      />
      <ul className="mt-4 space-y-4">
        {section.items.map((item, index) => (
          <li key={`${item.id}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <ItemEditor
              item={item}
              onChange={(next) => {
                const items = [...section.items];
                items[index] = next;
                onChange({ ...section, items });
              }}
              onRemove={() => onChange({ ...section, items: section.items.filter((_, i) => i !== index) })}
            />
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <button type="button" className="text-indigo-700" onClick={() => onAdd("range")}>
          + مقیاس ۰–۱۰
        </button>
        <button type="button" className="text-indigo-700" onClick={() => onAdd("text")}>
          + متن
        </button>
        <button type="button" className="text-indigo-700" onClick={() => onAdd("choice")}>
          + گزینه
        </button>
        <button type="button" className="text-slate-400" onClick={onRemove}>
          حذف بخش
        </button>
      </div>
    </div>
  );
}

function ItemEditor({
  item,
  onChange,
  onRemove,
}: {
  item: Item;
  onChange: (item: Item) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className={fieldClass}
          dir="ltr"
          value={item.id}
          onChange={(event) => onChange({ ...item, id: event.target.value } as Item)}
        />
        <p className="self-center text-xs text-slate-500">{item.kind}</p>
      </div>
      <textarea
        className={fieldClass}
        value={item.text}
        onChange={(event) => onChange({ ...item, text: event.target.value } as Item)}
      />
      {item.kind === "range" ? (
        <>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={item.reverse}
              onChange={(event) => onChange({ ...item, reverse: event.target.checked })}
            />
            معکوس (۱۰ یعنی ضعف)
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            {([0, 5, 10] as const).map((key) => (
              <input
                key={key}
                className={fieldClass}
                value={item.anchors[key]}
                onChange={(event) =>
                  onChange({ ...item, anchors: { ...item.anchors, [key]: event.target.value } })
                }
                placeholder={`لنگر ${key}`}
              />
            ))}
          </div>
        </>
      ) : null}
      {item.kind === "text" ? (
        <input
          type="number"
          className={fieldClass}
          value={item.maxLength}
          onChange={(event) => onChange({ ...item, maxLength: Number(event.target.value) || 128 })}
        />
      ) : null}
      {item.kind === "choice" ? (
        <div className="space-y-2">
          {item.options.map((option, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-2">
              <input
                className={fieldClass}
                dir="ltr"
                value={option.value}
                onChange={(event) => {
                  const options = [...item.options];
                  options[index] = { ...option, value: event.target.value };
                  onChange({ ...item, options });
                }}
              />
              <input
                className={fieldClass}
                value={option.label}
                onChange={(event) => {
                  const options = [...item.options];
                  options[index] = { ...option, label: event.target.value };
                  onChange({ ...item, options });
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm text-indigo-700"
            onClick={() =>
              onChange({
                ...item,
                options: [...item.options, { value: uid("o"), label: "گزینه" }],
              })
            }
          >
            + گزینه
          </button>
        </div>
      ) : null}
      <button type="button" className="text-xs text-slate-400" onClick={onRemove}>
        حذف سؤال
      </button>
    </div>
  );
}

function FindingsEditor({
  findings,
  onChange,
}: {
  findings: Finding[];
  onChange: (findings: Finding[]) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-base font-bold text-slate-900">عارضه‌ها</h2>
      <ul className="mt-3 space-y-3">
        {findings.map((finding, index) => (
          <li key={index} className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="grid gap-2 sm:grid-cols-4">
              <input
                className={fieldClass}
                dir="ltr"
                value={finding.id}
                onChange={(event) => {
                  const next = [...findings];
                  next[index] = { ...finding, id: event.target.value };
                  onChange(next);
                }}
              />
              <input
                className={fieldClass}
                value={finding.titleFa}
                onChange={(event) => {
                  const next = [...findings];
                  next[index] = { ...finding, titleFa: event.target.value };
                  onChange(next);
                }}
              />
              <select
                className={fieldClass}
                value={finding.kind}
                onChange={(event) => {
                  const next = [...findings];
                  next[index] = { ...finding, kind: event.target.value as Finding["kind"] };
                  onChange(next);
                }}
              >
                <option value="layer">لایه</option>
                <option value="dimension">بُعد</option>
                <option value="group">گروه</option>
                <option value="symptom">عارضه</option>
              </select>
              <input
                className={fieldClass}
                dir="ltr"
                value={finding.parentId ?? ""}
                placeholder="والد"
                onChange={(event) => {
                  const next = [...findings];
                  next[index] = { ...finding, parentId: event.target.value || undefined };
                  onChange(next);
                }}
              />
            </div>
            <textarea
              className={fieldClass}
              placeholder="سازه / تعریف"
              value={finding.constructFa ?? ""}
              onChange={(event) => {
                const next = [...findings];
                next[index] = { ...finding, constructFa: event.target.value };
                onChange(next);
              }}
            />
            <textarea
              className={fieldClass}
              placeholder="وضعیت موجود"
              value={finding.asIsFa ?? ""}
              onChange={(event) => {
                const next = [...findings];
                next[index] = { ...finding, asIsFa: event.target.value };
                onChange(next);
              }}
            />
            <textarea
              className={fieldClass}
              placeholder="وضعیت مطلوب"
              value={finding.toBeFa ?? ""}
              onChange={(event) => {
                const next = [...findings];
                next[index] = { ...finding, toBeFa: event.target.value };
                onChange(next);
              }}
            />
            <textarea
              className={fieldClass}
              placeholder="اقدام پیشنهادی"
              value={finding.actionsFa ?? ""}
              onChange={(event) => {
                const next = [...findings];
                next[index] = { ...finding, actionsFa: event.target.value };
                onChange(next);
              }}
            />
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-3 text-sm text-indigo-700"
        onClick={() => onChange([...findings, { id: uid("F"), titleFa: "عارضه", kind: "layer" }])}
      >
        + عارضه
      </button>
    </div>
  );
}

function KeywordsEditor({
  keywords,
  edgesFrom,
  onChange,
}: {
  keywords: Keyword[];
  edgesFrom: { from: string; to: string }[];
  onChange: (keywords: Keyword[], edges: { from: string; to: string; weight: number; transform: "identity" }[]) => void;
}) {
  function emit(nextKeywords: Keyword[], fromMap: Record<string, string>) {
    const edges: { from: string; to: string; weight: number; transform: "identity" }[] = [];
    for (const keyword of nextKeywords) {
      const refs = (fromMap[keyword.id] ?? "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      for (const from of refs) {
        edges.push({ from, to: keyword.id, weight: 1, transform: "identity" });
      }
    }
    onChange(nextKeywords, edges);
  }

  const fromMap: Record<string, string> = {};
  for (const keyword of keywords) {
    fromMap[keyword.id] = edgesFrom
      .filter((edge) => edge.to === keyword.id)
      .map((edge) => edge.from)
      .join(", ");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-base font-bold text-slate-900">کلیدواژه‌ها</h2>
      <p className="mt-1 text-xs text-slate-500">ستون سوم: شناسهٔ سؤال‌ها با ویرگول. وکتور نیست.</p>
      <ul className="mt-3 space-y-3">
        {keywords.map((keyword, index) => (
          <li key={index} className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                className={fieldClass}
                dir="ltr"
                value={keyword.id}
                onChange={(event) => {
                  const next = [...keywords];
                  next[index] = { ...keyword, id: event.target.value };
                  emit(next, { ...fromMap, [event.target.value]: fromMap[keyword.id] ?? "" });
                }}
              />
              <input
                className={fieldClass}
                value={keyword.labelFa}
                onChange={(event) => {
                  const next = [...keywords];
                  next[index] = { ...keyword, labelFa: event.target.value };
                  emit(next, fromMap);
                }}
              />
              <input
                className={fieldClass}
                dir="ltr"
                value={fromMap[keyword.id] ?? ""}
                placeholder="FL.L1.Q1, …"
                onChange={(event) => emit(keywords, { ...fromMap, [keyword.id]: event.target.value })}
              />
            </div>
            <textarea
              className={fieldClass}
              placeholder="زیرکلیدواژه‌ها، هر خط یکی"
              value={(keyword.children ?? []).join("\n")}
              onChange={(event) => {
                const next = [...keywords];
                next[index] = {
                  ...keyword,
                  children: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                };
                emit(next, fromMap);
              }}
            />
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-3 text-sm text-indigo-700"
        onClick={() => emit([...keywords, { id: uid("K"), labelFa: "کلیدواژه" }], fromMap)}
      >
        + کلیدواژه
      </button>
    </div>
  );
}

function FormulasEditor({
  formulas,
  onChange,
}: {
  formulas: Formula[];
  onChange: (formulas: Formula[]) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-base font-bold text-slate-900">فرمول‌ها</h2>
      <ul className="mt-3 space-y-4">
        {formulas.map((formula, index) => (
          <li key={index} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                className={fieldClass}
                dir="ltr"
                value={formula.id}
                onChange={(event) => {
                  const next = [...formulas];
                  next[index] = { ...formula, id: event.target.value };
                  onChange(next);
                }}
              />
              <select
                className={fieldClass}
                value={formula.op}
                onChange={(event) => {
                  const next = [...formulas];
                  next[index] = { ...formula, op: event.target.value as FormulaOp };
                  onChange(next);
                }}
              >
                {ops.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
              <input
                className={fieldClass}
                dir="ltr"
                value={(formula.of ?? []).join(", ")}
                placeholder="of: id, id"
                onChange={(event) => {
                  const next = [...formulas];
                  next[index] = {
                    ...formula,
                    of: event.target.value
                      .split(",")
                      .map((part) => part.trim())
                      .filter(Boolean),
                  };
                  onChange(next);
                }}
              />
            </div>
            {formula.op === "sum_div" ? (
              <input
                className={`${fieldClass} mt-2`}
                type="number"
                value={formula.divisor ?? 2}
                onChange={(event) => {
                  const next = [...formulas];
                  next[index] = { ...formula, divisor: Number(event.target.value) || 1 };
                  onChange(next);
                }}
              />
            ) : null}
            {formula.op === "weighted_sum" || formula.op === "matmul" ? (
              <textarea
                className={`${fieldClass} mt-2 min-h-20`}
                dir="ltr"
                value={JSON.stringify(formula.weights ?? [], null, 2)}
                onChange={(event) => {
                  try {
                    const weights = JSON.parse(event.target.value) as Formula["weights"];
                    const next = [...formulas];
                    next[index] = { ...formula, weights };
                    onChange(next);
                  } catch {
                    // keep typing
                  }
                }}
              />
            ) : null}
            {formula.op === "band" ? (
              <textarea
                className={`${fieldClass} mt-2 min-h-20`}
                dir="ltr"
                value={JSON.stringify(formula.bands ?? [], null, 2)}
                onChange={(event) => {
                  try {
                    const bands = JSON.parse(event.target.value) as Formula["bands"];
                    const next = [...formulas];
                    next[index] = { ...formula, bands };
                    onChange(next);
                  } catch {
                    // keep typing
                  }
                }}
              />
            ) : null}
            <button
              type="button"
              className="mt-2 text-xs text-slate-400"
              onClick={() => onChange(formulas.filter((_, i) => i !== index))}
            >
              حذف فرمول
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-3 text-sm text-indigo-700"
        onClick={() => onChange([...formulas, { id: uid("f"), op: "mean", of: [] }])}
      >
        + فرمول
      </button>
    </div>
  );
}

function ReportEditor({
  pack,
  report,
  onChange,
}: {
  pack: AnalyzerPack;
  report: PackReport;
  onChange: (report: PackReport) => void;
}) {
  const bands = report.layerBands ?? [];
  const patterns = report.crossPatterns ?? [];
  const fields = report.contextFields ?? [];
  const placeholders = summaryPlaceholders(pack);

  return (
    <section className="space-y-6">
      <p className="text-sm text-slate-500">
        عضو فقط قالب خلاصه را می‌بیند. تفسیر لایه و گلوگاه در تب «تفسیر اولیه» برای آزمون‌ساز است.
      </p>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">خلاصهٔ کاربر (قالب)</span>
          <textarea
            className={`${fieldClass} min-h-28`}
            value={report.userSummaryTemplateFa ?? ""}
            onChange={(event) => onChange({ ...report, userSummaryTemplateFa: event.target.value })}
            placeholder="ارزیابی «{name}» ثبت شد. بلوغ سیستم {maturity} است و گلوگاه {bottleneck} دیده می‌شود."
          />
        </label>
        <p className="text-xs leading-6 text-slate-500">
          پارامتر را داخل آکولاد بگذارید؛ مثل {"{maturity}"} یا {"{layer-foundation.as_is}"}. گیت سبز/زرد/قرمز فراخوانی
          نمی‌شود.
        </p>
        <ul className="grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
          {placeholders.slice(0, 16).map((row) => (
            <li key={row.token}>
              <span dir="ltr">{row.token}</span>
              <span> — {row.hintFa}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={report.hideGateScores !== false}
            onChange={(event) => onChange({ ...report, hideGateScores: event.target.checked })}
          />
          گیت سبز/زرد/قرمز در خلاصهٔ عضو نباشد (آزمون‌ساز در تفسیر اولیه می‌بیند)
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">جملهٔ پایانی</span>
          <textarea
            className={fieldClass}
            value={report.closingFa ?? ""}
            onChange={(event) => onChange({ ...report, closingFa: event.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">شناسهٔ سؤال نام کسب‌وکار</span>
          <input
            className={fieldClass}
            dir="ltr"
            value={report.businessNameItemId ?? ""}
            onChange={(event) => onChange({ ...report, businessNameItemId: event.target.value })}
          />
        </label>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-slate-900">زمینه‌های گزارش</h2>
        <ul className="mt-3 space-y-2">
          {fields.map((field, index) => (
            <li key={index} className="grid gap-2 sm:grid-cols-2">
              <input
                className={fieldClass}
                dir="ltr"
                value={field.id}
                onChange={(event) => {
                  const next = [...fields];
                  next[index] = { ...field, id: event.target.value };
                  onChange({ ...report, contextFields: next });
                }}
              />
              <input
                className={fieldClass}
                value={field.labelFa}
                onChange={(event) => {
                  const next = [...fields];
                  next[index] = { ...field, labelFa: event.target.value };
                  onChange({ ...report, contextFields: next });
                }}
              />
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-3 text-sm text-indigo-700"
          onClick={() =>
            onChange({ ...report, contextFields: [...fields, { id: uid("BIZ"), labelFa: "زمینه" }] })
          }
        >
          + زمینه
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-slate-900">باند لایه</h2>
        <ul className="mt-3 space-y-3">
          {bands.map((band, index) => (
            <li key={index} className="grid gap-2 sm:grid-cols-2">
              <input
                className={fieldClass}
                dir="ltr"
                value={band.id}
                onChange={(event) => {
                  const next = [...bands];
                  next[index] = { ...band, id: event.target.value };
                  onChange({ ...report, layerBands: next });
                }}
              />
              <input
                className={fieldClass}
                value={band.labelFa}
                onChange={(event) => {
                  const next = [...bands];
                  next[index] = { ...band, labelFa: event.target.value };
                  onChange({ ...report, layerBands: next });
                }}
              />
              <textarea
                className={`${fieldClass} sm:col-span-2`}
                value={band.meaningFa}
                onChange={(event) => {
                  const next = [...bands];
                  next[index] = { ...band, meaningFa: event.target.value };
                  onChange({ ...report, layerBands: next });
                }}
              />
              <input
                className={fieldClass}
                type="number"
                value={band.min}
                onChange={(event) => {
                  const next = [...bands];
                  next[index] = { ...band, min: Number(event.target.value) };
                  onChange({ ...report, layerBands: next });
                }}
              />
              <input
                className={fieldClass}
                type="number"
                value={band.max}
                onChange={(event) => {
                  const next = [...bands];
                  next[index] = { ...band, max: Number(event.target.value) };
                  onChange({ ...report, layerBands: next });
                }}
              />
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-3 text-sm text-indigo-700"
          onClick={() =>
            onChange({
              ...report,
              layerBands: [
                ...bands,
                { id: uid("b"), labelFa: "باند", meaningFa: "", min: 0, max: 10, maxInclusive: false } satisfies LayerBand,
              ],
            })
          }
        >
          + باند
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-slate-900">الگوی بین‌لایه</h2>
        <ul className="mt-3 space-y-3">
          {patterns.map((pattern, index) => (
            <li key={index} className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <input
                className={fieldClass}
                dir="ltr"
                value={pattern.id}
                onChange={(event) => {
                  const next = [...patterns];
                  next[index] = { ...pattern, id: event.target.value };
                  onChange({ ...report, crossPatterns: next });
                }}
              />
              <textarea
                className={fieldClass}
                value={pattern.meaningFa}
                onChange={(event) => {
                  const next = [...patterns];
                  next[index] = { ...pattern, meaningFa: event.target.value };
                  onChange({ ...report, crossPatterns: next });
                }}
              />
              <textarea
                className={fieldClass}
                value={pattern.actionFa}
                onChange={(event) => {
                  const next = [...patterns];
                  next[index] = { ...pattern, actionFa: event.target.value };
                  onChange({ ...report, crossPatterns: next });
                }}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className={fieldClass}
                  dir="ltr"
                  placeholder="when.strong"
                  value={pattern.when.strong ?? ""}
                  onChange={(event) => {
                    const next = [...patterns];
                    next[index] = { ...pattern, when: { ...pattern.when, strong: event.target.value || null } };
                    onChange({ ...report, crossPatterns: next });
                  }}
                />
                <input
                  className={fieldClass}
                  dir="ltr"
                  placeholder="when.weak"
                  value={pattern.when.weak ?? ""}
                  onChange={(event) => {
                    const next = [...patterns];
                    next[index] = { ...pattern, when: { ...pattern.when, weak: event.target.value || null } };
                    onChange({ ...report, crossPatterns: next });
                  }}
                />
                <input
                  className={fieldClass}
                  dir="ltr"
                  placeholder="when.alsoWeak"
                  value={pattern.when.alsoWeak ?? ""}
                  onChange={(event) => {
                    const next = [...patterns];
                    next[index] = { ...pattern, when: { ...pattern.when, alsoWeak: event.target.value || null } };
                    onChange({ ...report, crossPatterns: next });
                  }}
                />
                <input
                  className={fieldClass}
                  dir="ltr"
                  placeholder="when.weakAny: id, id"
                  value={pattern.when.weakAny.join(", ")}
                  onChange={(event) => {
                    const next = [...patterns];
                    next[index] = {
                      ...pattern,
                      when: {
                        ...pattern.when,
                        weakAny: event.target.value.split(",").map((part) => part.trim()).filter(Boolean),
                      },
                    };
                    onChange({ ...report, crossPatterns: next });
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-3 text-sm text-indigo-700"
          onClick={() => {
            const row: CrossPattern = {
              id: uid("p"),
              meaningFa: "",
              actionFa: "",
              when: { strong: null, weak: null, alsoWeak: null, weakAny: [] },
            };
            onChange({ ...report, crossPatterns: [...patterns, row] });
          }}
        >
          + الگو
        </button>
      </div>
    </section>
  );
}
