"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";

export function PromoteButton({ recordId }: { recordId: string }) {
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
        setError(data.error || "ارتقا نشد.");
        return;
      }
      router.refresh();
      if (data.slug && visibility === "public") {
        router.push(`/knowledge/${data.slug}`);
      }
    } catch {
      setError("ارتقا نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
      <p className="text-sm text-slate-700">
        ذخیره دانش نیست. ارتقا، ادعا و بازبینی می‌سازد و در صورت عمومی بودن، صفحهٔ دانشنامه را به‌عنوان نمود می‌نویسد.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={visibility === "public"}
          onChange={(e) => setVisibility(e.target.checked ? "public" : "private")}
        />
        انتشار عمومی روی /knowledge
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={() => void promote()}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        ارتقا / انتشار
      </button>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
