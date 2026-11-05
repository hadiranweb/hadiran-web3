import type { Metadata } from "next";
import { getCurrentAccount } from "@/lib/auth/session";
import { landingPreviewEnabled } from "@/lib/landing/preview";
import { browserScope } from "@/lib/landing/scope";
import { loadPublicResources } from "@/lib/landing/public-resources";
import { EcosystemExplorer } from "@/components/landing/EcosystemExplorer";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { ...(landingPreviewEnabled()?{robots:{index:false,follow:false}}:{}), title: "خانهٔ هادیران؛ از یک سؤال به یک مسیر", description: "مسیرهای خواندن، دیدن و به کار بستن؛ پیوند باغ دانش، کارگاه، آینه‌ها و ابزارهای هادیران.", alternates:{canonical:"/ecosystem"},openGraph:{title:"خانهٔ هادیران؛ از یک سؤال به یک مسیر",description:"پیوند باغ دانش، کارگاه، آینه‌ها و ابزارهای هادیران.",url:"/ecosystem",locale:"fa_IR",type:"website"} };
export default async function EcosystemPage() {
  const [snapshot,account]=await Promise.all([loadPublicResources(),getCurrentAccount()]);
  const scope=browserScope(account);
  return <EcosystemExplorer key={scope} snapshot={snapshot} scope={scope} />;
}
