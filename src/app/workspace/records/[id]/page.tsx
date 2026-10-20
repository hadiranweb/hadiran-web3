import { notFound } from "next/navigation";
import { db } from "@/db";
import { knowledge, memoryItems, semanticRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requirePageOwner } from "@/lib/auth/guard";
import { CaptureEditor } from "@/components/knowledge/CaptureEditor";
import { GardenLifecycle } from "@/components/knowledge/GardenLifecycle";
import { PromoteButton } from "@/components/knowledge/PromoteButton";
import { gardenPhase, gardenPhaseFa } from "@/lib/knowledge/lifecycle";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "مطلب باغ دانش",
  robots: { index: false, follow: false },
};

export default async function WorkspaceRecordPage({ params }: Props) {
  const { id } = await params;
  await requirePageOwner(`/workspace/records/${id}`);
  const [item] = await db.select().from(semanticRecords).where(eq(semanticRecords.id, id));
  if (!item) notFound();

  let publicSlug: string | null = null;
  let memoryVisibility: "private" | "public" = item.visibility === "public" ? "public" : "private";
  if (item.promotedMemoryId) {
    const [memory] = await db
      .select({ visibility: memoryItems.visibility })
      .from(memoryItems)
      .where(eq(memoryItems.id, item.promotedMemoryId))
      .limit(1);
    if (memory?.visibility === "public") memoryVisibility = "public";
    const [page] = await db
      .select({ slug: knowledge.slug })
      .from(knowledge)
      .where(eq(knowledge.memoryItemId, item.promotedMemoryId))
      .limit(1);
    publicSlug = page?.slug ?? null;
  }

  const phase = gardenPhase(item);

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div>
        <p className="text-xs text-slate-500">
          {gardenPhaseFa(phase)} · {memoryVisibility === "public" ? "عمومی" : "خصوصی"}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">{item.titleFa}</h1>
      </div>
      <GardenLifecycle
        recordId={item.id}
        title={item.titleFa}
        phase={phase}
        visibility={memoryVisibility}
        publicSlug={publicSlug}
      />
      {phase !== "archived" ? (
        <PromoteButton recordId={item.id} alreadyPublic={phase === "published" && memoryVisibility === "public"} />
      ) : null}
      <CaptureEditor
        initial={{
          id: item.id,
          titleFa: item.titleFa,
          titleEn: item.titleEn,
          intent: item.intent,
          summaryFa: item.summaryFa,
          bodyFa: item.bodyFa,
          status: item.status,
          growth: item.growth,
          readingMinutes: item.readingMinutes,
          lineFa: item.lineFa,
          questionFa: item.questionFa,
          rootFa: item.rootFa,
          firstStepFa: item.firstStepFa,
          marginNoteFa: item.marginNoteFa,
          prunedAt: item.prunedAt,
          audioUrl: item.audioUrl,
          simulator: item.simulator,
          closingQuestionFa: item.closingQuestionFa,
          closingOptions: item.closingOptions,
          closingPromptFa: item.closingPromptFa,
          relatedSlugs: item.relatedSlugs,
        }}
      />
    </main>
  );
}
