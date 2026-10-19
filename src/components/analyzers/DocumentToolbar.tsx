"use client";

import Link from "@/components/workspace/WorkspaceLink";

export function DocumentToolbar({
  backHref,
  backLabel = "بازگشت به تفسیر",
}: {
  backHref: string;
  backLabel?: string;
}) {
  return (
    <div className="print:hidden mb-6 flex flex-wrap items-center justify-between gap-3">
      <Link href={backHref} className="text-sm text-muted hover:text-mark">
        {backLabel}
      </Link>
      <button
        type="button"
        onClick={() => { const frame=document.querySelector<HTMLIFrameElement>("iframe[data-document-surface]"); if(frame?.contentWindow){frame.contentWindow.focus();frame.contentWindow.print()}else{window.print()} }}
        className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
      >
        چاپ / ذخیره از مرورگر
      </button>
    </div>
  );
}
