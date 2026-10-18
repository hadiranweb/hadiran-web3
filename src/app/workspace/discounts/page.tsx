import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { DiscountManager } from "@/components/workspace/DiscountManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "کد تخفیف",
  robots: { index: false, follow: false },
};

export default async function DiscountsPage() {
  const account = await requirePageOwner("/workspace/discounts");
  return (
    <main className="ws-page repo-module space-y-6">
      <h1 className="text-2xl font-bold text-ink">کد تخفیف</h1>
      <p className="text-sm leading-7 text-muted">
        این کد آدم نیست؛ کمپین است. هشت‌رقم خالص نگذارید تا با کد معرف قاطی نشود. زرین‌پال نیست.
      </p>
      {account.id === 0 ? <p className="integration-notice">مدیریت کدهای تخفیف به دیتابیس واقعی نیاز دارد.</p> : <DiscountManager />}
    </main>
  );
}
