"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";

export function PromoteButton({
  recordId,
  alreadyPublic = false,
}: {
  recordId: string;
  alreadyPublic?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [error, setError] = useState<string | null>(null);

  async function promote() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspace/records/${recordId}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility }),
      });
      const data = (await res.json()) as { error?: string; slug?: string };
      if (!res.ok) {
        setError(
          data.error === "revision_conflict"
            ? "صفحهٔ عمومی از وقتی که باز کردید عوض شده. تازه کنید و دوباره منتشر کنید."
            : data.error || "انتشار نشد.",
        );
        return;
      }
      router.refresh();
      if (data.slug && visibility === "public") {
        router.push(`/knowledge/${data.slug}`);
      }
    } catch {
      setError("انتشار نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
      <p className="text-sm leading-7 text-slate-700">
        ذخیره هنوز انتشار نیست. انتشار، همین مطلب را در باغ دانش عمومی می‌کند — نه محصولی جدا.
        {alreadyPublic ? " اگر از قبل عمومی است، همین دکمه صفحهٔ عمومی را از روی این مطلب به‌روز می‌کند." : ""}
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={visibility === "public"}
          onChange={(e) => setVisibility(e.target.checked ? "public" : "private")}
        />
        دیدپذیری عمومی
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={() => void promote()}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {alreadyPublic ? "به‌روز کردن انتشار" : "انتشار"}
      </button>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
