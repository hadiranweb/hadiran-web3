import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { DiscountManager } from "@/components/workspace/DiscountManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "کد تخفیف",
  robots: { index: false, follow: false },
};

export default async function DiscountsPage() {
  await requirePageOwner("/workspace/discounts");
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">کد تخفیف</h1>
      <p className="text-sm leading-7 text-slate-500">
        این کد آدم نیست؛ کمپین است. هشت‌رقم خالص نگذارید تا با کد معرف قاطی نشود. زرین‌پال نیست.
      </p>
      <DiscountManager />
    </main>
  );
}
