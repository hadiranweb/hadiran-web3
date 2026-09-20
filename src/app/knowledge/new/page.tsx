import type { Metadata } from "next";
import Link from "next/link";
import { KnowledgeComposer } from "@/components/knowledge/KnowledgeComposer";
import { requirePageAccount } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "نوشتن مطلب",
  description: "ایجاد مقاله، یادداشت یا ایده در دانشنامه هادیران.",
  robots: { index: false, follow: false },
};

export default async function NewKnowledgePage() {
  await requirePageAccount("/knowledge/new");
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/knowledge" className="mb-6 inline-block text-sm text-slate-500 hover:text-indigo-600">
        بازگشت به دانشنامه
      </Link>
      <h1 className="mb-2 text-3xl font-bold text-slate-900">نوشتن مطلب</h1>
      <p className="mb-8 text-sm text-slate-500">
        بدنه با Markdown است. اسلایدها اختیاری‌اند؛ «متن → اسلاید» از عنوان‌ها و پاراگراف‌ها عرشه می‌سازد.
      </p>
      <KnowledgeComposer mode="create" />
    </main>
  );
}
