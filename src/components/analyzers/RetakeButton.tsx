"use client";

import { previewFetch as fetch } from "@/lib/auth/preview-fetch";
import { withPreviewAccess } from "@/lib/auth/preview-url";
import { PREVIEW_SESSION_KEY } from "@/lib/auth/preview-client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function RetakeButton({
  api,
  href,
}: {
  api: string;
  href: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setBusy(true);
    setError(null);
    const res = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "retake" }),
    });
    setBusy(false);
    if (res.status === 401) {
      router.push(`/signin?next=${encodeURIComponent(href)}`);
      return;
    }
    if (!res.ok) {
      setError("نوبت تازه شروع نشد.");
      return;
    }
    let ticket = "";
    try { ticket = sessionStorage.getItem(PREVIEW_SESSION_KEY) || ""; } catch {}
    router.push(withPreviewAccess(href, ticket));
    router.refresh();
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={busy}
        className="inline-flex rounded-[var(--radius-md)] border border-line px-4 py-2 text-sm font-medium text-ink disabled:opacity-60"
      >
        {busy ? "در حال شروع…" : "نوبت تازه"}
      </button>
      {error ? <p className="mt-2 text-sm text-mark">{error}</p> : null}
    </div>
  );
}
