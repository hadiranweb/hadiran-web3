import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { getWorkspaceData } from "@/lib/workspace/data";
import { RecordManager } from "@/components/workspace/RecordManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "باغ دانش",
  robots: { index: false, follow: false },
};

export default async function KnowledgeDeskPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string }>;
}) {
  const account = await requirePageOwner("/workspace/knowledge");
  const { phase } = await searchParams;
  const data = await getWorkspaceData(account.id);
  const allowed = new Set(["draft", "review", "published", "archived"]);
  const initialFilter = phase && allowed.has(phase) ? phase : "";
  return <RecordManager kind="knowledge" initial={data.knowledge} source={data.source} initialFilter={initialFilter} />;
}
