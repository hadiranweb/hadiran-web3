"use client";

import Link from "next/link";

export function DocumentToolbar({
  backHref,
  backLabel = "بازگشت به تفسیر",
}: {
  backHref: string;
  backLabel?: string;
}) {
  return (
    <div className="print:hidden mb-6 flex flex-wrap items-center justify-between gap-3">
      <Link href={backHref} className="text-sm text-slate-500 hover:text-indigo-700">
        {backLabel}
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
      >
        چاپ / ذخیره از مرورگر
      </button>
    </div>
  );
}
