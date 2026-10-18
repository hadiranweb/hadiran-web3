import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { DeskPreview } from "@/components/workspace/preview/DeskPreview";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "پیش‌نمایش میزکار", robots: { index: false, follow: false } };

export default async function PreviewPage() {
  await requirePageOwner("/workspace/preview");
  return <DeskPreview />;
}
