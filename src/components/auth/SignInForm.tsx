"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, Lock, RefreshCw } from "lucide-react";
import { publishAccount } from "@/lib/ui/draft";

type Step = "phone" | "password" | "code";

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

const fieldClass =
  "w-full rounded-[var(--radius-md)] border border-line bg-elev px-4 py-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-60";
const primaryBtn =
  "inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-accent px-4 py-3 text-sm font-medium text-accent-fg hover:opacity-95 disabled:opacity-60";

export function SignInForm({
  nextPath = "/",
  onAuthenticated,
  hideHint = false,
}: {
  nextPath?: string;
  onAuthenticated?: () => void;
  hideHint?: boolean;
}) {
  const router = useRouter();
  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [masked, setMasked] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);

  async function loadStatusHint() {
    if (hideHint) return;
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

  function finish() {
    publishAccount({});
    if (onAuthenticated) {
      onAuthenticated();
      return;
    }
    router.push(safeNext);
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
      finish();
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
      finish();
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
    else void verifyCode();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block space-y-1.5">
        <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
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
          className={`${fieldClass} text-left`}
        />
      </label>

      {step === "password" && (
        <label className="block space-y-1.5">
          <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <Lock className="h-3.5 w-3.5" />
            رمز عبور
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="رمز حساب"
            autoComplete="current-password"
            className={fieldClass}
          />
          {masked && <span className="block text-xs text-muted">ورود برای {masked}</span>}
        </label>
      )}

      {step === "code" && (
        <label className="block space-y-1.5">
          <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
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
            className={`${fieldClass} text-center font-mono text-lg tracking-[0.4em]`}
          />
          {masked && <span className="block text-xs text-muted">ارسال به {masked}</span>}
          {devCode && (
            <span className="block rounded-[var(--radius-sm)] bg-accent-soft px-3 py-2 text-xs text-ink">
              حالت توسعه: پنل SMS.ir تنظیم نیست. کد: <strong dir="ltr">{devCode}</strong>
            </span>
          )}
        </label>
      )}

      {error && <p className="text-sm text-mark">{error}</p>}
      {!hideHint && hint && <p className="text-xs leading-6 text-muted">{hint}</p>}

      {step === "password" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="submit" disabled={submitting || !password} className={primaryBtn}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            ورود
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void sendCode()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line bg-elev px-4 py-3 text-sm font-medium text-ink disabled:opacity-60"
          >
            ارسال رمز یکبار مصرف
          </button>
        </div>
      ) : (
        <button type="submit" disabled={submitting} className={primaryBtn}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {step === "phone" ? "ادامه" : "ورود"}
        </button>
      )}

      {(step === "password" || step === "code") && (
        <div className="flex items-center justify-between text-xs text-muted">
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
              setPassword("");
              setDevCode(null);
              setError(null);
            }}
            className="hover:text-ink"
          >
            تغییر شماره
          </button>
          {step === "code" && (
            <button
              type="button"
              disabled={resendSeconds > 0 || submitting}
              onClick={() => void sendCode()}
              className="inline-flex items-center gap-1 hover:text-ink disabled:opacity-40"
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
