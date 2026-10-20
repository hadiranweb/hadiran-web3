"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, EyeOff, Loader2, Trash2 } from "lucide-react";
import type { GardenPhase } from "@/lib/knowledge/garden-phase";

export function GardenLifecycle({
  recordId,
  title,
  phase,
  visibility,
  publicSlug,
}: {
  recordId: string;
  title: string;
  phase: GardenPhase;
  visibility: "private" | "public";
  publicSlug?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"unpublish" | "archive" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const publicUrl = phase === "published" && visibility === "public" && publicSlug ? `/knowledge/${publicSlug}` : null;

  async function post(path: string, kind: "unpublish" | "archive") {
    setBusy(kind);
    setError(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error === "not_published" ? "این مطلب منتشر نشده." : "انجام نشد.");
        return;
      }
      router.refresh();
    } catch {
      setError("انجام نشد.");
    } finally {
      setBusy(null);
    }
  }

  async function removeDraft() {
    if (!window.confirm(`پیش‌نویس «${title}» حذف شود؟ این کار برگشت ندارد.`)) return;
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch(`/api/workspace/records/${recordId}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error === "unpublish_or_archive_first" ? "ابتدا لغو انتشار یا بایگانی کنید." : "حذف نشد.");
        return;
      }
      router.push("/workspace/knowledge");
      router.refresh();
    } catch {
      setError("حذف نشد.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm leading-7 text-slate-600">
        انتشار وضعیت همین مطلب است. صفحهٔ عمومی خروجی است، نه نسخه‌ای جدا برای ویرایش.
      </p>
      {publicUrl ? (
        <Link href={publicUrl} className="text-sm text-indigo-800">
          مشاهده در باغ دانش عمومی
        </Link>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {phase === "published" && visibility === "public" ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void post(`/api/workspace/records/${recordId}/unpublish`, "unpublish")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 disabled:opacity-60"
          >
            {busy === "unpublish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4" />}
            لغو انتشار
          </button>
        ) : null}
        {phase !== "archived" ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void post(`/api/workspace/records/${recordId}/archive`, "archive")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 disabled:opacity-60"
          >
            {busy === "archive" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
            بایگانی
          </button>
        ) : (
          <p className="self-center text-sm text-slate-500">بایگانی شده.</p>
        )}
        {phase === "draft" ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void removeDraft()}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 disabled:opacity-60"
          >
            {busy === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            حذف پیش‌نویس
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
