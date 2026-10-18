import { requirePageOwner } from "@/lib/auth/guard";
import { getWorkspaceData } from "@/lib/workspace/data";
import { RecordManager } from "@/components/workspace/RecordManager";
export default async function Page() { await requirePageOwner("/workspace/collaborations"); const data = await getWorkspaceData(); return <RecordManager kind="collaborations" initial={data.collaborations} source={data.source} />; }
