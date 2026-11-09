"use client";

import { useRouter } from "next/navigation";
import { AssessmentPurchasePanel } from "@/components/analyzers/AssessmentPurchasePanel";
import { financeMoney } from "@/lib/finance/types";

export function AssessmentResultPaywall({
  slug,
  attemptId,
  priceIrr,
  initialDiscountCode,
  canPurchase,
}: {
  slug: string;
  attemptId: number;
  priceIrr: string | null;
  initialDiscountCode?: string | null;
  canPurchase: boolean;
}) {
  const router = useRouter();

  return (
    <section className="mt-6 rounded-[var(--radius-md)] border border-mark/30 bg-elev p-5">
      <h2 className="text-base font-bold text-ink">نتیجهٔ پایه پس از پرداخت باز می‌شود</h2>
      <p className="mt-2 text-sm leading-7 text-muted">
        پاسخ‌های این نوبت ثبت شده‌اند، اما نتیجه برای آزمون‌دهنده تا فعال‌شدن دسترسی اجرای همین نوبت پنهان می‌ماند. تفسیر کامل و سند چندصفحه هزینه و دسترسی مستقل دارند.
      </p>
      {canPurchase && priceIrr ? (
        <AssessmentPurchasePanel
          slug={slug}
          attemptId={attemptId}
          service="execution"
          title="فعال‌سازی نتیجهٔ پایهٔ این نوبت"
          payableIrr={priceIrr}
          entitled={false}
          initialDiscountCode={initialDiscountCode}
          onEntitled={() => router.refresh()}
        />
      ) : !canPurchase ? (
        <p className="mt-3 text-sm text-mark">این نوبت با قاعدهٔ پرداخت پیش از آغاز ثبت شده و اکنون قابل خرید پس از ثبت نیست.</p>
      ) : (
        <p className="mt-3 text-sm text-mark">تعرفهٔ اجرای آزمون فعال نیست؛ نتیجهٔ پایه تا تعیین تعرفه پنهان می‌ماند.</p>
      )}
      {priceIrr ? <p className="mt-2 text-xs text-muted">هزینهٔ جاری: {financeMoney(priceIrr, "IRR")}.</p> : null}
    </section>
  );
}
