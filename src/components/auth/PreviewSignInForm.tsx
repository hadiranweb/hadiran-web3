"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { PREVIEW_SESSION_KEY } from "@/lib/auth/preview-client";
import { normalizeDigits } from "@/lib/auth/phone";
import { Loader2, Phone, Lock, RefreshCw } from "lucide-react";

type Step = "phone" | "code";

function persianError(code: string) {
  const map: Record<string, string> = {
    invalid_phone: "شمارهٔ موبایل ایرانی معتبر نیست.",
    invalid_code: "کد باید ۶ رقم باشد.",
    invalid_or_expired_code: "کد نامعتبر یا منقضی است.",
    rate_limit_exceeded: "تعداد تلاش بیش از حد است. کمی صبر کنید.",
    sms_provider_not_configured: "پنل پیامک هنوز تنظیم نشده است.",
    sms_provider_failed: "ارسال پیامک الان ممکن نیست. کمی بعد دوباره تلاش کنید.",
    account_disabled: "این حساب غیرفعال است.",
    otp_send_failed: "ارسال کد ناموفق بود.",
    otp_verify_failed: "تأیید کد ناموفق بود.",
    session_not_saved: "نشست ورود واقعی برقرار نشد. برای ورود تستی، نسخهٔ P3 باید در بالای فرم دیده شود.",
    preview_grant_missing: "مجوز ورود آزمایشی در پاسخ سرور نبود (P3-01). لطفاً از همین پیام اسکرین‌شات بفرستید.",
  };
  return map[code] || "خطایی رخ داد. دوباره تلاش کنید.";
}

export function PreviewSignInForm({ previewLogin = false }: { previewLogin?: boolean }) {
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") || "";
  const nextPath = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("\\") && !rawNext.startsWith("/signin") ? rawNext : "";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [masked, setMasked] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (!resendSeconds) return;
    const timer = window.setInterval(() => setResendSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  useEffect(() => {
    let cancelled = false;
    let ticket = "";
    try { ticket = sessionStorage.getItem(PREVIEW_SESSION_KEY) || ""; } catch {}
    if (!ticket) return;
    void (async () => {
      try {
        const response = await fetch("/api/auth/preview-session", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticket }) });
        const data = await response.json() as { account?: { role: string } | null };
        if (cancelled) return;
        if (!response.ok || data.account?.role !== "owner") {
          try { sessionStorage.removeItem(PREVIEW_SESSION_KEY); } catch {}
          return;
        }
        const target = /^\/(workspace|account|analyzers|shop)(\/|\?|$)/.test(nextPath) ? nextPath : "/workspace";
        const destination = new URL(target, window.location.origin);
        destination.searchParams.set("preview_access", ticket);
        window.location.replace(destination.pathname + destination.search);
      } catch { /* The normal OTP form remains available when recovery fails. */ }
    })();
    return () => { cancelled = true; };
  }, [nextPath]);

  async function sendCode() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as {
        error?: string;
        expires_in_seconds?: number;
        masked_phone?: string;
        dev_code?: string;
        retry_after_seconds?: number;
      };
      if (!res.ok) throw new Error(data.error || "otp_send_failed");
      setMasked(data.masked_phone || "");
      setDevCode(data.dev_code || null);
      setStep("code");
      setResendSeconds(Math.min(60, data.expires_in_seconds || 60));
      setCode("");
    } catch (err) {
      setError(persianError(err instanceof Error ? err.message : ""));
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyCode() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/otp/verify?v=P3", {
        cache: "no-store",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = (await res.json()) as { error?: string; account?: { role: string }; preview_ticket?: string | null };
      if (!res.ok) throw new Error(data.error || "otp_verify_failed");
      let previewTicket = "";
      let session: { account?: { role: string } | null } = {};
      if (data.preview_ticket && data.account?.role === "owner") {
        // OTP already authenticated this grant. The destination validates its signature.
        // No cookie check or Authorization request is needed in an embedded preview.
        previewTicket = data.preview_ticket;
        session.account = data.account;
        try { sessionStorage.setItem(PREVIEW_SESSION_KEY, previewTicket); } catch {}
      } else {
        if (previewLogin) throw new Error("preview_grant_missing");
        const sessionResponse = await fetch("/api/auth/me", { cache: "no-store" });
        if (sessionResponse.ok) session = await sessionResponse.json();
        if (!session.account) throw new Error("session_not_saved");
      }
      const target = nextPath && nextPath !== "/" ? nextPath : session.account.role === "owner" ? "/workspace" : "/";
      const destination = new URL(target, window.location.origin);
      if (previewTicket) {
        if (!/^\/(workspace|account|analyzers|shop)(\/|$)/.test(destination.pathname)) destination.pathname = "/workspace";
        destination.searchParams.set("preview_access", previewTicket);
      }
      window.location.assign(destination.pathname + destination.search + destination.hash);
    } catch (err) {
      setError(persianError(err instanceof Error ? err.message : ""));
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (step === "phone") void sendCode();
    else void verifyCode();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block space-y-1.5">
        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <Phone className="h-3.5 w-3.5" />
          شمارهٔ موبایل
        </span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="۰۹۱۲۱۲۳۴۵۶۷"
          dir="ltr"
          type="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          disabled={step === "code" || submitting}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
        />
      </label>

      {step === "code" && (
        <label className="block space-y-1.5">
          <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <Lock className="h-3.5 w-3.5" />
            کد پیامک‌شده
          </span>
          <input
            value={code}
            onChange={(e) => setCode(normalizeDigits(e.target.value).replace(/\D/g, "").slice(0, 6))}
            placeholder="••••••"
            dir="ltr"
            required
            pattern="[0-9]{6}"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center font-mono text-lg tracking-[0.4em] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          {masked && (
            <span className="block text-xs text-slate-400">ارسال به {masked}</span>
          )}
          {devCode && (
            <span className="block rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              ورود آزمایشی؛ نیازی به پیامک نیست. کد: <strong dir="ltr">{devCode}</strong>
            </span>
          )}
        </label>
      )}

      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {step === "phone" ? "ارسال کد" : "ورود"}
      </button>

      {step === "code" && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
              setDevCode(null);
              setError(null);
            }}
            className="hover:text-indigo-600"
          >
            تغییر شماره
          </button>
          <button
            type="button"
            disabled={resendSeconds > 0 || submitting}
            onClick={() => void sendCode()}
            className="inline-flex items-center gap-1 disabled:opacity-40 hover:text-indigo-600"
          >
            <RefreshCw className="h-3 w-3" />
            {resendSeconds > 0 ? `ارسال دوباره (${resendSeconds})` : "ارسال دوباره"}
          </button>
        </div>
      )}
    </form>
  );
}
