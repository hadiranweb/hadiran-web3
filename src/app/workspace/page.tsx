import Link from "next/link";
import { requirePageOwner } from "@/lib/auth/guard";
import { botServiceLabel } from "@/lib/bots/script";
import { listBots } from "@/lib/bots/store";
import { loadWorkspaceDesk, recordStatusFa } from "@/lib/workspace/pulse";
import { loadActionQueue, queueHasItems, type ActionGroup } from "@/lib/workspace/queue";
import { getWorkspaceData } from "@/lib/workspace/data";
import { Overview } from "@/components/workspace/Overview";
import { RecordRowActions } from "@/components/workspace/RecordRowActions";
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

function QueueGroup({ title: label, group }: { title: string; group: ActionGroup }) {
  if (group.count == null) {
    return (
      <div>
        <h3 className="mb-2 text-sm font-medium text-ink">{label}</h3>
        <p className="ws-muted">نامشخص</p>
      </div>
    );
  }
  if (group.count === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-ink">
        {label}
        <span className="ms-2 tabular-nums text-muted">{group.count.toLocaleString("fa-IR")}</span>
      </h3>
      <ul>
        {group.items.map((item) => (
          <li key={`${item.kind}-${item.id}`}>
            <div className="ws-recent-row">
              <Link href={item.href} className="min-w-0 flex-1">
                <span>
                  <strong>{item.titleFa}</strong>
                  <small>
                    {item.reason}
                    {item.at ? ` · ${whenFa(item.at)}` : ""}
                  </small>
                </span>
              </Link>
              {item.kind === "note" ? <RecordRowActions id={item.id} title={item.titleFa} /> : null}
            </div>
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
  const data = await getWorkspaceData(account.id);
  const { pulse } = desk;

  return (
    <Overview
      pulse={pulse}
      data={data}
      deskNotice={
        !desk.ok ? (
          <p className="ws-notice">لایهٔ دانش در این محیط آماده نیست. ثبت و ارتقا بعد از migrate در دسترس است.</p>
        ) : null
      }
    >
      <div className="ws-bottom-panel space-y-6">
        <RoleAssignForm />

        <section className="ws-panel">
          <div className="ws-panel-title">
            <h2>صف اقدام</h2>
            <Link href="/workspace/actions">همه اقدام‌ها</Link>
          </div>
          <div className="p-4">
            {queueHasItems(queue) ? (
              <div className="space-y-6">
                <QueueGroup title="یادداشت" group={queue.notes} />
                <QueueGroup title="همکاری" group={queue.collabs} />
                <QueueGroup title="پیش‌نویس آزمون" group={queue.drafts} />
                <QueueGroup title="ربات" group={queue.bots} />
              </div>
            ) : (
              <p className="ws-empty">اقدام معلقی در این چهار گروه نیست.</p>
            )}
          </div>
        </section>

        <section className="ws-panel">
          <div className="ws-panel-title">
            <h2>ربات‌ها</h2>
            <Link href="/workspace/bots/new">ربات تازه</Link>
          </div>
          {bots.length === 0 ? (
            <div className="ws-empty">
              <p>رباتی نیست. این بخش مستقل است و زیر عارضه‌یابی یا هیچ آزمون دیگری نمی‌آید.</p>
              <Link href="/workspace/bots/new" className="ws-text-link mt-3">
                افزودن ربات تلگرام
              </Link>
            </div>
          ) : (
            <ul>
              {bots.map((bot) => (
                <li key={bot.id}>
                  <Link href={`/workspace/bots/${bot.id}`} className="ws-recent-row">
                    <span>
                      <strong>{bot.titleFa}</strong>
                      <small>
                        تلگرام · {botServiceLabel(bot.service)}
                        {bot.telegramUsername ? ` · @${bot.telegramUsername}` : ""}
                      </small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="open" className="ws-panel scroll-mt-8">
          <div className="ws-panel-title">
            <h2>کار باز</h2>
            <Link href="/workspace/capture">ثبت جدید</Link>
          </div>
          {desk.openWork.length === 0 ? (
            <div className="ws-empty">
              <p>کاری باز نیست.</p>
            </div>
          ) : (
            <ul>
              {desk.openWork.map((item) => (
                <li key={item.id}>
                  <div className="ws-recent-row">
                    <Link href={`/workspace/records/${item.id}`} className="min-w-0 flex-1">
                      <span>
                        <strong>{item.titleFa}</strong>
                        <small>
                          {recordStatusFa(item.status)} · {whenFa(item.updatedAt)}
                        </small>
                      </span>
                    </Link>
                    <RecordRowActions id={item.id} title={item.titleFa} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="ws-panel">
          <div className="ws-panel-title">
            <h2>اخیراً منتشر</h2>
          </div>
          {desk.published.length === 0 ? (
            <p className="ws-empty">هنوز چیزی منتشر نشده.</p>
          ) : (
            <ul>
              {desk.published.map((item) => (
                <li key={item.recordId} className="ws-recent-row">
                  <span>
                    <strong>{item.titleFa}</strong>
                  </span>
                  <span className="flex items-center gap-3 text-xs">
                    <Link href={`/workspace/records/${item.recordId}`} className="ws-text-link">
                      ویرایش
                    </Link>
                    {item.slug ? (
                      <Link href={`/knowledge/${item.slug}`} className="ws-text-link">
                        مشاهدهٔ عمومی
                      </Link>
                    ) : null}
                    <RecordRowActions id={item.recordId} title={item.titleFa} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="ws-panel">
          <div className="ws-panel-title">
            <h2>همهٔ ثبت‌ها</h2>
          </div>
          {desk.allRecords.length === 0 ? (
            <p className="ws-empty">هنوز ثبتی نیست.</p>
          ) : (
            <ul>
              {desk.allRecords.map((item) => (
                <li key={item.id}>
                  <div className="ws-recent-row">
                    <Link href={`/workspace/records/${item.id}`} className="min-w-0 flex-1">
                      <span>
                        <strong>{item.titleFa}</strong>
                        <small>{recordStatusFa(item.status)}</small>
                      </span>
                    </Link>
                    <RecordRowActions id={item.id} title={item.titleFa} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Overview>
  );
}
