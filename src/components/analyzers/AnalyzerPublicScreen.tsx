"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnalyzerRun } from "@/components/analyzers/AnalyzerRun";
import { SignInDialog } from "@/components/auth/SignInDialog";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import { publishAccount } from "@/lib/ui/draft";

export function AnalyzerPublicScreen({
  pack,
  signedIn,
  resume,
}: {
  pack: AnalyzerPack;
  signedIn: boolean;
  resume: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [running, setRunning] = useState(resume);
  const [authOpen, setAuthOpen] = useState(false);

  function start() {
    if (signedIn) {
      setRunning(true);
      return;
    }
    setAuthOpen(true);
  }

  function onAuthenticated() {
    publishAccount({});
    setAuthOpen(false);
    setRunning(true);
    router.refresh();
  }

  if (running) {
    return <AnalyzerRun pack={pack} />;
  }

  return (
    <>
      <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center py-8">
        <h1 className="text-3xl font-extrabold leading-[1.35] text-ink">{pack.nameFa}</h1>
        {pack.summaryFa ? <p className="mt-5 text-sm leading-7 text-muted">{pack.summaryFa}</p> : null}
        <dl className="mt-6 space-y-3 rounded-[var(--radius-md)] border border-line bg-elev p-4 text-sm leading-7">
          <div>
            <dt className="font-medium text-ink">همین حالا چه می‌گیری؟</dt>
            <dd className="text-muted">خلاصهٔ همین نوبت، رایگان و بی‌نیاز از پرداخت. پیش‌نویس‌ها عمومی نمی‌شوند.</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">چه چیزی خدمت جداست؟</dt>
            <dd className="text-muted">
              تفسیر کامل و سند چندصفحه محصول جدا برای همان نوبت‌اند؛ اگر آزمون‌ساز تعرفه گذاشته باشد، از صفحهٔ گزارش فعال
              می‌شوند. پرداخت بیرون سایت و تحویل بعد از تأیید است.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">این آزمون تشخیص پزشکی یا حکم قطعی نیست؟</dt>
            <dd className="text-muted">نه. تصویرِ همین نوبت است، نه برچسب دائمی و نه تصمیم به‌جای تو.</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={start}
          className="mt-8 inline-flex self-start rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg"
        >
          شروع کن
        </button>
      </section>
      <SignInDialog open={authOpen} onClose={() => setAuthOpen(false)} onAuthenticated={onAuthenticated} nextPath={pathname} />
    </>
  );
}
