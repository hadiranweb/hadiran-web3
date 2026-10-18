import { requirePageOwner } from "@/lib/auth/guard";
import { loadWorkspaceDesk } from "@/lib/workspace/pulse";
import { getWorkspaceData } from "@/lib/workspace/data";
import { previewStore } from "@/lib/preview/store";
import { Overview } from "@/components/workspace/Overview";
export const dynamic = "force-dynamic";
export default async function WorkspacePage() {
  const account = await requirePageOwner("/workspace");
  const data = await getWorkspaceData();
  const preview = await previewStore(account);
  const pulse = preview ? { captured: preview.records.filter(r => r.status === "captured").length, readyToPromote: preview.records.filter(r => r.status !== "captured" && !r.promotedMemoryId).length, publicMemory: 0, knowledgeProjections: 0 } : (await loadWorkspaceDesk(account.id)).pulse;
  return <Overview data={data} pulse={pulse} />;
}
