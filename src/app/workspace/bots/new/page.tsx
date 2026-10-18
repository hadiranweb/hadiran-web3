import Link from "@/components/workspace/WorkspaceLink";
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
  const account = await requirePageOwner("/workspace/bots/new");
  const packs = account.id === 0 ? [] : await loadPacks();
  const analyzers = packs
    .filter((pack) => pack.status !== "archived")
    .map((pack) => ({ slug: pack.slug, nameFa: pack.nameFa }));
  if (!analyzers.some((item) => item.slug === "casio-ss")) {
    analyzers.unshift({ slug: "casio-ss", nameFa: "عارضه‌یابی سازمانی" });
  }

  return (
    <main className="ws-page repo-module space-y-6">
      <p className="text-sm">
        <Link href="/workspace/bots" className="text-muted hover:text-mark">
          ربات‌ها
        </Link>
      </p>
      <h1 className="text-2xl font-bold text-ink">ربات تازه</h1>
      <p className="text-sm leading-7 text-muted">
        فعلاً فقط تلگرام. توکن را در صفحهٔ بعد می‌گذارید. این ورود سایت نیست.
      </p>
      {account.id === 0 ? <p className="integration-notice">ساخت ربات در پیش‌نمایش بدون دیتابیس غیرفعال است.</p> : null}
      <fieldset disabled={account.id === 0} className="min-w-0"><BotCreateForm analyzers={analyzers} /></fieldset>
    </main>
  );
}
