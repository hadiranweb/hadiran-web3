import { previewStore } from "@/lib/preview/store";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { semanticRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requirePageOwner } from "@/lib/auth/guard";
import { RecordWorkbench } from "@/components/workspace/RecordWorkbench";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "ثبت",
  robots: { index: false, follow: false },
};

export default async function WorkspaceRecordPage({ params }: Props) {
  const { id } = await params;
  const account = await requirePageOwner(`/workspace/records/${id}`);
  const preview = await previewStore(account);
  const [item] = preview ? preview.records.filter(record => record.id === id) : await db.select().from(semanticRecords).where(eq(semanticRecords.id, id));
  if (!item) notFound();
  if (item.ownerId && item.ownerId !== account.id) notFound();

  return <RecordWorkbench initial={{ id: item.id, titleFa: item.titleFa, titleEn: item.titleEn, intent: item.intent, summaryFa: item.summaryFa, bodyFa: item.bodyFa, status: item.status }} visibility={item.visibility} />;
}
