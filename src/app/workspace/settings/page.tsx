import { SettingsPanel } from "@/components/workspace/SettingsPanel";
import { getCurrentAccount } from "@/lib/auth/session";
export default async function Page() {
  const account = await getCurrentAccount();
  return <SettingsPanel canManageTariffs={account?.role === "owner"} />;
}
