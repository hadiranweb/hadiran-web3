"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { HadiranMark } from "@/components/HadiranMark";
import { Nav } from "@/components/Nav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SessionMenu } from "@/components/auth/SessionMenu";
import { isAnalyzerExamPath } from "@/lib/analyzers/paths";

function ExamChrome() {
  return (
    <header className="print-hide sticky top-0 z-50 border-b border-line bg-paper/95 print:hidden">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2">
        <Link href="/analyzers" className="inline-flex items-center gap-2 text-muted hover:text-ink" aria-label="آینه‌ها">
          <HadiranMark className="h-7 w-7" />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <SessionMenu />
        </div>
      </div>
    </header>
  );
}

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const exam = isAnalyzerExamPath(pathname);
  return (
    <>
      {exam ? <ExamChrome /> : <Nav />}
      <div className="flex-1">{children}</div>
      {exam ? null : <Footer />}
    </>
  );
}
