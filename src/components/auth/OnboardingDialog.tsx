"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";

const fieldClass =
  "w-full rounded-[var(--radius-md)] border border-line bg-elev px-4 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

function persianError(code: string) {
  const map: Record<string, string> = {
    policies_not_accepted: "برای ادامه باید شرایط را بپذیرید.",
    policies_required: "ابتدا شرایط را بپذیرید.",
    invalid_given_name: "نام را وارد کنید (حداکثر ۶۴ نویسه).",
    invalid_family_name: "نام خانوادگی را وارد کنید (حداکثر ۶۴ نویسه).",
    unauthorized: "نشست منقضی شد. دوباره وارد شوید.",
    save_failed: "ذخیره نشد. دوباره تلاش کنید.",
  };
  return map[code] || "خطایی رخ داد.";
}

export function OnboardingDialog() {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"policies" | "profile">("policies");
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === "/signin") {
      setOpen(false);
      setReady(true);
      return;
    }
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as {
          account: {
            onboardingComplete?: boolean;
            policiesAccepted?: boolean;
            givenName?: string | null;
            familyName?: string | null;
          } | null;
        };
      })
      .then((data) => {
        if (cancelled) return;
        const account = data?.account;
        if (!account || account.onboardingComplete) {
          setOpen(false);
          setReady(true);
          return;
        }
        setGivenName(account.givenName || "");
        setFamilyName(account.familyName || "");
        setStep(account.policiesAccepted ? "profile" : "policies");
        setOpen(true);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setOpen(false);
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  async function acceptPolicies() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ step: "policies", accept: true }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "save_failed");
      setStep("profile");
    } catch (err) {
      setError(persianError(err instanceof Error ? err.message : "save_failed"));
    } finally {
      setSubmitting(false);
    }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ step: "profile", givenName, familyName }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "save_failed");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(persianError(err instanceof Error ? err.message : "save_failed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready || !open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[color-mix(in_srgb,var(--ink)_45%,transparent)] p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="surface flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col overflow-hidden"
        style={{ transition: "opacity var(--dur) var(--ease-studio)" }}
      >
        <p className="border-b border-line px-6 py-3 text-xs font-medium text-mark">
          {step === "policies" ? "گام ۱ از ۲" : "گام ۲ از ۲"}
        </p>

        {step === "policies" ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <h2 id="onboarding-title" className="text-xl font-bold leading-[1.7] text-ink">
                شرایط استفاده و حریم خصوصی
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-muted">
                <p>
                  با ساخت حساب در هادیران، شرایط زیر را می‌پذیرید. این متن نسخهٔ متعارف پذیرش حساب است، نه مشاورهٔ
                  حقوقی.
                </p>
                <div>
                  <h3 className="font-semibold text-ink">شرایط استفاده</h3>
                  <ul className="mt-2 list-disc space-y-1 ps-5">
                    <li>حساب برای استفادهٔ شخصی از خدمات هادیران است.</li>
                    <li>ورود با شمارهٔ موبایل ایرانی و کد یک‌بارمصرف انجام می‌شود؛ نگهداری رمز حساب با شماست.</li>
                    <li>اختلال در سرویس، جعل هویت، یا وارد کردن آگاهانهٔ دادهٔ نادرست مجاز نیست.</li>
                    <li>هادیران می‌تواند خدمت را تغییر دهد یا حساب ناقض را محدود کند.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-ink">حریم خصوصی</h3>
                  <ul className="mt-2 list-disc space-y-1 ps-5">
                    <li>شمارهٔ موبایل برای احراز هویت و ارسال کد ورود ذخیره می‌شود.</li>
                    <li>نام و نام‌خانوادگی روی حساب می‌ماند و در خدمات هادیران (از جمله تحلیلگر‌ها) استفاده می‌شود.</li>
                    <li>نشست با کوکی امن و غیرقابل‌خواندن برای جاوااسکریپت نگه داشته می‌شود.</li>
                    <li>داده را برای تبلیغات به دیگران نمی‌فروشیم.</li>
                    <li>برای ارسال پیامک، ارائه‌دهنده فقط شماره و کد را می‌بیند.</li>
                    <li>برای پرسش یا درخواست حذف حساب از صفحهٔ تماس استفاده کنید.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t border-line px-6 py-4">
              {error ? <p className="mb-3 text-sm text-mark">{error}</p> : null}
              <button
                type="button"
                onClick={() => void acceptPolicies()}
                disabled={submitting}
                className="inline-flex w-full justify-center rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg disabled:opacity-60"
              >
                {submitting ? "در حال ثبت…" : "قبول می‌کنم"}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={saveProfile} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <h2 id="onboarding-title" className="text-xl font-bold leading-[1.7] text-ink">
                نام شما
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                این نام روی حساب می‌ماند و بعداً در پروفایل قابل ویرایش است.
              </p>
              <div className="mt-5 space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-ink">نام</span>
                  <input
                    value={givenName}
                    onChange={(e) => setGivenName(e.target.value)}
                    maxLength={64}
                    autoComplete="given-name"
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-ink">نام خانوادگی</span>
                  <input
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    maxLength={64}
                    autoComplete="family-name"
                    required
                    className={fieldClass}
                  />
                </label>
              </div>
            </div>
            <div className="border-t border-line px-6 py-4">
              {error ? <p className="mb-3 text-sm text-mark">{error}</p> : null}
              <div className="flex flex-col gap-2 sm:flex-row-reverse">
                <button
                  type="submit"
                  disabled={submitting || !givenName.trim() || !familyName.trim()}
                  className="inline-flex flex-1 justify-center rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg disabled:opacity-60"
                >
                  {submitting ? "در حال ذخیره…" : "ادامه"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep("policies");
                  }}
                  className="inline-flex justify-center rounded-[var(--radius-md)] border border-line bg-elev px-5 py-2.5 text-sm font-medium text-ink"
                >
                  بازگشت
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
