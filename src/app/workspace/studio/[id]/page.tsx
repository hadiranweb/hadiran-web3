import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudioEditor } from "@/components/studio/StudioEditor";
import { ensureSiteStudioPage, getStudioPage, studioEnabled } from "@/lib/studio/pages";
import { HomePortrait } from "@/components/portrait/HomePortrait";
import { requirePageOwner } from "@/lib/auth/guard";
import { sitePageByTarget } from "@/lib/studio/site-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "استودیو — ویرایش صفحه",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function StudioEditPage({ params }: Props) {
  if (!studioEnabled()) notFound();
  const account = await requirePageOwner("/workspace/studio");
  const { id } = await params;
  const page = await getStudioPage(id);
  if (!page) notFound();
  const siteDef = sitePageByTarget(page.target);
  if (siteDef) await ensureSiteStudioPage(siteDef, account.id);
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">استودیو — ویرایش صفحه</h1>
      <StudioEditor id={id} homePortrait={page.target === "site:home" ? <HomePortrait /> : undefined} />
    </main>
  );
}
