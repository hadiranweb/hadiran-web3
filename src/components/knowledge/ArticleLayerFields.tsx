"use client";

import { GROWTH_FA, KNOWLEDGE_GROWTH, isKnowledgeGrowth, type KnowledgeGrowth } from "@/lib/knowledge/article";

const defaultFieldClass =
  "w-full rounded-[var(--radius-md)] border border-line bg-elev px-3 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

export type ArticleLayerState = {
  growth: KnowledgeGrowth | "";
  readingMinutes: string;
  lineFa: string;
  questionFa: string;
  rootFa: string;
  firstStepFa: string;
  marginNoteFa: string;
  prunedOn: string;
  audioUrl: string;
  simulatorOn: boolean;
  simulatorTitle: string;
  simulatorIntro: string;
  closingQuestionFa: string;
  closingOptions: string;
  closingPromptFa: string;
  relatedSlugs: string;
};

export function emptyArticleLayerState(): ArticleLayerState {
  return {
    growth: "",
    readingMinutes: "",
    lineFa: "",
    questionFa: "",
    rootFa: "",
    firstStepFa: "",
    marginNoteFa: "",
    prunedOn: "",
    audioUrl: "",
    simulatorOn: false,
    simulatorTitle: "",
    simulatorIntro: "",
    closingQuestionFa: "",
    closingOptions: "",
    closingPromptFa: "",
    relatedSlugs: "",
  };
}

function dateInputValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function optionsToText(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return "";
      const label = (row as { labelFa?: unknown }).labelFa;
      const href = (row as { href?: unknown }).href;
      if (typeof label !== "string") return "";
      return typeof href === "string" && href.trim() ? `${label.trim()} | ${href.trim()}` : label.trim();
    })
    .filter(Boolean)
    .join("\n");
}

function textToOptions(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelFa, href] = line.split("|").map((part) => part.trim());
      return href ? { labelFa, href } : { labelFa };
    });
}

export function articleLayerStateFrom(row: {
  growth?: string | null;
  readingMinutes?: number | null;
  lineFa?: string | null;
  questionFa?: string | null;
  rootFa?: string | null;
  firstStepFa?: string | null;
  marginNoteFa?: string | null;
  prunedAt?: Date | string | null;
  audioUrl?: string | null;
  simulator?: unknown;
  closingQuestionFa?: string | null;
  closingOptions?: unknown;
  closingPromptFa?: string | null;
  relatedSlugs?: string[] | null;
}): ArticleLayerState {
  const simulator = row.simulator && typeof row.simulator === "object" ? (row.simulator as { kind?: string; titleFa?: string; introFa?: string }) : null;
  return {
    growth: isKnowledgeGrowth(row.growth) ? row.growth : "",
    readingMinutes: row.readingMinutes != null ? String(row.readingMinutes) : "",
    lineFa: row.lineFa ?? "",
    questionFa: row.questionFa ?? "",
    rootFa: row.rootFa ?? "",
    firstStepFa: row.firstStepFa ?? "",
    marginNoteFa: row.marginNoteFa ?? "",
    prunedOn: dateInputValue(row.prunedAt),
    audioUrl: row.audioUrl ?? "",
    simulatorOn: Boolean(simulator?.kind),
    simulatorTitle: typeof simulator?.titleFa === "string" ? simulator.titleFa : "",
    simulatorIntro: typeof simulator?.introFa === "string" ? simulator.introFa : "",
    closingQuestionFa: row.closingQuestionFa ?? "",
    closingOptions: optionsToText(row.closingOptions),
    closingPromptFa: row.closingPromptFa ?? "",
    relatedSlugs: (row.relatedSlugs ?? []).join("\n"),
  };
}

export function articleLayerPayload(state: ArticleLayerState) {
  const minutes = state.readingMinutes.trim() ? Number(state.readingMinutes) : null;
  return {
    growth: state.growth || null,
    readingMinutes: minutes != null && Number.isFinite(minutes) ? minutes : null,
    lineFa: state.lineFa.trim() || null,
    questionFa: state.questionFa.trim() || null,
    rootFa: state.rootFa.trim() || null,
    firstStepFa: state.firstStepFa.trim() || null,
    marginNoteFa: state.marginNoteFa.trim() || null,
    prunedAt: state.prunedOn || null,
    audioUrl: state.audioUrl.trim() || null,
    simulator: state.simulatorOn
      ? {
          kind: "clarity_speed" as const,
          titleFa: state.simulatorTitle.trim() || null,
          introFa: state.simulatorIntro.trim() || null,
        }
      : null,
    closingQuestionFa: state.closingQuestionFa.trim() || null,
    closingOptions: textToOptions(state.closingOptions),
    closingPromptFa: state.closingPromptFa.trim() || null,
    relatedSlugs: state.relatedSlugs
      .split("\n")
      .map((row) => row.trim())
      .filter(Boolean),
  };
}

