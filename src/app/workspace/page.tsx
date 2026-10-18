import Link from "next/link";
import { requirePageOwner } from "@/lib/auth/guard";
import { botServiceLabel } from "@/lib/bots/script";
import { listBots } from "@/lib/bots/store";
import { loadWorkspaceDesk, recordStatusFa } from "@/lib/workspace/pulse";
import { PulseTile } from "@/components/workspace/PulseTile";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "میز کار",
  robots: { index: false, follow: false },
};

function whenFa(value: Date | null): string {
  if (!value) return "";
  return value.toLocaleDateString("fa-IR");
}

export default async function WorkspacePage() {
  const account = await requirePageOwner("/workspace");
  const desk = await loadWorkspaceDesk(account.id);
  const bots = await listBots(account.id);
  const { pulse } = desk;

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-8">
      {!desk.ok ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          لایهٔ دانش در این محیط آماده نیست. ثبت و ارتقا بعد از migrate در دسترس است.
        </p>
      ) : null}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PulseTile
          href="/workspace#open"
          label="ثبت خام"
          value={pulse.captured}
          foot={pulse.captured == null ? "" : `${pulse.captured.toLocaleString("fa-IR")} ثبت منتظر کار`}
        />
        <PulseTile
          href="/workspace#open"
          label="آمادهٔ ارتقا"
          value={pulse.readyToPromote}
          foot={
            pulse.readyToPromote == null
              ? ""
              : `${pulse.readyToPromote.toLocaleString("fa-IR")} ثبت بدون حافظه`}
        />
        <PulseTile
          href="/knowledge"
          label="منتشر عمومی"
          value={pulse.publicMemory}
          foot={
            pulse.publicMemory == null
              ? ""
              : `${pulse.publicMemory.toLocaleString("fa-IR")} حافظهٔ تأییدشده`}
        />
        <PulseTile
          href="/knowledge"
          label="دانشنامه"
          value={pulse.knowledgeProjections}
          foot={
            pulse.knowledgeProjections == null
              ? ""
              : `${pulse.knowledgeProjections.toLocaleString("fa-IR")} نمود عمومی`}
        />
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">ربات‌ها</h2>
          <Link href="/workspace/bots/new" className="text-sm text-indigo-700 hover:text-indigo-900">
            ربات تازه
          </Link>
        </div>
        {bots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            <p>رباتی نیست. این بخش مستقل است و زیر عارضه‌یابی یا هیچ آزمون دیگری نمی‌آید.</p>
            <Link href="/workspace/bots/new" className="mt-3 inline-block text-indigo-600 hover:text-indigo-800">
              افزودن ربات تلگرام
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {bots.map((bot) => (
              <li key={bot.id}>
                <Link
                  href={`/workspace/bots/${bot.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-200"
                >
                  <p className="font-medium text-slate-900">{bot.titleFa}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    تلگرام · {botServiceLabel(bot.service)}
                    {bot.telegramUsername ? ` · @${bot.telegramUsername}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="open" className="scroll-mt-8">
        <h2 className="mb-3 text-lg font-bold text-slate-900">کار باز</h2>
        {desk.openWork.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            <p>کاری باز نیست.</p>
            <Link href="/workspace/capture" className="mt-3 inline-block text-indigo-600 hover:text-indigo-800">
              ثبت جدید
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {desk.openWork.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/workspace/records/${item.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-200"
                >
                  <p className="font-medium text-slate-900">{item.titleFa}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {recordStatusFa(item.status)} · {whenFa(item.updatedAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">اخیراً منتشر</h2>
        {desk.published.length === 0 ? (
          <p className="text-sm text-slate-500">هنوز چیزی منتشر نشده.</p>
        ) : (
          <ul className="space-y-2">
            {desk.published.map((item) => (
              <li
                key={item.recordId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <p className="font-medium text-slate-900">{item.titleFa}</p>
                <span className="flex gap-3 text-xs">
                  <Link href={`/workspace/records/${item.recordId}`} className="text-slate-500 hover:text-indigo-600">
                    ثبت مبدأ
                  </Link>
                  {item.slug ? (
                    <Link href={`/knowledge/${item.slug}`} className="text-indigo-600 hover:text-indigo-800">
                      نمود دانشنامه
                    </Link>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">همهٔ ثبت‌ها</h2>
        {desk.allRecords.length === 0 ? (
          <p className="text-sm text-slate-500">هنوز ثبتی نیست.</p>
        ) : (
          <ul className="space-y-2">
            {desk.allRecords.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/workspace/records/${item.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 hover:border-indigo-200"
                >
                  <p className="font-medium text-slate-900">{item.titleFa}</p>
                  <p className="mt-1 text-xs text-slate-500">{recordStatusFa(item.status)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
