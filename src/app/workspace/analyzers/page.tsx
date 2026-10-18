import type { Metadata } from "next";
import { requirePageAnalyzerDesk } from "@/lib/auth/guard";
import { isStaff } from "@/lib/auth/roles";
import { loadAnalyzerSnapshot } from "@/lib/workspace/analyzer-overview";
import { deskFilter } from "@/lib/workspace/role-home-types";
import { parseActionPage } from "@/lib/workspace/operations-types";
import { AnalyzerDeskOverview } from "@/components/workspace/AnalyzerDeskOverview";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "میز آزمون‌ساز", robots: { index: false, follow: false } };
export default async function WorkspaceAnalyzersPage({searchParams}:{searchParams:Promise<{filter?:string;page?:string}>}) {
  const account=await requirePageAnalyzerDesk("/workspace/analyzers");
  const query=await searchParams;
  const snapshot=await loadAnalyzerSnapshot(account,deskFilter(query.filter),parseActionPage(query.page));
  return <AnalyzerDeskOverview snapshot={snapshot} canCreate={isStaff(account.role)}/>;
}
