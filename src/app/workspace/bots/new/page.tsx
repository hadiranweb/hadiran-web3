import Link from "next/link";
import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { BotCreateForm } from "@/components/bots/BotCreateForm";
import { loadPacks } from "@/lib/analyzers/registry";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ربات تازه",
  robots: { index: false, follow: false },
};

export default async function NewBotPage() {
  await requirePageOwner("/workspace/bots/new");
  const packs = await loadPacks();
  const analyzers = packs
    .filter((pack) => pack.status !== "archived")
    .map((pack) => ({ slug: pack.slug, nameFa: pack.nameFa }));
  if (!analyzers.some((item) => item.slug === "casio-ss")) {
    analyzers.unshift({ slug: "casio-ss", nameFa: "عارضه‌یابی سازمانی" });
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <p className="text-sm">
        <Link href="/workspace/bots" className="text-slate-500 hover:text-indigo-700">
          ربات‌ها
        </Link>
      </p>
      <h1 className="text-2xl font-bold text-slate-900">ربات تازه</h1>
      <p className="text-sm leading-7 text-slate-500">
        فعلاً فقط تلگرام. توکن را در صفحهٔ بعد می‌گذارید. این ورود سایت نیست.
      </p>
      <BotCreateForm analyzers={analyzers} />
    </main>
  );
}
