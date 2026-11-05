"use client";

import Link from "@/components/workspace/WorkspaceLink";
import { ArrowLeft, ArrowUpLeft, Layers3, LockKeyhole, ScanLine } from "lucide-react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnalyzerRun } from "@/components/analyzers/AnalyzerRun";
import { SignInDialog } from "@/components/auth/SignInDialog";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import { AssessmentPractice, AssessmentSectionMap } from "@/components/landing/AssessmentPreparation";
import { publishAccount } from "@/lib/ui/draft";

export function AnalyzerPublicScreen({
  pack,
  signedIn,
  resume,
  previewLogin = false,
}: {
  pack: AnalyzerPack;
  signedIn: boolean;
  resume: boolean;
  previewLogin?: boolean;
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
    if (previewLogin) {
      router.push(`/signin?next=${encodeURIComponent(pathname)}`);
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
    return <div className="mx-auto max-w-3xl"><AnalyzerRun pack={pack} /></div>;
  }

  return (
    <>
      <div className="lp-analyzer-landing">
        <Link href="/analyzers" className="lp-text-link"><ArrowLeft size={16} /> همهٔ آینه‌ها</Link>
        <section className="lp-analyzer-hero"><div><span className="lp-eyebrow">آینه‌های هادیران / یک نگاه روشن‌تر</span><h1>{pack.nameFa}</h1>{pack.summaryFa && <p className="lp-lede">{pack.summaryFa}</p>}<div className="lp-analyzer-actions"><button type="button" onClick={start} className="lp-button">شروع ارزیابی <ArrowLeft size={18} /></button><AssessmentPractice pack={pack} onStart={start} /><a href="#assessment-about" className="lp-text-link">پیش از شروع، بیشتر بدان</a></div><p className="lp-action-note">اجرای آزمون و خلاصهٔ نتیجه رایگان است.</p></div><div className="lp-mirror-art" aria-hidden="true"><svg viewBox="0 0 480 480" fill="none"><path d="M85 390V215a155 155 0 0 1 310 0v175" stroke="currentColor" strokeWidth="1.2"/><path d="M112 390V218a128 128 0 0 1 256 0v172" stroke="currentColor" strokeWidth=".8" opacity=".5"/><path d="M139 390V220a101 101 0 0 1 202 0v170" stroke="currentColor" opacity=".3"/><path d="M240 90v300M85 272h310" stroke="currentColor" opacity=".2"/><circle cx="240" cy="240" r="53" stroke="currentColor"/><path d="M225 240h30m-15-15v30" stroke="currentColor"/><path d="M60 390h360" stroke="currentColor" strokeWidth="1.2"/><circle cx="240" cy="90" r="5" fill="currentColor"/></svg><span>شناختن، از دیدن شروع می‌شود.</span></div></section>
        <div className="lp-assessment-facts"><div><span>ساختار ارزیابی</span><strong>{pack.sections.length.toLocaleString("fa-IR")} بخش</strong></div><div><span>تعداد پرسش‌ها</span><strong>{pack.sections.reduce((n, section) => n + section.items.length, 0).toLocaleString("fa-IR")} پرسش</strong></div><div><span>مقیاس پاسخ</span><strong>۰ تا ۱۰</strong></div><div><span>هزینهٔ اجرا و خلاصه</span><strong>رایگان</strong></div></div>
        <section className="lp-assessment-about" id="assessment-about"><div><span className="lp-eyebrow">قبل از شروع</span><h2>یک مکث برای دیدن؛<br />نه قضاوت کردن.</h2></div><div><p>پاسخ‌ها را بر اساس تجربهٔ واقعی این روزهایت بنویس. خروجی این ارزیابی یک راهنمای کلی برای تأمل و گفت‌وگو است، نه تشخیص یا حکم قطعی.</p><div className="lp-assessment-points"><div><ScanLine size={21} /><span>از تجربهٔ خودت شروع کن</span><p>به جای پاسخ ایده‌آل، آنچه واقعاً تجربه می‌کنی را انتخاب کن.</p></div><div><Layers3 size={21} /><span>نتیجه را در زمینه بخوان</span><p>خلاصهٔ نتیجه نقطهٔ شروع است؛ تفسیر تفصیلی و سند مستقل، محصولات جدا هستند.</p></div><div><LockKeyhole size={21} /><span>با آگاهی از حریم خصوصی</span><p>پیش از پاسخ‌گویی، متن رضایت را می‌بینی و انتخاب می‌کنی که ادامه بدهی.</p></div></div><Link href="/privacy" className="lp-text-link">حریم خصوصی <ArrowUpLeft size={16} /></Link></div></section>
        <AssessmentSectionMap pack={pack} />
        <div className="lp-assessment-end"><h2>از همین‌جایی که هستی، شروع کن.</h2><button type="button" onClick={start} className="lp-button">شروع ارزیابی <ArrowLeft size={18} /></button></div>
      </div>
      <SignInDialog open={authOpen} onClose={() => setAuthOpen(false)} onAuthenticated={onAuthenticated} nextPath={pathname} />
    </>
  );
}
