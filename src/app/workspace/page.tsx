import Link from "next/link";
import { requirePageOwner } from "@/lib/auth/guard";
import { botServiceLabel } from "@/lib/bots/script";
import { listBots } from "@/lib/bots/store";
import { loadWorkspaceDesk, recordStatusFa } from "@/lib/workspace/pulse";
import { loadActionQueue, queueHasItems, type ActionGroup } from "@/lib/workspace/queue";
import { PulseTile } from "@/components/workspace/PulseTile";
import { RoleAssignForm } from "@/components/workspace/RoleAssignForm";
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

const card =
  "block rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500";
const empty =
  "rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400";
const heading = "text-lg font-bold text-slate-900 dark:text-slate-100";
const muted = "text-xs text-slate-500 dark:text-slate-400";
const title = "font-medium text-slate-900 dark:text-slate-100";
const link = "text-indigo-600 hover:text-indigo-800 dark:text-indigo-300";

function QueueGroup({ title: label, group }: { title: string; group: ActionGroup }) {
  if (group.count == null) {
    return (
      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">{label}</h3>
        <p className={muted}>نامشخص</p>
      </div>
    );
  }
  if (group.count === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        <span className="ms-2 tabular-nums text-slate-500 dark:text-slate-400">
          {group.count.toLocaleString("fa-IR")}
        </span>
      </h3>
      <ul className="space-y-2">
        {group.items.map((item) => (
          <li key={`${item.kind}-${item.id}`}>
            <Link href={item.href} className={card}>
              <p className={title}>{item.titleFa}</p>
              <p className={`mt-1 ${muted}`}>
                {item.reason}
                {item.at ? ` · ${whenFa(item.at)}` : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function WorkspacePage() {
  const account = await requirePageOwner("/workspace");
  const desk = await loadWorkspaceDesk(account.id);
  const queue = await loadActionQueue(account.id);
  const bots = await listBots(account.id);
  const { pulse } = desk;

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-8">
      {!desk.ok ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          لایهٔ دانش در این محیط آماده نیست. ثبت و ارتقا بعد از migrate در دسترس است.
        </p>
      ) : null}

      <RoleAssignForm />

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
              : `${pulse.readyToPromote.toLocaleString("fa-IR")} ثبت بدون حافظه`
          }
        />
        <PulseTile
          href="/knowledge"
          label="منتشر عمومی"
          value={pulse.publicMemory}
          foot={
            pulse.publicMemory == null
              ? ""
              : `${pulse.publicMemory.toLocaleString("fa-IR")} حافظهٔ تأییدشده`
          }
        />
        <PulseTile
          href="/knowledge"
          label="باغ دانش"
          value={pulse.knowledgeProjections}
          foot={
            pulse.knowledgeProjections == null
              ? ""
              : `${pulse.knowledgeProjections.toLocaleString("fa-IR")} نمود عمومی`
          }
        />
      </section>

      <section>
        <h2 className={`mb-3 ${heading}`}>صف اقدام</h2>
        {queueHasItems(queue) ? (
          <div className="space-y-6">
            <QueueGroup title="یادداشت" group={queue.notes} />
            <QueueGroup title="همکاری" group={queue.collabs} />
            <QueueGroup title="پیش‌نویس آزمون" group={queue.drafts} />
            <QueueGroup title="ربات" group={queue.bots} />
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">اقدام معلقی در این چهار گروه نیست.</p>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className={heading}>ربات‌ها</h2>
          <Link href="/workspace/bots/new" className={`text-sm ${link}`}>
            ربات تازه
          </Link>
        </div>
        {bots.length === 0 ? (
          <div className={empty}>
            <p>رباتی نیست. این بخش مستقل است و زیر عارضه‌یابی یا هیچ آزمون دیگری نمی‌آید.</p>
            <Link href="/workspace/bots/new" className={`mt-3 inline-block ${link}`}>
              افزودن ربات تلگرام
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {bots.map((bot) => (
              <li key={bot.id}>
                <Link href={`/workspace/bots/${bot.id}`} className={card}>
                  <p className={title}>{bot.titleFa}</p>
                  <p className={`mt-1 ${muted}`}>
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
        <h2 className={`mb-3 ${heading}`}>کار باز</h2>
        {desk.openWork.length === 0 ? (
          <div className={empty}>
            <p>کاری باز نیست.</p>
            <Link href="/workspace/capture" className={`mt-3 inline-block ${link}`}>
              ثبت جدید
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {desk.openWork.map((item) => (
              <li key={item.id}>
                <Link href={`/workspace/records/${item.id}`} className={card}>
                  <p className={title}>{item.titleFa}</p>
                  <p className={`mt-1 ${muted}`}>
                    {recordStatusFa(item.status)} · {whenFa(item.updatedAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className={`mb-3 ${heading}`}>اخیراً منتشر</h2>
        {desk.published.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">هنوز چیزی منتشر نشده.</p>
        ) : (
          <ul className="space-y-2">
            {desk.published.map((item) => (
              <li
                key={item.recordId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <p className={title}>{item.titleFa}</p>
                <span className="flex gap-3 text-xs">
                  <Link
                    href={`/workspace/records/${item.recordId}`}
                    className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300"
                  >
                    ثبت مبدأ
                  </Link>
                  {item.slug ? (
                    <Link href={`/knowledge/${item.slug}`} className={link}>
                      نمود باغ دانش
                    </Link>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className={`mb-3 ${heading}`}>همهٔ ثبت‌ها</h2>
        {desk.allRecords.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">هنوز ثبتی نیست.</p>
        ) : (
          <ul className="space-y-2">
            {desk.allRecords.map((item) => (
              <li key={item.id}>
                <Link href={`/workspace/records/${item.id}`} className={`${card} px-4 py-3`}>
                  <p className={title}>{item.titleFa}</p>
                  <p className={`mt-1 ${muted}`}>{recordStatusFa(item.status)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
