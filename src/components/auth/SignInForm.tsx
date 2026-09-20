"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  };
  return map[code] || "خطایی رخ داد. دوباره تلاش کنید.";
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") || "";
  const nextPath = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

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
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "otp_verify_failed");
      router.push(nextPath);
      router.refresh();
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
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••••"
            dir="ltr"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center font-mono text-lg tracking-[0.4em] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          {masked && (
            <span className="block text-xs text-slate-400">ارسال به {masked}</span>
          )}
          {devCode && (
            <span className="block rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              حالت توسعه: پنل SMS.ir تنظیم نیست. کد: <strong dir="ltr">{devCode}</strong>
            </span>
          )}
        </label>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}

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
