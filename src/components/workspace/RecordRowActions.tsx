"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2 } from "lucide-react";

export function RecordRowActions({
  id,
  title,
  afterDelete = "/workspace/knowledge",
  phase,
  publicUrl,
}: {
  id: string;
  title?: string;
  afterDelete?: string;
  phase?: "draft" | "review" | "published" | "archived";
  publicUrl?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canDelete = !phase || phase === "draft";

  async function remove() {
    const label = title?.trim() || "این نوشته";
    if (!canDelete) {
      setError("ابتدا لغو انتشار یا بایگانی کنید.");
      return;
    }
    if (!window.confirm(`پیش‌نویس «${label}» حذف شود؟ این کار برگشت ندارد.`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/workspace/records/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error === "unpublish_or_archive_first" ? "ابتدا لغو انتشار یا بایگانی کنید." : "حذف انجام نشد.");
        setBusy(false);
        return;
      }
      router.push(afterDelete);
      router.refresh();
    } catch {
      setError("حذف انجام نشد.");
      setBusy(false);
    }
  }

  return (
    <span className="ws-row-actions">
      <Link href={`/workspace/records/${id}`} className="ws-icon-button" aria-label="ویرایش مطلب">
        <Pencil className="h-4 w-4" strokeWidth={1.6} />
      </Link>
      {publicUrl ? (
        <Link href={publicUrl} className="ws-icon-button" aria-label="مشاهدهٔ عمومی">
          <Eye className="h-4 w-4" strokeWidth={1.6} />
        </Link>
      ) : null}
      {canDelete ? (
        <button type="button" className="ws-icon-button" onClick={() => void remove()} disabled={busy} aria-label="حذف پیش‌نویس">
          <Trash2 className="h-4 w-4" strokeWidth={1.6} />
        </button>
      ) : null}
      {error ? (
        <span className="ws-muted" role="status">
          {error}
        </span>
      ) : null}
    </span>
  );
}
