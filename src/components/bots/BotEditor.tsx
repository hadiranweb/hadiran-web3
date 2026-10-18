"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ANALYZER_TEXT_IDS,
  BOT_FLOW_FIELDS,
  BOT_KEY_ACTION_OPTIONS,
  BOT_SERVICE_OPTIONS,
  BOT_TEXT_FIELDS,
  parseBotScript,
  parseBotService,
  type BotFlow,
  type BotKey,
  type BotKeyAction,
  type BotScript,
  type BotService,
  type BotTexts,
} from "@/lib/bots/script";
import type { BotView } from "@/lib/bots/types";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400";

const statusFa: Record<BotView["status"], string> = {
  disconnected: "قطع",
  connected: "متصل",
  paused: "متوقف",
  error: "خطا",
};

function faStatus(status: number) {
  return String(status).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)] ?? digit);
}

type Tab = "connect" | "script";

export function BotEditor({
  initial,
  analyzers,
}: {
  initial: BotView;
  analyzers: { slug: string; nameFa: string }[];
}) {
  const router = useRouter();
  const [bot, setBot] = useState(initial);
  const [tab, setTab] = useState<Tab>("connect");
  const [titleFa, setTitleFa] = useState(initial.titleFa);
  const [service, setService] = useState<BotService>(parseBotService(initial.service));
  const [analyzerSlug, setAnalyzerSlug] = useState(initial.analyzerSlug ?? "");
  const [script, setScript] = useState<BotScript>(parseBotScript({ ...initial.script, service: initial.service }));
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function changeService(next: BotService) {
    setService(next);
    setScript((current) => parseBotScript({ ...current, service: next }));
    if (next !== "analyzers") setAnalyzerSlug("");
  }

  function setFlow(id: keyof BotFlow, value: boolean) {
    setScript((current) => ({ ...current, flow: { ...current.flow, [id]: value } }));
  }

  function setText(id: keyof BotTexts, value: string) {
    setScript((current) => ({ ...current, texts: { ...current.texts, [id]: value } }));
  }

  function patchKey(id: string, patch: Partial<BotKey>) {
    setScript((current) => ({
      ...current,
      keys: current.keys.map((key) => (key.id === id ? { ...key, ...patch } : key)),
    }));
  }

  function addKey() {
    const id = `key${Date.now().toString(36)}`;
    const next: BotKey = {
      id,
      labelFa: "کلید تازه",
      action: "reply",
      command: "",
      descriptionFa: "کلید تازه",
      replyFa: "",
      inMenu: false,
      inKeyboard: true,
    };
    setScript((current) => ({ ...current, keys: [...current.keys, next].slice(0, 20) }));
  }

  function removeKey(id: string) {
    setScript((current) => ({ ...current, keys: current.keys.filter((key) => key.id !== id) }));
  }

  async function parse(res: Response) {
    const data = (await res.json()) as { error?: string; bot?: BotView };
    if (!res.ok || !data.bot) throw new Error(data.error ?? "انجام نشد.");
    return data.bot;
  }

  async function saveSettings() {
    setBusy("save");
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/workspace/bots/${bot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleFa,
          service,
          analyzerSlug: service === "analyzers" ? analyzerSlug.trim() || null : null,
          script: parseBotScript({ ...script, service }),
        }),
      });
      const next = await parse(res);
      setBot(next);
      setService(parseBotService(next.service));
      setScript(parseBotScript({ ...next.script, service: next.service }));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیره نشد.");
    } finally {
      setBusy(null);
    }
  }

  async function connect() {
    setBusy("connect");
    setError(null);
    try {
      const res = await fetch(`/api/workspace/bots/${bot.id}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() || undefined }),
      });
      const next = await parse(res);
      setBot(next);
      setToken("");
      setSaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "اتصال نشد.");
    } finally {
      setBusy(null);
    }
  }

  async function disconnect() {
    setBusy("disconnect");
    setError(null);
    try {
      const res = await fetch(`/api/workspace/bots/${bot.id}/disconnect`, { method: "POST" });
      const next = await parse(res);
      setBot(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "قطع نشد.");
    } finally {
      setBusy(null);
    }
  }

  async function refresh() {
    setBusy("refresh");
    setError(null);
    try {
      const res = await fetch(`/api/workspace/bots/${bot.id}/refresh`, { method: "POST" });
      const next = await parse(res);
      setBot(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "بروزرسانی نشد.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!window.confirm("این ربات از میز حذف شود؟")) return;
    setBusy("delete");
    setError(null);
    const res = await fetch(`/api/workspace/bots/${bot.id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "حذف نشد.");
      return;
    }
    router.push("/workspace/bots");
    router.refresh();
  }

  const tabClass = (id: Tab) =>
    `rounded-t-xl px-4 py-2 text-sm ${tab === id ? "bg-white font-medium text-slate-900 border border-b-white border-slate-200" : "text-slate-500"}`;

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-slate-200">
        <button type="button" className={tabClass("connect")} onClick={() => setTab("connect")}>
          اتصال
        </button>
        <button type="button" className={tabClass("script")} onClick={() => setTab("script")}>
          گفتگو
        </button>
      </div>

      {tab === "connect" ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <p className="text-sm text-slate-500">
              وضعیت: <span className="font-medium text-slate-900">{statusFa[bot.status]}</span>
              {bot.telegramUsername ? ` · @${bot.telegramUsername}` : ""}
              {bot.tokenHint ? ` · توکن ‎••••${bot.tokenHint}` : ""}
            </p>
            {bot.lastError ? <p className="text-sm text-red-700">{bot.lastError}</p> : null}
            <dl className="grid gap-1 text-xs leading-6 text-slate-500 sm:grid-cols-2">
              <div>
                آخرین POST:{" "}
                {bot.lastWebhookAt ? new Date(bot.lastWebhookAt).toLocaleString("fa-IR") : "نرسیده"}
                {bot.lastUpdateKind ? ` · ${bot.lastUpdateKind}` : ""}
              </div>
              <div>پاسخ origin: {bot.lastInboundStatus != null ? faStatus(bot.lastInboundStatus) : "—"}</div>
              <div>صف تلگرام: {bot.pendingUpdateCount != null ? bot.pendingUpdateCount.toLocaleString("fa-IR") : "وضعیت وب‌هوک را بزنید"}</div>
              <div>خطای تلگرام: {bot.telegramLastError ?? "—"}</div>
            </dl>
            {bot.pendingUpdateCount ? (
              <p className="text-sm text-amber-800">
                تلگرام پیام در صف دارد. اگر آخرین POST خالی است، ورودی به origin نرسیده (timeout یا Worker). اگر پاسخ
                ۴۰۱ است، دوباره اتصال بزنید.
              </p>
            ) : null}
            {bot.lastWebhookAt && bot.lastError?.includes("ارسال پیام") ? (
              <p className="text-sm text-amber-800">
                وب‌هوک رسید ولی پیام نرفت. روی لیارا TELEGRAM_API_BASE را به Worker کلودفلر بدهید.
              </p>
            ) : null}

            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">نام</span>
              <input className={fieldClass} value={titleFa} onChange={(event) => setTitleFa(event.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">کار این ربات</span>
              <select
                className={fieldClass}
                value={service}
                onChange={(event) => changeService(parseBotService(event.target.value))}
              >
                {BOT_SERVICE_OPTIONS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.labelFa}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs leading-6 text-slate-500">
                {BOT_SERVICE_OPTIONS.find((item) => item.id === service)?.hintFa}
              </span>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">کانال</span>
              <select className={fieldClass} disabled value="telegram">
                <option value="telegram">تلگرام</option>
              </select>
            </label>
            {service === "analyzers" ? (
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">محدود کردن فهرست آزمون (اختیاری)</span>
                <select className={fieldClass} value={analyzerSlug} onChange={(event) => setAnalyzerSlug(event.target.value)}>
                  <option value="">همهٔ آزمون‌های باز</option>
                  {analyzers.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.nameFa} ({item.slug})
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <button
              type="button"
              onClick={() => void saveSettings()}
              disabled={busy !== null}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {busy === "save" ? "در حال ذخیره…" : "ذخیرهٔ تنظیمات"}
            </button>
            {saved ? <p className="text-sm text-teal-800">تنظیمات ذخیره شد.</p> : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">اتصال تلگرام</h2>
            <ol className="list-decimal space-y-1 pr-5 text-sm leading-7 text-slate-600">
              <li>در تلگرام به @BotFather بروید و /newbot بزنید.</li>
              <li>توکن را فقط در این کادر بگذارید؛ در گیت و چت نگذارید.</li>
              <li>اتصال، getMe و setWebhook با secret_token را می‌زند. polling استفاده نمی‌شود.</li>
              <li>
                سرور لیارا داخل ایران به api.telegram.org نمی‌رسد و تلگرام هم اغلب به مبدأ ایرانی timeout
                می‌دهد. هم خروجی (/bot) هم ورودی وب‌هوک (/hook) از Worker کلودفلر می‌رود (متغیر
                TELEGRAM_API_BASE روی لیارا، نه گیت).
              </li>
            </ol>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">
                {bot.hasToken ? "توکن تازه (اختیاری؛ خالی = همان توکن ذخیره‌شده)" : "توکن BotFather"}
              </span>
              <input
                className={fieldClass}
                dir="ltr"
                type="password"
                autoComplete="off"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder={bot.hasToken ? "••••" : "123456789:AA..."}
              />
            </label>
            <p className="text-xs leading-6 text-slate-500 break-all">آدرس وب‌هوک: {bot.webhookUrl}</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void connect()}
                disabled={busy !== null}
                className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {busy === "connect" ? "در حال اتصال…" : bot.hasToken ? "اتصال / ثبت وب‌هوک" : "اتصال"}
              </button>
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={busy !== null || !bot.hasToken}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-60"
              >
                {busy === "refresh" ? "…" : "وضعیت وب‌هوک"}
              </button>
              <button
                type="button"
                onClick={() => void disconnect()}
                disabled={busy !== null || bot.status === "disconnected"}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-60"
              >
                {busy === "disconnect" ? "…" : "قطع وب‌هوک"}
              </button>
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">قالب گفتگو</h2>
            <p className="mt-1 text-sm leading-7 text-slate-500">
              متن‌ها روی همین ربات است، نه زیر یک آزمون. جانشینی مثل {"{service}"} بدون اجرای کد.
              {service === "analyzers" ? " رضایت و خلاصهٔ هر آزمون از pack همان آزمون می‌ماند." : ""}
            </p>
          </div>
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-slate-800">کلیدهای ربات</legend>
            <p className="text-xs leading-6 text-slate-500">
              منوی اسلش تلگرام و دکمه‌های پایین چت. شروع مجدد نوبت تازه می‌سازد؛ نوبت قبلی در پاسخ‌ها می‌ماند.
            </p>
            <ul className="space-y-3">
              {script.keys.map((key) => (
                <li key={key.id} className="space-y-2 rounded-xl border border-slate-200 p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block text-slate-600">عنوان دکمه</span>
                      <input
                        className={fieldClass}
                        value={key.labelFa}
                        onChange={(event) => patchKey(key.id, { labelFa: event.target.value })}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-slate-600">کار</span>
                      <select
                        className={fieldClass}
                        value={key.action}
                        onChange={(event) => patchKey(key.id, { action: event.target.value as BotKeyAction })}
                      >
                        {BOT_KEY_ACTION_OPTIONS.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.labelFa}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-slate-600">دستور منو (بدون /)</span>
                      <input
                        className={fieldClass}
                        dir="ltr"
                        value={key.command}
                        onChange={(event) => patchKey(key.id, { command: event.target.value })}
                        placeholder="restart"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-slate-600">شرح منو</span>
                      <input
                        className={fieldClass}
                        value={key.descriptionFa}
                        onChange={(event) => patchKey(key.id, { descriptionFa: event.target.value })}
                      />
                    </label>
                  </div>
                  {key.action === "reply" ? (
                    <label className="block text-sm">
                      <span className="mb-1 block text-slate-600">متن پاسخ</span>
                      <textarea
                        className={`${fieldClass} min-h-20`}
                        value={key.replyFa}
                        onChange={(event) => patchKey(key.id, { replyFa: event.target.value })}
                      />
                    </label>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={key.inKeyboard}
                        onChange={(event) => patchKey(key.id, { inKeyboard: event.target.checked })}
                      />
                      دکمه پایین چت
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={key.inMenu}
                        onChange={(event) => patchKey(key.id, { inMenu: event.target.checked })}
                      />
                      منوی /
                    </label>
                    <button type="button" className="text-red-700" onClick={() => removeKey(key.id)}>
                      حذف
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={addKey}
              disabled={script.keys.length >= 20}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-60"
            >
              کلید تازه
            </button>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-800">جریان</legend>
            {BOT_FLOW_FIELDS.filter((field) => !field.services || field.services.includes(service)).map((field) => (
              <label key={field.id} className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={script.flow[field.id]}
                  onChange={(event) => setFlow(field.id, event.target.checked)}
                />
                <span>{field.labelFa}</span>
              </label>
            ))}
          </fieldset>
          <div className="space-y-4">
            {BOT_TEXT_FIELDS.filter(
              (field) => service === "analyzers" || !ANALYZER_TEXT_IDS.includes(field.id),
            ).map((field) => (
              <label key={field.id} className="block text-sm">
                <span className="mb-1 block text-slate-600">
                  {field.labelFa}
                  {field.hintFa ? <span className="mr-2 text-xs text-slate-400">{field.hintFa}</span> : null}
                </span>
                {field.id === "policy" || field.id === "welcome" || field.id === "help" || field.id === "passwordLink" ? (
                  <textarea
                    className={`${fieldClass} min-h-28`}
                    value={script.texts[field.id]}
                    onChange={(event) => setText(field.id, event.target.value)}
                  />
                ) : (
                  <input
                    className={fieldClass}
                    value={script.texts[field.id]}
                    onChange={(event) => setText(field.id, event.target.value)}
                  />
                )}
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void saveSettings()}
            disabled={busy !== null}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy === "save" ? "در حال ذخیره…" : "ذخیرهٔ گفتگو"}
          </button>
          {saved ? <p className="text-sm text-teal-800">تنظیمات ذخیره شد.</p> : null}
        </section>
      )}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button type="button" onClick={() => void remove()} className="text-sm text-red-700" disabled={busy !== null}>
        حذف ربات
      </button>
    </div>
  );
}
