import type { Metadata } from "next";
import { requirePageAccount } from "@/lib/auth/guard";
import { PageShell } from "@/components/ui/PageShell";
import { PersonalOverview } from "@/components/account/PersonalOverview";
import { loadPersonalSnapshot } from "@/lib/account/overview";
import { personalKind } from "@/lib/workspace/role-home-types";
import { parseActionPage } from "@/lib/workspace/operations-types";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title:"فهرست من",robots:{index:false,follow:false} };
export default async function PersonalActivityPage({searchParams}:{searchParams:Promise<{kind?:string;page?:string}>}) {
  const account=await requirePageAccount("/account/activity");const query=await searchParams;
  const snapshot=await loadPersonalSnapshot(account,personalKind(query.kind)??"orders",parseActionPage(query.page));
  return <PageShell width="narrow"><PersonalOverview snapshot={snapshot} listOnly/></PageShell>;
}
