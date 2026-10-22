import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { McpControlDesk } from "@/components/workspace/McpControlDesk";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "موتور گفتگو (MCP)",
  robots: { index: false, follow: false },
};

export default async function McpControlPage() {
  await requirePageOwner("/workspace/mcp");
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">موتور گفتگو (MCP)</h1>
      <p className="text-sm leading-7 text-slate-500">
        یک کاتالوگ ابزار، دو موتور اجرا: لوکالِ قطعی از روی دانش عمومی، یا متصل به LLM با بازگشت خودکار به
        لوکال هنگام خطا. دادهٔ خام و خصوصی هرگز وارد چت نمی‌شود و کلید مدل فقط رمزنگاری‌شده نگه داشته می‌شود.
      </p>
      <McpControlDesk />
    </main>
  );
}
