"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { privacySummary } from "@/lib/privacy/content";
import { clearDraft, publishAccount, readDraft, subscribeAccount, writeDraft } from "@/lib/ui/draft";

const fieldClass =
  "w-full rounded-[var(--radius-md)] border border-line bg-elev px-4 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

function persianError(code: string) {
  const map: Record<string, string> = {
    policies_not_accepted: "برای ادامه باید شرایط را بپذیرید.",
    policies_required: "ابتدا شرایط را بپذیرید.",
    invalid_given_name: "نام را وارد کنید (حداکثر ۶۴ نویسه).",
    invalid_family_name: "نام خانوادگی را وارد کنید (حداکثر ۶۴ نویسه).",
    invalid_referral: "کد معرف هشت رقم است.",
    unknown_referral: "این کد معرف پیدا نشد.",
    self_referral: "نمی‌توانید کد خودتان را بزنید.",
    referral_cycle: "این کد یک حلقه می‌سازد.",
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
  const [referralCode, setReferralCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === "/signin" || pathname === "/privacy") {
      // در این دو مسیر دیالوگ اصلاً باز نمی‌شود؛ وضعیت بعد از mount تعیین می‌شود.
      /* eslint-disable react-hooks/set-state-in-effect */
      setOpen(false);
      setReady(true);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    let cancelled = false;
    function load() {
      fetch("/api/auth/me", { cache: "no-store" })
        .then(async (res) => {
          if (!res.ok) return null;
          return (await res.json()) as {
            account: {
              onboardingComplete?: boolean;
              policiesAccepted?: boolean;
              needsProfile?: boolean;
              givenName?: string | null;
              familyName?: string | null;
            } | null;
          };
        })
        .then((data) => {
          if (cancelled) return;
          const account = data?.account;
          const needsProfile =
            account?.needsProfile ?? (!account?.givenName?.trim() || !account?.familyName?.trim());
          const needsPolicies = account ? account.policiesAccepted !== true : false;
          if (!account || (!needsPolicies && !needsProfile)) {
            setOpen(false);
            setReady(true);
            return;
          }
          const draft = readDraft<{ givenName?: string; familyName?: string; referralCode?: string }>("onboarding-profile");
          setGivenName(draft?.givenName || account.givenName || "");
          setFamilyName(draft?.familyName || account.familyName || "");
          const storedRef = typeof window !== "undefined" ? sessionStorage.getItem("hadiran-ref") : null;
          setReferralCode(draft?.referralCode || storedRef || "");
          setStep(needsPolicies ? "policies" : "profile");
          setOpen(true);
          setReady(true);
        })
        .catch(() => {
          if (!cancelled) {
            setOpen(false);
            setReady(true);
          }
        });
    }
    load();
    const stop = subscribeAccount(() => load());
    return () => {
      cancelled = true;
      stop();
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

  useEffect(() => {
    if (!ready || !open || step !== "profile") return;
    if (!givenName.trim() && !familyName.trim()) {
      clearDraft("onboarding-profile");
      return;
    }
    writeDraft("onboarding-profile", { givenName, familyName, referralCode });
  }, [ready, open, step, givenName, familyName, referralCode]);

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
      const data = (await res.json()) as { error?: string; needsProfile?: boolean };
      if (!res.ok) throw new Error(data.error || "save_failed");
      if (data.needsProfile || !givenName.trim() || !familyName.trim()) {
        setStep("profile");
        return;
      }
      setOpen(false);
      router.refresh();
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
        body: JSON.stringify({ step: "profile", givenName, familyName, referralCode: referralCode.trim() || undefined }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "save_failed");
      clearDraft("onboarding-profile");
      publishAccount({
        givenName,
        familyName,
        displayName: `${givenName.trim()} ${familyName.trim()}`.trim(),
      });
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
              <p className="mt-4 text-sm leading-7 text-muted">{privacySummary}</p>
              <p className="mt-4 text-sm leading-7">
                <Link href="/privacy" className="font-medium text-accent hover:text-ink">
                  برای مطالعه بیشتر
                </Link>
              </p>
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
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-ink">کد معرف (اختیاری)</span>
                  <input
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    maxLength={8}
                    inputMode="numeric"
                    dir="ltr"
                    className={fieldClass}
                    placeholder="۸ رقم"
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
