"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function StartOrderButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState("");

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, discountCode: discountCode.trim() || undefined }),
      });
      const data = (await res.json()) as { error?: string; id?: string };
      if (res.status === 401) {
        router.push(`/signin?next=${encodeURIComponent(`/shop/${slug}`)}`);
        return;
      }
      if (!res.ok) {
        const map: Record<string, string> = {
          owner_cannot_buy: "owner از خودش خرید نمی‌کند.",
          payout_not_configured: "مقصد دریافت هنوز تنظیم نشده.",
          already_entitled: "این کالا را قبلاً گرفته‌ای.",
          listing_unavailable: "این کالا در دسترس نیست.",
          invalid_discount: "کد تخفیف نامعتبر است.",
          unknown_discount: "کد تخفیف پیدا نشد.",
          discount_exhausted: "ظرفیت این کد تمام شده.",
          discount_scope: "این کد برای این کالا نیست.",
        };
        setError(map[data.error || ""] || "سفارش ساخته نشد.");
        return;
      }
      if (data.id) router.push(`/shop/orders/${data.id}`);
    } catch {
      setError("سفارش ساخته نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm">
        <span className="mb-1 block text-muted">کد تخفیف (اختیاری)</span>
        <input
          className="w-full rounded-[var(--radius-md)] border border-line bg-elev px-3 py-2 text-sm"
          dir="ltr"
          value={discountCode}
          onChange={(event) => setDiscountCode(event.target.value)}
          placeholder="HADI20"
        />
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={() => void start()}
        className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        خرید با پرداخت بیرون از سایت
      </button>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
