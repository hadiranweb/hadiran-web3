"use client";

import { useState } from "react";
import { Link2, Printer } from "lucide-react";

/** Product-intro tools; product pages are not lists, so a small island is fine here. */
export function SharePrint({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="print:hidden mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
      <button type="button" onClick={() => window.print()} className="ws-button min-h-9 px-3 py-1">
        <Printer className="h-3.5 w-3.5" strokeWidth={1.5} />
        چاپ مشخصات
      </button>
      <button type="button" onClick={() => void copy()} className="ws-button min-h-9 px-3 py-1">
        <Link2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        {copied ? "پیوند رونوشت شد" : "رونوشت پیوند"}
      </button>
      <span className="sr-only" aria-live="polite">
        {title}
      </span>
    </div>
  );
}
