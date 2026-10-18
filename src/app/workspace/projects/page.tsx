import { getWorkspaceData } from "@/lib/workspace/data";
import { RecordManager } from "@/components/workspace/RecordManager";
export default async function Page() { const data = await getWorkspaceData(); return <RecordManager kind="projects" initial={data.projects} source={data.source} />; }
