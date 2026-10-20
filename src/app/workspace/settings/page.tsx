import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAnalyzerDesk } from "@/lib/analyzers/access";
import { requirePageAccount } from "@/lib/auth/guard";
import { SettingsPanel } from "@/components/workspace/SettingsPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تنظیمات میز",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const account = await requirePageAccount("/workspace/settings");
  if (account.role !== "owner" && account.role !== "author" && !(await hasAnalyzerDesk(account))) {
    redirect("/");
  }
  return <SettingsPanel />;
}
