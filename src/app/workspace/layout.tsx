import { readAccountAvatar } from "@/lib/account/avatar-store";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth/session";
import { hasAnalyzerDesk } from "@/lib/analyzers/access";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "میز کار", referrer: "no-referrer", robots: { index: false, follow: false } };

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const account = await getCurrentAccount();
  if (!account) redirect("/signin?next=/workspace");
  const analyzerDesk = await hasAnalyzerDesk(account);
  if (!analyzerDesk) redirect("/");
  const { avatar } = await readAccountAvatar(account);
  const jar = await cookies();
  return <WorkspaceShell account={{ ...account, avatar, analyzerDesk }} initialLocale={jar.get("hadiran-workspace-locale")?.value === "en" ? "en" : "fa"} demo={!process.env.DATABASE_URL}>{children}</WorkspaceShell>;
}
