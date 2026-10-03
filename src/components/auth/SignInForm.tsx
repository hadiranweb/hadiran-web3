"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Phone, Lock, RefreshCw, KeyRound } from "lucide-react";

type Step = "phone" | "password" | "code" | "setPassword";

function persianError(code: string) {
  const map: Record<string, string> = {
    invalid_phone: "شمارهٔ موبایل ایرانی معتبر نیست.",
    invalid_code: "کد باید ۶ رقم باشد.",
    invalid_or_expired_code: "کد نامعتبر یا منقضی است.",
    invalid_password: "رمز عبور درست نیست.",
    password_too_short: "رمز باید دست‌کم ۸ نویسه باشد.",
    password_too_long: "رمز خیلی بلند است.",
    password_has_space: "رمز نباید فاصله داشته باشد.",
    password_mismatch: "دو رمز یکی نیستند.",
    password_already_set: "برای این حساب قبلاً رمز گذاشته شده.",
    rate_limit_exceeded: "تعداد تلاش بیش از حد است. کمی صبر کنید.",
    sms_provider_not_configured: "کلید یا شناسهٔ قالب SMS.ir روی سرور ناقص است.",
    sms_provider_failed: "ارسال پیامک الان ممکن نیست. کمی بعد دوباره تلاش کنید.",
    sms_provider_timeout: "سرور به پنل پیامک نرسید (زمان‌تمام). از شبکهٔ لیارا به api.sms.ir باید راه باشد.",
    sms_provider_unreachable: "شبکه تا SMS.ir بسته است؛ دیتاسنتر ایران گاهی api.sms.ir را نمی‌بیند.",
    sms_provider_auth: "کلید API پیامک رد شد. SMSIR_API_KEY را روی لیارا چک کن.",
    sms_provider_rejected: "قالب Verify یا نام پارامتر (معمولاً CODE بدون #) با پنل SMS.ir یکی نیست.",
    account_disabled: "این حساب غیرفعال است.",
    otp_send_failed: "ارسال کد ناموفق بود.",
    lookup_failed: "چک شماره روی سرور شکست خورد. اگر مالک هستی و رمز لیارا ست است، همین شماره باید کادر رمز بیاورد.",
    otp_verify_failed: "تأیید کد ناموفق بود.",
    password_login_failed: "ورود با رمز ناموفق بود.",
    password_set_failed: "ذخیرهٔ رمز ناموفق بود.",
    unauthorized: "نشست منقضی شد. دوباره وارد شو.",
    jwt_not_configured: "ورود روی سرور کامل تنظیم نشده. کمی بعد دوباره تلاش کن.",
  };
  return map[code] || "خطایی رخ داد. دوباره تلاش کنید.";
}

async function readJson(res: Response) {
  return (await res.json()) as {
    error?: string;
    expires_in_seconds?: number;
    masked_phone?: string;
    dev_code?: string;
    retry_after_seconds?: number;
    has_password?: boolean;
    needs_password?: boolean;
  };
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") || "";
  const nextPath = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [masked, setMasked] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);

  async function loadStatusHint() {
    try {
      const res = await fetch("/api/auth/status", { cache: "no-store" });
      const data = (await res.json()) as {
        jwt?: boolean;
        sms?: boolean;
        owner_password?: boolean;
      };
      setHint(
        `سرور: JWT ${data.jwt ? "آماده" : "نیست"} · پیامک ${data.sms ? "کلید دارد" : "کلید ندارد"} · رمز مالک ${data.owner_password ? "ست شده" : "نیست"}`,
      );
    } catch {
      setHint(null);
    }
  }

  useEffect(() => {
    if (!resendSeconds) return;
    const timer = window.setInterval(() => setResendSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  function finish(needsPassword?: boolean) {
    if (needsPassword) {
      setStep("setPassword");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
      return;
    }
    router.push(nextPath);
    router.refresh();
  }

  async function lookupPhone() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ phone }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "otp_send_failed");
      setMasked(data.masked_phone || "");
      if (data.has_password) {
        setPassword("");
        setStep("password");
        return;
      }
      await sendCode();
    } catch (err) {
      setError(persianError(err instanceof Error ? err.message : ""));
      void loadStatusHint();
    } finally {
      setSubmitting(false);
    }
  }

  async function sendCode() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ phone }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "otp_send_failed");
      setMasked(data.masked_phone || "");
      setDevCode(data.dev_code || null);
      setStep("code");
      setResendSeconds(Math.min(60, data.expires_in_seconds || 60));
      setCode("");
    } catch (err) {
      setError(persianError(err instanceof Error ? err.message : ""));
      void loadStatusHint();
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
        cache: "no-store",
        body: JSON.stringify({ phone, code }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "otp_verify_failed");
      finish(data.needs_password);
    } catch (err) {
      setError(persianError(err instanceof Error ? err.message : ""));
    } finally {
      setSubmitting(false);
    }
  }

  async function loginWithPassword() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/password/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ phone, password }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "password_login_failed");
      finish(data.needs_password);
    } catch (err) {
      setError(persianError(err instanceof Error ? err.message : ""));
    } finally {
      setSubmitting(false);
    }
  }

  async function savePassword() {
    setError(null);
    if (newPassword !== confirmPassword) {
      setError(persianError("password_mismatch"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/password/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "password_set_failed");
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
    if (step === "phone") void lookupPhone();
    else if (step === "password") void loginWithPassword();
    else if (step === "code") void verifyCode();
    else void savePassword();
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
          disabled={step !== "phone" || submitting}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
        />
      </label>

      {step === "password" && (
        <label className="block space-y-1.5">
          <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <Lock className="h-3.5 w-3.5" />
            رمز عبور
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="رمز حساب"
            autoComplete="current-password"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          {masked && <span className="block text-xs text-slate-400">ورود برای {masked}</span>}
        </label>
      )}

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
          {masked && <span className="block text-xs text-slate-400">ارسال به {masked}</span>}
          {devCode && (
            <span className="block rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              حالت توسعه: پنل SMS.ir تنظیم نیست. کد: <strong dir="ltr">{devCode}</strong>
            </span>
          )}
        </label>
      )}

      {step === "setPassword" && (
        <div className="space-y-4">
          <p className="text-sm leading-7 text-slate-600">
            برای دفعات بعد یک رمز بگذار. رمز در دیتابیس هش می‌شود؛ سشن جداست و منقضی می‌شود.
          </p>
          <label className="block space-y-1.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <KeyRound className="h-3.5 w-3.5" />
              رمز جدید
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">تکرار رمز</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        </div>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}
      {hint && <p className="text-xs leading-6 text-slate-500">{hint}</p>}

      {step === "password" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="submit"
            disabled={submitting || !password}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            ورود
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void sendCode()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            ارسال رمز یکبار مصرف
          </button>
        </div>
      ) : (
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {step === "phone" ? "ادامه" : step === "code" ? "ورود" : "ذخیرهٔ رمز و ادامه"}
        </button>
      )}

      {(step === "password" || step === "code") && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
              setPassword("");
              setDevCode(null);
              setError(null);
            }}
            className="hover:text-indigo-600"
          >
            تغییر شماره
          </button>
          {step === "code" && (
            <button
              type="button"
              disabled={resendSeconds > 0 || submitting}
              onClick={() => void sendCode()}
              className="inline-flex items-center gap-1 hover:text-indigo-600 disabled:opacity-40"
            >
              <RefreshCw className="h-3 w-3" />
              {resendSeconds > 0 ? `ارسال دوباره (${resendSeconds})` : "ارسال دوباره"}
            </button>
          )}
        </div>
      )}
    </form>
  );
}
