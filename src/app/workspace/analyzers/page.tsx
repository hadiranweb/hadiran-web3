import type { Metadata } from "next";
import { requirePageAnalyzerDesk } from "@/lib/auth/guard";
import { isStaff } from "@/lib/auth/roles";
import { loadDeskSnapshot } from "@/lib/workspace/desk-home";
import { AnalyzerDeskOverview } from "@/components/workspace/AnalyzerDeskOverview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "میز آزمون‌ساز",
  robots: { index: false, follow: false },
};

export default async function WorkspaceAnalyzersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const account = await requirePageAnalyzerDesk("/workspace/analyzers");
  const params = await searchParams;
  const snapshot = await loadDeskSnapshot(account, params.filter, params.page);
  return <AnalyzerDeskOverview snapshot={snapshot} canCreate={isStaff(account.role)} />;
}
