"use client";

import { previewFetch as fetch } from "@/lib/auth/preview-fetch";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";

export function PromoteButton({ recordId, disabled = false, initialVisibility = "private" }: { recordId: string; disabled?: boolean; initialVisibility?: "public" | "private" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">(initialVisibility);
  const [success, setSuccess] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function promote() {
    if (disabled) return;
    setBusy(true);
    setError(null); setSuccess(false);
    try {
      const res = await fetch(`/api/workspace/records/${recordId}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility }),
      });
      const data = (await res.json()) as { error?: string; slug?: string; preview?: boolean };
      if (!res.ok) {
        setError(data.error || "ارتقا نشد.");
        return;
      }
      setSuccess(true); setPreviewOnly(!!data.preview);
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
    <div className="space-y-2 rounded-2xl border border-line bg-accent-soft p-4">
      <p className="text-sm text-ink">
        ذخیره دانش نیست. ارتقا، ادعا و بازبینی می‌سازد و در صورت عمومی بودن، صفحهٔ دانشنامه را به‌عنوان نمود می‌نویسد.
      </p>
      {disabled ? <p className="text-sm text-mark">ابتدا تغییرات متن را ذخیره کنید؛ ارتقا فقط روی نسخهٔ ذخیره‌شده انجام می‌شود.</p> : null}
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
        disabled={busy || disabled}
        onClick={() => void promote()}
        className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        ارتقا / انتشار
      </button>
      {success ? <p role="status" className="text-sm text-mark">{previewOnly ? "ارتقا فقط در نشست نمایشی شبیه‌سازی شد؛ هیچ صفحهٔ عمومی یا دادهٔ واقعی ساخته نشده است." : "بازبینی و ارتقا ثبت شد."}</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
