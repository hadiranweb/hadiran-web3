import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { getWorkspaceData } from "@/lib/workspace/data";
import { RecordManager } from "@/components/workspace/RecordManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "همکاری‌ها",
  robots: { index: false, follow: false },
};

export default async function CollaborationsDeskPage() {
  const account = await requirePageOwner("/workspace/collaborations");
  const data = await getWorkspaceData(account.id);
  return <RecordManager kind="collaborations" initial={data.collaborations} source={data.source} />;
}
