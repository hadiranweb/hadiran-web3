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

const card = "block rounded-[var(--radius-md)] border border-line bg-elev p-4 hover:border-accent";
const empty = "rounded-[var(--radius-md)] border border-dashed border-line bg-elev p-6 text-sm text-muted";
const heading = "text-lg font-bold text-ink";
const muted = "text-xs text-muted";
const title = "font-medium text-ink";
const link = "text-accent hover:opacity-90";

function QueueGroup({ title: label, group }: { title: string; group: ActionGroup }) {
  if (group.count == null) {
    return (
      <div>
        <h3 className="mb-2 text-sm font-medium text-ink">{label}</h3>
        <p className={muted}>نامشخص</p>
      </div>
    );
  }
  if (group.count === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-ink">
        {label}
        <span className="ms-2 tabular-nums text-muted">
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
      <header>
        <p className="text-xs font-medium text-muted">همه‌چیز در یک نگاه</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">میز کار</h1>
        <p className="mt-2 max-w-prose text-sm leading-7 text-muted">
          پالس، صف اقدام و کار باز — همان ثبت‌ها و ربات‌های واقعی، بدون پیش‌نمایش جدا از پایگاه.
        </p>
      </header>

      {!desk.ok ? (
        <p className="rounded-[var(--radius-md)] border border-line bg-accent-soft px-4 py-3 text-sm text-ink">
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
          <p className="text-sm text-muted">اقدام معلقی در این چهار گروه نیست.</p>
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
          <p className="text-sm text-muted">هنوز چیزی منتشر نشده.</p>
        ) : (
          <ul className="space-y-2">
            {desk.published.map((item) => (
              <li
                key={item.recordId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-line bg-elev p-4"
              >
                <p className={title}>{item.titleFa}</p>
                <span className="flex gap-3 text-xs">
                  <Link
                    href={`/workspace/records/${item.recordId}`}
                    className="text-muted hover:text-accent"
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
          <p className="text-sm text-muted">هنوز ثبتی نیست.</p>
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
