import Link from "@/components/workspace/WorkspaceLink";
import { requirePageOwner } from "@/lib/auth/guard";
import { botServiceLabel } from "@/lib/bots/script";
import { listBots } from "@/lib/bots/store";
import { loadWorkspaceDesk } from "@/lib/workspace/pulse";
import { getWorkspaceData } from "@/lib/workspace/data";
import { previewStore } from "@/lib/preview/store";
import { Overview } from "@/components/workspace/Overview";
import { RoleAssignForm } from "@/components/workspace/RoleAssignForm";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const account = await requirePageOwner("/workspace");
  const data = await getWorkspaceData();
  const preview = await previewStore(account);
  const pulse = preview
    ? {
        captured: preview.records.filter((record) => record.status === "captured").length,
        readyToPromote: preview.records.filter((record) => record.status !== "captured" && !record.promotedMemoryId).length,
        publicMemory: 0,
        knowledgeProjections: 0,
      }
    : (await loadWorkspaceDesk(account.id)).pulse;
  const bots = account.id === 0 ? [] : await listBots(account.id);

  return (
    <Overview data={data} pulse={pulse}>
      <section className="ws-panel repo-module">
        <fieldset className="min-w-0" disabled={account.id === 0}><RoleAssignForm /></fieldset>
      </section>
      <section className="ws-panel repo-module p-6">
        <div className="ws-panel-title">
          <h2>ربات‌ها</h2>
          <Link href="/workspace/bots/new">ربات تازه</Link>
        </div>
        {bots.length ? (
          <ul className="space-y-2">
            {bots.map((bot) => (
              <li key={bot.id}>
                <Link href={`/workspace/bots/${bot.id}`} className="block rounded-2xl border border-line p-4">
                  <strong>{bot.titleFa}</strong>
                  <p className="mt-1 text-xs text-muted">تلگرام · {botServiceLabel(bot.service)}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : <p className="ws-empty">هنوز رباتی ساخته نشده است.</p>}
      </section>
    </Overview>
  );
}
