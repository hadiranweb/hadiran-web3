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
import type { ChromeCopy } from "@/lib/content/registry";

function ExamChrome({ copy }: { copy: ChromeCopy }) {
  return (
    <header className="print-hide sticky top-0 z-50 border-b border-line bg-paper/95 print:hidden">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2">
        <Link href="/analyzers" className="brand-link inline-flex items-center gap-2 text-muted hover:text-ink" aria-label={copy.rooms.mirrors.label}>
          <HadiranMark className="brand-mark h-7 w-7" />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <SessionMenu />
        </div>
      </div>
    </header>
  );
}

export function SiteChrome({ children, copy }: { children: ReactNode; copy: ChromeCopy }) {
  const pathname = usePathname();
  const exam = isAnalyzerExamPath(pathname);
  const workspace = pathname.startsWith("/workspace");
  return (
    <>
      {exam ? <ExamChrome copy={copy} /> : workspace ? null : <Nav copy={copy} />}
      <div className="flex-1">{children}</div>
      {exam || workspace ? null : <Footer copy={copy} />}
    </>
  );
}
