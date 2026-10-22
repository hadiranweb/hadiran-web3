import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { McpControlDesk } from "@/components/workspace/McpControlDesk";
import { McpServiceDesk } from "@/components/workspace/McpServiceDesk";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "موتور گفتگو (MCP)",
  robots: { index: false, follow: false },
};

export default async function McpControlPage() {
  await requirePageOwner("/workspace/mcp");
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">سرویس MCP</h1>
      <p className="text-sm leading-7 text-slate-500">
        لایهٔ کنترل MCP هادیران: رجیستری سرورها (داخلی و راه‌دور)، ابزار و پارامتر و مقدار هر سرور، بستن هر
        مصرف‌کننده، بازبینی امنیتی و دیده‌بانی فراخوانی‌ها. پایین‌تر، تنظیمات مصرف‌کنندهٔ چت خانه است —
        جدا از سرویس، با همان دو حالت لوکال و LLM.
      </p>
      <McpServiceDesk />
      <div className="border-t border-slate-200 pt-6">
        <h2 className="mb-1 text-xl font-bold text-slate-900">مصرف‌کنندهٔ چت خانه (دوحالته)</h2>
        <p className="mb-4 text-sm leading-7 text-slate-500">
          این بخش مال سرویس MCP نیست؛ مال چت خانه است که از سرویس مصرف می‌کند: حالت لوکال/LLM، اتصال مدل،
          سطح دادهٔ مخاطب، قوانین موضوعی و سندباکس. خاموشی ابزار و سرور از رجیستری بالا این‌جا هم اعمال می‌شود.
        </p>
        <McpControlDesk />
      </div>
    </main>
  );
}
