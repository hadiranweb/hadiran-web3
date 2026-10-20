"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

export function RecordRowActions({
  id,
  title,
  afterDelete = "/workspace/knowledge",
}: {
  id: string;
  title?: string;
  afterDelete?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    const label = title?.trim() || "این نوشته";
    if (!window.confirm(`«${label}» از میز حذف شود؟ نمود عمومی باغ دانش اگر باشد سر جایش می‌ماند.`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/workspace/records/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      router.push(afterDelete);
      router.refresh();
    } catch {
      setError("حذف انجام نشد.");
      setBusy(false);
    }
  }

  return (
    <span className="ws-row-actions">
      <Link href={`/workspace/records/${id}`} className="ws-icon-button" aria-label="ویرایش نوشته">
        <Pencil className="h-4 w-4" strokeWidth={1.6} />
      </Link>
      <button type="button" className="ws-icon-button" onClick={() => void remove()} disabled={busy} aria-label="حذف نوشته">
        <Trash2 className="h-4 w-4" strokeWidth={1.6} />
      </button>
      {error ? (
        <span className="ws-muted" role="status">
          {error}
        </span>
      ) : null}
    </span>
  );
}
