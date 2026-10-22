"use client";

import { useEffect, useState } from "react";

type AdminConfig = {
  mode: "local" | "llm";
  llmProvider: string;
  llmBaseUrl: string;
  llmModel: string;
  hasApiKey: boolean;
  llmApiKeyHint: string | null;
  llmTemperature: number;
  llmMaxTokens: number;
  llmTimeoutMs: number;
  audienceLevel: string;
  maxHistoryTurns: number;
  enableKnowledgeTool: boolean;
  enableArticleLayers: boolean;
  enableProjectsTool: boolean;
  enableCoursesTool: boolean;
  enableAnalyzersTool: boolean;
  enableExternalEndpoint: boolean;
  externalTokenHint: string | null;
  weights: { title: number; summary: number; body: number; topic: number; hopBonus: number };
  defaultSystemPromptFa: string | null;
  defaultLocalTemplateFa: string | null;
  lastLlmStatus: string | null;
  lastLlmError: string | null;
  lastLlmAt: string | null;
  fromDb: boolean;
};

type Rule = {
  topicSlug: string;
  enabled: boolean;
  modeOverride: string;
  responseStyle: string;
  customPromptFa: string | null;
  customLocalLeadFa: string | null;
  closingQuestionOverrideFa: string | null;
  preferredAnalyzerSlug: string | null;
  priorityBoost: number;
};

type Preview = {
  effectiveMode: string;
  audienceLevel: string;
  topics: { slug: string; name: string }[];
  tools: { knowledge: string[]; projects: string[]; courses: string[]; analyzers: string[] };
  local: { answer: string };
  llm: { answer: string | null; error: string | null; ms: number | null };
};

const inputCls = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";
const labelCls = "block text-xs text-slate-500 mb-1";

const AUDIENCE_LABELS: Record<string, string> = {
  none: "فقط پیام فعلی",
  conversation: "حافظهٔ گفتگو",
  profile: "پروفایل عضو",
  mirror_insights: "همراه با گزارش آینه",
};

