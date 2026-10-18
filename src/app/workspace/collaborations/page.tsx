import { requirePageOwner } from "@/lib/auth/guard";
import { getWorkspaceData } from "@/lib/workspace/data";
import { RecordManager } from "@/components/workspace/RecordManager";
export default async function Page({ searchParams }: { searchParams: Promise<{ record?: string }> }) {
  await requirePageOwner("/workspace/collaborations");
  const data = await getWorkspaceData();
  const { record } = await searchParams;
  return <RecordManager key={record || "all"} kind="collaborations" initial={data.collaborations} source={data.source} initialRecord={record} />;
}
