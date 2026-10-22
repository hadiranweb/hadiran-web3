import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudioEditor } from "@/components/studio/StudioEditor";
import { studioEnabled } from "@/lib/studio/pages";
import { requirePageOwner } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "استودیو — ویرایش صفحه",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function StudioEditPage({ params }: Props) {
  if (!studioEnabled()) notFound();
  await requirePageOwner("/workspace/studio");
  const { id } = await params;
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">استودیو — ویرایش صفحه</h1>
      <StudioEditor id={id} />
    </main>
  );
}