export function McpControlDesk() {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [topics, setTopics] = useState<{ slug: string; labelFa: string }[]>([]);
  const [analyzers, setAnalyzers] = useState<{ slug: string; nameFa: string }[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [externalToken, setExternalToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [ruleForm, setRuleForm] = useState({
    topicSlug: "",
    enabled: true,
    modeOverride: "inherit",
    responseStyle: "clarify_first",
    preferredAnalyzerSlug: "",
    priorityBoost: "0",
    customPromptFa: "",
    customLocalLeadFa: "",
    closingQuestionOverrideFa: "",
  });

  const [sample, setSample] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/workspace/mcp", { cache: "no-store" });
    const data = (await res.json()) as {
      config?: AdminConfig;
      rules?: Rule[];
      topics?: { slug: string; labelFa: string }[];
      analyzers?: { slug: string; nameFa: string }[];
      error?: string;
    };
    if (!res.ok) {
      setError(data.error ?? "بارگذاری ناموفق بود.");
      return;
    }
    setConfig(data.config ?? null);
    setRules(data.rules ?? []);
    setTopics(data.topics ?? []);
    setAnalyzers(data.analyzers ?? []);
  }

  useEffect(() => {
    // بارگذاری اولیه بعد از mount؛ وابستگی به load لازم نیست.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  function patch(part: Partial<AdminConfig>) {
    setConfig((prev) => (prev ? { ...prev, ...part } : prev));
  }

  async function save() {
    if (!config) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await fetch("/api/workspace/mcp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: config.mode,
        llmProvider: config.llmProvider,
        llmBaseUrl: config.llmBaseUrl,
        llmModel: config.llmModel,
        llmApiKey: apiKey || undefined,
        llmTemperature: config.llmTemperature,
        llmMaxTokens: config.llmMaxTokens,
        llmTimeoutMs: config.llmTimeoutMs,
        audienceLevel: config.audienceLevel,
        maxHistoryTurns: config.maxHistoryTurns,
        enableKnowledgeTool: config.enableKnowledgeTool,
        enableArticleLayers: config.enableArticleLayers,
        enableProjectsTool: config.enableProjectsTool,
        enableCoursesTool: config.enableCoursesTool,
        enableAnalyzersTool: config.enableAnalyzersTool,
        enableExternalEndpoint: config.enableExternalEndpoint,
        externalToken: externalToken || undefined,
        weights: config.weights,
        defaultSystemPromptFa: config.defaultSystemPromptFa,
        defaultLocalTemplateFa: config.defaultLocalTemplateFa,
      }),
    });
    const data = (await res.json()) as { config?: AdminConfig; error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "ذخیره ناموفق بود.");
      return;
    }
    if (data.config) setConfig(data.config);
    setApiKey("");
    setExternalToken("");
    setNotice("ذخیره شد.");
  }

  async function clearKey(kind: "llm" | "external") {
    setBusy(true);
    const res = await fetch("/api/workspace/mcp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kind === "llm" ? { clearLlmApiKey: true } : { clearExternalToken: true }),
    });
    const data = (await res.json()) as { config?: AdminConfig; error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "حذف ناموفق بود.");
      return;
    }
    if (data.config) setConfig(data.config);
    setNotice("حذف شد.");
  }

  async function saveRule() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/workspace/mcp/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicSlug: ruleForm.topicSlug,
        enabled: ruleForm.enabled,
        modeOverride: ruleForm.modeOverride,
        responseStyle: ruleForm.responseStyle,
        preferredAnalyzerSlug: ruleForm.preferredAnalyzerSlug || null,
        priorityBoost: Number(ruleForm.priorityBoost) || 0,
        customPromptFa: ruleForm.customPromptFa || null,
        customLocalLeadFa: ruleForm.customLocalLeadFa || null,
        closingQuestionOverrideFa: ruleForm.closingQuestionOverrideFa || null,
      }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "ذخیرهٔ قانون ناموفق بود.");
      return;
    }
    setNotice("قانون موضوع ذخیره شد.");
    await load();
  }

  async function removeRule(slug: string) {
    await fetch(`/api/workspace/mcp/topics?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
    await load();
  }

  async function runPreview() {
    if (!sample.trim()) return;
    setPreviewBusy(true);
    setError(null);
    const res = await fetch("/api/workspace/mcp/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: sample }),
    });
    const data = (await res.json()) as Preview & { error?: string };
    setPreviewBusy(false);
    if (!res.ok) {
      setError(data.error ?? "تست ناموفق بود.");
      return;
    }
    setPreview(data);
  }

  if (!config) {
    return <p className="text-sm text-slate-500">{error ?? "در حال بارگذاری…"}</p>;
  }

  const llmTile = !config.hasApiKey
    ? "تنظیم‌نشده"
    : config.lastLlmStatus === "error"
      ? `خطا در آخرین فراخوانی${config.lastLlmAt ? ` — ${new Date(config.lastLlmAt).toLocaleString("fa-IR")}` : ""}`
      : "آماده";

  return (
    <div className="space-y-6">
      {!config.fromDb && (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          جدول تنظیمات MCP هنوز در دیتابیس ساخته نشده (مایگریشن 0032)؛ مقادیر پیش‌فرضِ ایمن فعال‌اند و ذخیره
          تا اجرای مایگریشن ممکن نیست.
        </p>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {notice && <p className="text-sm text-emerald-700">{notice}</p>}

      {/* نوار وضعیت */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "حالت فعال چت", value: config.mode === "llm" ? "متصل به LLM (با پشتیبان لوکال)" : "لوکال (قطعی)" },
          { label: "وضعیت اتصال LLM", value: llmTile },
          { label: "سطح دادهٔ مخاطب", value: AUDIENCE_LABELS[config.audienceLevel] ?? config.audienceLevel },
          { label: "قوانین موضوعی فعال", value: `${rules.filter((r) => r.enabled).length.toLocaleString("fa-IR")} قانون` },
        ].map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">{tile.label}</div>
            <div className="mt-1 text-sm font-bold text-slate-900">{tile.value}</div>
            {tile.label === "وضعیت اتصال LLM" && config.lastLlmError && (
              <div className="mt-1 text-xs text-red-600" dir="ltr">{config.lastLlmError}</div>
            )}
          </div>
        ))}
      </div>

      {/* حالت اجرا و اتصال مدل */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-bold text-slate-900">حالت اجرا و اتصال مدل</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => patch({ mode: "local" })}
            className={`rounded-xl px-4 py-2 text-sm ${config.mode === "local" ? "bg-slate-900 text-white" : "border border-slate-200"}`}
          >
            لوکال (بدون LLM — قطعی از دانشنامه)
          </button>
          <button
            type="button"
            onClick={() => patch({ mode: "llm" })}
            className={`rounded-xl px-4 py-2 text-sm ${config.mode === "llm" ? "bg-slate-900 text-white" : "border border-slate-200"}`}
          >
            متصل به LLM (با بازگشت خودکار به لوکال)
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Base URL (سازگار با OpenAI)</label>
            <input dir="ltr" className={inputCls} value={config.llmBaseUrl} onChange={(e) => patch({ llmBaseUrl: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>نام مدل</label>
            <input dir="ltr" className={inputCls} value={config.llmModel} onChange={(e) => patch({ llmModel: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>
              کلید API {config.hasApiKey ? `(ذخیره‌شده: ${config.llmApiKeyHint ?? "••••"})` : "(تنظیم نشده)"}
            </label>
            <div className="flex gap-2">
              <input
                dir="ltr"
                type="password"
                className={inputCls}
                value={apiKey}
                placeholder="فقط برای تغییر پر شود"
                onChange={(e) => setApiKey(e.target.value)}
              />
              {config.hasApiKey && (
                <button type="button" disabled={busy} onClick={() => void clearKey("llm")} className="shrink-0 rounded-xl border border-slate-200 px-3 text-sm">
                  حذف کلید
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={labelCls}>Temperature</label>
              <input dir="ltr" type="number" step="0.1" min="0" max="2" className={inputCls} value={config.llmTemperature} onChange={(e) => patch({ llmTemperature: Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelCls}>Max tokens</label>
              <input dir="ltr" type="number" className={inputCls} value={config.llmMaxTokens} onChange={(e) => patch({ llmMaxTokens: Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelCls}>Timeout (ms)</label>
              <input dir="ltr" type="number" className={inputCls} value={config.llmTimeoutMs} onChange={(e) => patch({ llmTimeoutMs: Number(e.target.value) })} />
            </div>
          </div>
        </div>
      </section>

      {/* دادهٔ مخاطب و منابع */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-bold text-slate-900">دادهٔ مخاطب و منابع MCP</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>سطح دادهٔ مخاطب</label>
            <select className={inputCls} value={config.audienceLevel} onChange={(e) => patch({ audienceLevel: e.target.value })}>
              <option value="none">فقط پیام فعلی</option>
              <option value="conversation">حافظهٔ گفتگو</option>
              <option value="profile">پروفایل عضو</option>
              <option value="mirror_insights">همراه با گزارش آینه</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>حداکثر نوبت‌های تاریخچه</label>
            <input dir="ltr" type="number" min="0" max="12" className={inputCls} value={config.maxHistoryTurns} onChange={(e) => patch({ maxHistoryTurns: Number(e.target.value) })} />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          {(
            [
              ["enableKnowledgeTool", "ابزار دانش عمومی"],
              ["enableArticleLayers", "لایه‌های عمیق مقاله (line/root/firstStep/closing)"],
              ["enableProjectsTool", "پیشنهاد پروژه‌های کارگاه"],
              ["enableCoursesTool", "پیشنهاد دوره‌ها"],
              ["enableAnalyzersTool", "پیشنهاد آینه‌های باز"],
              ["enableExternalEndpoint", "اندپوینت بیرونی /api/mcp (نیازمند توکن)"],
            ] as [keyof AdminConfig, string][]
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(config[key])}
                onChange={(e) => patch({ [key]: e.target.checked } as Partial<AdminConfig>)}
              />
              {label}
            </label>
          ))}
        </div>
        <p className="text-xs leading-6 text-slate-500">
          روشن/خاموشی و توکن اندپوینت بیرونی از این‌جا مدیریت نمی‌شود؛ مال «بستن external_api» در رجیستری
          سرویس MCP بالای همین صفحه است تا انتشار بیرونی زیر حکمرانی سرویس بماند.
        </p>
        <div className="grid grid-cols-5 gap-2">
          {(
            [
              ["title", "عنوان"],
              ["summary", "خلاصه"],
              ["body", "بدنه"],
              ["topic", "موضوع"],
              ["hopBonus", "پرش موضوعی"],
            ] as [keyof AdminConfig["weights"], string][]
          ).map(([key, label]) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input
                dir="ltr"
                type="number"
                className={inputCls}
                value={config.weights[key]}
                onChange={(e) => patch({ weights: { ...config.weights, [key]: Number(e.target.value) } })}
              />
            </div>
          ))}
        </div>
        <div>
          <label className={labelCls}>پرامپت سیستم پیش‌فرض LLM (خالی = پیش‌فرض هادیران)</label>
          <textarea rows={3} className={inputCls} value={config.defaultSystemPromptFa ?? ""} onChange={(e) => patch({ defaultSystemPromptFa: e.target.value || null })} />
        </div>
        <div>
          <label className={labelCls}>
            قالب پیش‌فرض پاسخ لوکال — متغیرها: {"{{topicIntro}} {{knowledgeLine}} {{knowledgeRoot}} {{firstStep}} {{audienceBottleneckHint}} {{closingQuestion}}"}
          </label>
          <textarea rows={3} className={inputCls} value={config.defaultLocalTemplateFa ?? ""} onChange={(e) => patch({ defaultLocalTemplateFa: e.target.value || null })} />
        </div>
        <button type="button" disabled={busy} onClick={() => void save()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60">
          ذخیرهٔ تنظیمات
        </button>
      </section>

      {/* قوانین موضوعی */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-bold text-slate-900">قوانین موضوعی</h2>
        {rules.length === 0 && <p className="text-sm text-slate-500">هنوز قانونی ثبت نشده است.</p>}
        <ul className="space-y-2">
          {rules.map((rule) => (
            <li key={rule.topicSlug} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <span>
                <b dir="ltr">{rule.topicSlug}</b> — {rule.modeOverride} / {rule.responseStyle}
                {rule.preferredAnalyzerSlug ? ` / آینه: ${rule.preferredAnalyzerSlug}` : ""}
                {!rule.enabled ? " (غیرفعال)" : ""}
              </span>
              <span className="flex gap-2">
                <button
                  type="button"
                  className="text-indigo-700"
                  onClick={() =>
                    setRuleForm({
                      topicSlug: rule.topicSlug,
                      enabled: rule.enabled,
                      modeOverride: rule.modeOverride,
                      responseStyle: rule.responseStyle,
                      preferredAnalyzerSlug: rule.preferredAnalyzerSlug ?? "",
                      priorityBoost: String(rule.priorityBoost),
                      customPromptFa: rule.customPromptFa ?? "",
                      customLocalLeadFa: rule.customLocalLeadFa ?? "",
                      closingQuestionOverrideFa: rule.closingQuestionOverrideFa ?? "",
                    })
                  }
                >
                  ویرایش
                </button>
                <button type="button" className="text-red-700" onClick={() => void removeRule(rule.topicSlug)}>
                  حذف
                </button>
              </span>
            </li>
          ))}
        </ul>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>موضوع</label>
            <select className={inputCls} value={ruleForm.topicSlug} onChange={(e) => setRuleForm({ ...ruleForm, topicSlug: e.target.value })}>
              <option value="">انتخاب موضوع…</option>
              {topics.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.labelFa} ({t.slug})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>آینهٔ پیشنهادی</label>
            <select className={inputCls} value={ruleForm.preferredAnalyzerSlug} onChange={(e) => setRuleForm({ ...ruleForm, preferredAnalyzerSlug: e.target.value })}>
              <option value="">بدون ترجیح</option>
              {analyzers.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.nameFa} ({a.slug})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>حالت اجباری موضوع</label>
            <select className={inputCls} value={ruleForm.modeOverride} onChange={(e) => setRuleForm({ ...ruleForm, modeOverride: e.target.value })}>
              <option value="inherit">پیروی از سراسری</option>
              <option value="local">فقط لوکال</option>
              <option value="llm">متصل به LLM</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>سبک پاسخ</label>
            <select className={inputCls} value={ruleForm.responseStyle} onChange={(e) => setRuleForm({ ...ruleForm, responseStyle: e.target.value })}>
              <option value="clarify_first">شفاف‌سازی ریشه‌ای</option>
              <option value="action_first">گام عملی اول</option>
              <option value="deep_reference">ارجاع دانشی عمیق</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>تقویت اولویت (۵۰- تا ۵۰)</label>
            <input dir="ltr" type="number" className={inputCls} value={ruleForm.priorityBoost} onChange={(e) => setRuleForm({ ...ruleForm, priorityBoost: e.target.value })} />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" checked={ruleForm.enabled} onChange={(e) => setRuleForm({ ...ruleForm, enabled: e.target.checked })} />
            قانون فعال باشد
          </label>
        </div>
        <div>
          <label className={labelCls}>شروع اختصاصی پاسخ لوکال (customLocalLeadFa)</label>
          <textarea rows={2} className={inputCls} value={ruleForm.customLocalLeadFa} onChange={(e) => setRuleForm({ ...ruleForm, customLocalLeadFa: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>سؤال پایانی اختصاصی</label>
          <textarea rows={2} className={inputCls} value={ruleForm.closingQuestionOverrideFa} onChange={(e) => setRuleForm({ ...ruleForm, closingQuestionOverrideFa: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>دستورالعمل اختصاصی برای LLM</label>
          <textarea rows={2} className={inputCls} value={ruleForm.customPromptFa} onChange={(e) => setRuleForm({ ...ruleForm, customPromptFa: e.target.value })} />
        </div>
        <button type="button" disabled={busy || !ruleForm.topicSlug} onClick={() => void saveRule()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60">
          ذخیرهٔ قانون
        </button>
      </section>

      {/* سندباکس */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-bold text-slate-900">جعبهٔ تست زنده (مقایسهٔ دو حالت)</h2>
        <p className="text-xs leading-6 text-slate-500">
          تست فقط با زمینهٔ حساب خودت اجرا می‌شود؛ دادهٔ حساب دیگری شبیه‌سازی نمی‌شود. پاسخ LLM فقط وقتی
          می‌آید که کلید ذخیره شده باشد.
        </p>
        <div className="flex gap-2">
          <input className={inputCls} value={sample} placeholder="پیام نمونه…" onChange={(e) => setSample(e.target.value)} />
          <button type="button" disabled={previewBusy || !sample.trim()} onClick={() => void runPreview()} className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60">
            مقایسهٔ دو حالت
          </button>
        </div>
        {preview && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-2 py-1">حالت مؤثر: {preview.effectiveMode}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">سطح مخاطب: {AUDIENCE_LABELS[preview.audienceLevel] ?? preview.audienceLevel}</span>
              {preview.topics.map((t) => (
                <span key={t.slug} className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">
                  موضوع: {t.name}
                </span>
              ))}
              {preview.tools.knowledge.map((s) => (
                <span key={s} className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">دانش: {s}</span>
              ))}
              {preview.tools.analyzers.map((s) => (
                <span key={s} className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">آینه: {s}</span>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="mb-2 text-xs font-bold text-slate-500">حالت لوکال</div>
                <p className="whitespace-pre-wrap text-sm leading-7">{preview.local.answer}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="mb-2 text-xs font-bold text-slate-500">
                  حالت LLM {preview.llm.ms != null ? `(${preview.llm.ms.toLocaleString("fa-IR")}ms)` : ""}
                </div>
                {preview.llm.answer ? (
                  <p className="whitespace-pre-wrap text-sm leading-7">{preview.llm.answer}</p>
                ) : (
                  <p className="text-sm text-slate-400" dir="ltr">{preview.llm.error ?? "—"}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
