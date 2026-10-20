import { db } from "@/db";
import { knowledge, knowledgeReferences, knowledgeSlides, semanticRecords } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { KnowledgeComposer } from "@/components/knowledge/KnowledgeComposer";
import { requirePageOwner } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `ویرایش ${slug}`,
    robots: { index: false, follow: false },
  };
}

export default async function EditKnowledgePage({ params }: Props) {
  const { slug } = await params;
  await requirePageOwner(`/knowledge/${slug}/edit`);
  const [item] = await db.select().from(knowledge).where(eq(knowledge.slug, slug));
  if (!item) notFound();

  let sourceId: string | null = null;
  if (item.memoryItemId) {
    const [source] = await db
      .select({ id: semanticRecords.id })
      .from(semanticRecords)
      .where(eq(semanticRecords.promotedMemoryId, item.memoryItemId));
    sourceId = source?.id ?? null;
  }

  let slides: (typeof knowledgeSlides.$inferSelect)[] = [];
  try {
    slides = await db
      .select()
      .from(knowledgeSlides)
      .where(eq(knowledgeSlides.knowledgeId, item.id))
      .orderBy(asc(knowledgeSlides.sortOrder));
  } catch (error) {
    console.error("knowledge slides query:", error);
  }

  const related = await db
    .select({ slug: knowledge.slug })
    .from(knowledgeReferences)
    .innerJoin(knowledge, eq(knowledgeReferences.targetKnowledgeId, knowledge.id))
    .where(eq(knowledgeReferences.sourceKnowledgeId, item.id));

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/knowledge/${item.slug}`} className="text-sm text-muted hover:text-ink">
          بازگشت به مطلب
        </Link>
        {sourceId ? (
          <Link href={`/workspace/records/${sourceId}`} className="text-sm text-accent">
            متن خام در میزکار
          </Link>
        ) : null}
      </div>
      <h1 className="mb-8 text-3xl font-bold text-ink">ویرایش مطلب</h1>
      <KnowledgeComposer
        mode="edit"
        initial={{
          id: item.id,
          slug: item.slug,
          type: item.type,
          titleFa: item.titleFa,
          titleEn: item.titleEn,
          summaryFa: item.summaryFa,
          bodyFa: item.bodyFa,
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
          relatedSlugs: related.map((row) => row.slug),
          fromMemory: Boolean(item.memoryItemId),
          slides: slides.map((s) => ({
            id: s.id,
            sortOrder: s.sortOrder,
            titleFa: s.titleFa,
            titleEn: s.titleEn,
            bodyFa: s.bodyFa,
            bodyEn: s.bodyEn,
          })),
        }}
      />
    </main>
  );
}
