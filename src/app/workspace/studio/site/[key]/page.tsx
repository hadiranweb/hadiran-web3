import { notFound, redirect } from "next/navigation";
import { requirePageOwner } from "@/lib/auth/guard";
import { ensureSiteStudioPage, studioEnabled } from "@/lib/studio/pages";
import { sitePageByKey } from "@/lib/studio/site-pages";

export const dynamic = "force-dynamic";

/** صفحهٔ استودیوییِ یک صفحهٔ واقعی سایت را می‌سازد/پیدا می‌کند و به ادیتورش می‌رود. */
export default async function StudioSitePageOpen({ params }: { params: Promise<{ key: string }> }) {
  if (!studioEnabled()) notFound();
  const account = await requirePageOwner("/workspace/studio");
  const { key } = await params;
  const def = sitePageByKey(key);
  if (!def) notFound();
  const page = await ensureSiteStudioPage(def, account.id);
  if (!page) redirect("/workspace/studio");
  redirect(`/workspace/studio/${page.id}`);
}
