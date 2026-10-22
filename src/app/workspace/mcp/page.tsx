import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { McpControlDesk } from "@/components/workspace/McpControlDesk";
import { McpServiceDesk } from "@/components/workspace/McpServiceDesk";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "سرویس MCP",
  robots: { index: false, follow: false },
};

export default async function McpServicePage() {
  await requirePageOwner("/workspace/mcp");
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">سرویس MCP</h1>
      <p className="text-sm leading-7 text-slate-500">
        لایهٔ کنترل MCP هادیران، زبانه‌بندی‌شده: سرورها (داخلی و راه‌دور)، ابزار و پارامتر و مقدار هر سرور،
        منابع و پرامپت‌ها، بستن هر مصرف‌کننده، و امنیت و دیده‌بانی. زبانهٔ آخر «مصرف‌کنندهٔ چت خانه» است —
        مصرف‌کننده‌ای جدا از سرویس که با همان دو حالت لوکال و LLM از آن تغذیه می‌کند.
      </p>
      <McpServiceDesk>
        <McpControlDesk />
      </McpServiceDesk>
    </main>
  );
}