export function ArticleLayerFields({
  value,
  onChange,
  fieldClass = defaultFieldClass,
}: {
  value: ArticleLayerState;
  onChange: (next: ArticleLayerState) => void;
  fieldClass?: string;
}) {
  const set = (patch: Partial<ArticleLayerState>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">رشد در باغ</span>
          <select
            value={value.growth}
            onChange={(e) => set({ growth: e.target.value as KnowledgeGrowth | "" })}
            className={fieldClass}
          >
            <option value="">نامشخص</option>
            {KNOWLEDGE_GROWTH.map((item) => (
              <option key={item} value={item}>
                {GROWTH_FA[item].mark}
                {GROWTH_FA[item].label} — {GROWTH_FA[item].hint}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">زمان خواندن (دقیقه)</span>
          <input
            dir="ltr"
            inputMode="numeric"
            value={value.readingMinutes}
            onChange={(e) => set({ readingMinutes: e.target.value })}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">سؤال روی میز</span>
        <textarea value={value.questionFa} onChange={(e) => set({ questionFa: e.target.value })} rows={2} className={fieldClass} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">یک خط (عجول)</span>
        <textarea value={value.lineFa} onChange={(e) => set({ lineFa: e.target.value })} rows={2} className={fieldClass} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">ریشهٔ پنهان (اگر مسئله است)</span>
        <textarea value={value.rootFa} onChange={(e) => set({ rootFa: e.target.value })} rows={2} className={fieldClass} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">اولین قدم آرام</span>
        <textarea value={value.firstStepFa} onChange={(e) => set({ firstStepFa: e.target.value })} rows={2} className={fieldClass} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">حاشیهٔ هادی</span>
        <textarea value={value.marginNoteFa} onChange={(e) => set({ marginNoteFa: e.target.value })} rows={3} className={fieldClass} />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">تاریخ هرس در باغ</span>
          <input type="date" value={value.prunedOn} onChange={(e) => set({ prunedOn: e.target.value })} className={fieldClass} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">صدای برگ (مسیر یا نشانی)</span>
          <input
            dir="ltr"
            value={value.audioUrl}
            onChange={(e) => set({ audioUrl: e.target.value })}
            placeholder="/audio/leaf.mp3"
            className={fieldClass}
          />
          <span className="text-xs text-muted">آپلود از اینجا نیست؛ فایل را در public بگذار یا نشانی بده.</span>
        </label>
      </div>

      <fieldset className="space-y-3 rounded-[var(--radius-md)] border border-line p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={value.simulatorOn} onChange={(e) => set({ simulatorOn: e.target.checked })} />
          شبیه‌ساز شفافیت در برابر سرعت
        </label>
        {value.simulatorOn ? (
          <>
            <input
              value={value.simulatorTitle}
              onChange={(e) => set({ simulatorTitle: e.target.value })}
              placeholder="عنوان شبیه‌ساز"
              className={fieldClass}
            />
            <textarea
              value={value.simulatorIntro}
              onChange={(e) => set({ simulatorIntro: e.target.value })}
              rows={2}
              placeholder="معرفی کوتاه"
              className={fieldClass}
            />
          </>
        ) : null}
      </fieldset>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">پایان باز — سؤال</span>
        <textarea
          value={value.closingQuestionFa}
          onChange={(e) => set({ closingQuestionFa: e.target.value })}
          rows={2}
          className={fieldClass}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">گزینه‌های پایان (هر خط یک گزینه؛ مسیر اختیاری بعد از |)</span>
        <textarea
          value={value.closingOptions}
          onChange={(e) => set({ closingOptions: e.target.value })}
          rows={3}
          className={fieldClass}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">دعوت به حاشیهٔ خواننده</span>
        <input value={value.closingPromptFa} onChange={(e) => set({ closingPromptFa: e.target.value })} className={fieldClass} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">رشته‌ها (اسلاگ هر برگ در یک خط)</span>
        <textarea
          dir="ltr"
          value={value.relatedSlugs}
          onChange={(e) => set({ relatedSlugs: e.target.value })}
          rows={3}
          className={`${fieldClass} font-mono`}
        />
      </label>
    </div>
  );
}
