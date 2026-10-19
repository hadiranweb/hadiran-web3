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
