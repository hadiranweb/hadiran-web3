import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { getWorkspaceData } from "@/lib/workspace/data";
import { RecordManager } from "@/components/workspace/RecordManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "پروژه‌های میز",
  robots: { index: false, follow: false },
};

export default async function ProjectsDeskPage() {
  const account = await requirePageOwner("/workspace/projects");
  const data = await getWorkspaceData(account.id);
  return <RecordManager kind="projects" initial={data.projects} source={data.source} />;
}
