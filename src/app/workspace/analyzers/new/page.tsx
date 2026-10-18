import Link from "next/link";
import type { Metadata } from "next";
import { requirePageStaff } from "@/lib/auth/guard";
import { AnalyzerCreateForm } from "@/components/analyzers/AnalyzerCreateForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "آزمون تازه",
  robots: { index: false, follow: false },
};

export default async function NewAnalyzerPage() {
  await requirePageStaff("/workspace/analyzers/new");
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <p className="text-sm">
        <Link href="/workspace/analyzers" className="text-slate-500 hover:text-indigo-700">
          تحلیلگر‌ها
        </Link>
      </p>
      <h1 className="text-2xl font-bold text-slate-900">آزمون تازه</h1>
      <p className="text-sm leading-7 text-slate-500">
        سؤال‌ها ردیف دیتابیس نمی‌شوند؛ یک pack نسخه‌دار ذخیره می‌شود. Typeform نیست.
      </p>
      <AnalyzerCreateForm />
    </main>
  );
}
