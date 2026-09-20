import { db } from "@/db";
import { knowledge, knowledgeSlides } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { KnowledgeComposer } from "@/components/knowledge/KnowledgeComposer";
import { requirePageAccount } from "@/lib/auth/guard";

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
  await requirePageAccount(`/knowledge/${slug}/edit`);
  const [item] = await db.select().from(knowledge).where(eq(knowledge.slug, slug));
  if (!item) notFound();

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

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href={`/knowledge/${item.slug}`}
        className="mb-6 inline-block text-sm text-slate-500 hover:text-indigo-600"
      >
        بازگشت به مطلب
      </Link>
      <h1 className="mb-8 text-3xl font-bold text-slate-900">ویرایش مطلب</h1>
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
