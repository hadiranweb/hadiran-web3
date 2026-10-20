import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { loadOperationalSnapshot } from "@/lib/workspace/operations";
import { parseActionKind, parseActionPage } from "@/lib/workspace/operations-types";
import { OperationalOverview } from "@/components/workspace/OperationalOverview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "نیازمند اقدام",
  robots: { index: false, follow: false },
};

export default async function ActionPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; page?: string }>;
}) {
  const account = await requirePageOwner("/workspace/actions");
  const params = await searchParams;
  const snapshot = await loadOperationalSnapshot(account, parseActionKind(params.kind), parseActionPage(params.page));
  return <OperationalOverview snapshot={snapshot} listOnly />;
}
