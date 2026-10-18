"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BotView } from "@/lib/bots/types";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400";

const statusFa: Record<BotView["status"], string> = {
  disconnected: "قطع",
  connected: "متصل",
  paused: "متوقف",
  error: "خطا",
};

export function BotEditor({
  initial,
  analyzers,
}: {
  initial: BotView;
  analyzers: { slug: string; nameFa: string }[];
}) {
  const router = useRouter();
  const [bot, setBot] = useState(initial);
  const [titleFa, setTitleFa] = useState(initial.titleFa);
  const [analyzerSlug, setAnalyzerSlug] = useState(initial.analyzerSlug ?? "casio-ss");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
        body: JSON.stringify({ titleFa, analyzerSlug }),
      });
      const next = await parse(res);
      setBot(next);
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

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <p className="text-sm text-slate-500">
          وضعیت: <span className="font-medium text-slate-900">{statusFa[bot.status]}</span>
          {bot.telegramUsername ? ` · @${bot.telegramUsername}` : ""}
          {bot.tokenHint ? ` · توکن ‎••••${bot.tokenHint}` : ""}
        </p>
        {bot.lastError ? <p className="text-sm text-red-700">{bot.lastError}</p> : null}
        {bot.lastWebhookAt ? (
          <p className="text-xs text-slate-500">
            آخرین پیام وب‌هوک: {new Date(bot.lastWebhookAt).toLocaleString("fa-IR")}
            {bot.lastUpdateKind ? ` · ${bot.lastUpdateKind}` : ""}
            {bot.pendingUpdateCount != null ? ` · در صف: ${bot.pendingUpdateCount.toLocaleString("fa-IR")}` : ""}
          </p>
        ) : (
          <p className="text-xs text-slate-500">هنوز به‌روزرسانی از تلگرام نیامده. در ربات /start بزنید.</p>
        )}
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
          <span className="mb-1 block text-slate-600">کانال</span>
          <select className={fieldClass} disabled value="telegram">
            <option value="telegram">تلگرام</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">آزمون</span>
          <select className={fieldClass} value={analyzerSlug} onChange={(event) => setAnalyzerSlug(event.target.value)}>
            {analyzers.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.nameFa} ({item.slug})
              </option>
            ))}
          </select>
        </label>
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

      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
        <h2 className="text-base font-bold text-slate-900">گفتگوی ربات</h2>
        <ol className="list-decimal space-y-1 pr-5 text-sm leading-7 text-slate-600">
          <li>/start → معرفی کوتاه + متن رضایت و دکمهٔ قبول</li>
          <li>ارسال شمارهٔ خودتان با دکمه</li>
          <li>کد معرف اختیاری یا «رد»</li>
          <li>سؤال‌ها یکی‌یکی؛ ۰ راست، ۱۰ چپ</li>
          <li>جمع‌بندی در همان چت؛ گزارش کامل بعد از ورود با همین شماره</li>
        </ol>
        <p className="text-xs leading-6 text-slate-500">
          اگر /start زد و هیچ متنی نیامد: اول «وضعیت وب‌هوک»، بعد اتصال دوباره. منوی ربات (/start و /help) هنگام اتصال ثبت می‌شود.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">اتصال تلگرام</h2>
        <ol className="list-decimal space-y-1 pr-5 text-sm leading-7 text-slate-600">
          <li>در تلگرام به @BotFather بروید و /newbot بزنید.</li>
          <li>توکن را فقط در این کادر بگذارید؛ در گیت و چت نگذارید.</li>
          <li>اتصال، getMe و setWebhook با secret_token را می‌زند. polling استفاده نمی‌شود.</li>
          <li>
            سرور لیارا داخل ایران به api.telegram.org نمی‌رسد؛ خروجی از Worker کلودفلر می‌رود
            (متغیر TELEGRAM_API_BASE روی لیارا، نه گیت). وب‌هوک ورودی مستقیم به هادیران است.
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
        <p className="text-xs leading-6 text-slate-500 break-all">
          آدرس وب‌هوک: {bot.webhookUrl}
        </p>
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

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button type="button" onClick={() => void remove()} className="text-sm text-red-700" disabled={busy !== null}>
        حذف ربات
      </button>
    </div>
  );
}
