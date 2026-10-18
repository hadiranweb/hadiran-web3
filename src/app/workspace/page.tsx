import Link from "@/components/workspace/WorkspaceLink";
import { requirePageOwner } from "@/lib/auth/guard";
import { botServiceLabel } from "@/lib/bots/script";
import { listBots } from "@/lib/bots/store";
import { loadOperationalSnapshot } from "@/lib/workspace/operations";
import { OperationalOverview } from "@/components/workspace/OperationalOverview";
import { RoleAssignForm } from "@/components/workspace/RoleAssignForm";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const account = await requirePageOwner("/workspace");
  const snapshot = await loadOperationalSnapshot(account);
  const bots = account.id === 0 ? [] : await listBots(account.id).catch(() => null);

  return (
    <OperationalOverview snapshot={snapshot}>
      <details className="dp-panel wo-admin"><summary>دسترسی‌ها و ربات‌ها</summary><div className="wo-admin-body">
      <section className="ws-panel repo-module">
        <fieldset className="min-w-0" disabled={account.id === 0}><RoleAssignForm /></fieldset>
      </section>
      <section className="ws-panel repo-module p-6">
        <div className="ws-panel-title">
          <h2>ربات‌ها</h2>
          <Link href="/workspace/bots/new">ربات تازه</Link>
        </div>
        {bots?.length ? (
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
        ) : <p className="ws-empty">{bots === null ? "دادهٔ ربات‌ها در دسترس نیست." : "هنوز رباتی ساخته نشده است."}</p>}
      </section>
    </div></details>
    </OperationalOverview>
  );
}
