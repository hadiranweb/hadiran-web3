import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { semanticRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requirePageOwner } from "@/lib/auth/guard";
import { CaptureEditor } from "@/components/knowledge/CaptureEditor";
import { PromoteButton } from "@/components/knowledge/PromoteButton";
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
  await requirePageOwner(`/workspace/records/${id}`);
  const [item] = await db.select().from(semanticRecords).where(eq(semanticRecords.id, id));
  if (!item) notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <Link href="/workspace" className="inline-block text-sm text-slate-500 hover:text-indigo-600">
        بازگشت به میز کار
      </Link>
      <div>
        <p className="text-xs text-slate-500">
          {item.status} · {item.visibility} · {item.id}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">{item.titleFa}</h1>
      </div>
      <PromoteButton recordId={item.id} />
      <CaptureEditor
        initial={{
          id: item.id,
          titleFa: item.titleFa,
          titleEn: item.titleEn,
          intent: item.intent,
          summaryFa: item.summaryFa,
          bodyFa: item.bodyFa,
          status: item.status,
        }}
      />
    </main>
  );
}
