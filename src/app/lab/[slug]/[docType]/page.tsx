import { db } from "@/db";
import { projects, projectDocuments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const validDocs = ["whitepaper", "blueprint", "roadmap", "gantt"] as const;
const docLabels: Record<(typeof validDocs)[number], string> = {
  whitepaper: "وایت‌پیپر",
  blueprint: "بلوپرینت",
  roadmap: "نقشه راه",
  gantt: "برنامه زمان‌بندی",
};

const docDescriptions: Record<(typeof validDocs)[number], string> = {
  whitepaper: "چرا؟ چیست؟ برای چه کسانی؟",
  blueprint: "چگونه ساخته می‌شود؟",
  roadmap: "به کجا می‌رویم؟",
  gantt: "چه کسی، چه کاری، کی؟",
};

interface Props {
  params: Promise<{ slug: string; docType: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, docType } = await params;
  if (!validDocs.includes(docType as (typeof validDocs)[number])) {
    return { title: "یافت نشد" };
  }
  const [project] = await db.select().from(projects).where(eq(projects.slug, slug));
  if (!project) return { title: "یافت نشد" };
  const label = docLabels[docType as (typeof validDocs)[number]];
  const [doc] = await db
    .select()
    .from(projectDocuments)
    .where(
      and(
        eq(projectDocuments.projectId, project.id),
        eq(projectDocuments.type, docType as (typeof validDocs)[number])
      )
    );
  const title = doc?.titleFa || `${label} ${project.nameFa}`;
  return {
    title,
    description: `${label} پروژهٔ ${project.nameFa}. ${docDescriptions[docType as (typeof validDocs)[number]]}`,
    alternates: { canonical: `/lab/${slug}/${docType}` },
  };
}

export default async function ProjectDocumentPage({ params }: Props) {
  const { slug, docType } = await params;
  if (!validDocs.includes(docType as (typeof validDocs)[number])) notFound();

  const [project] = await db.select().from(projects).where(eq(projects.slug, slug));
  if (!project) notFound();

  const [doc] = await db
    .select()
    .from(projectDocuments)
    .where(
      and(eq(projectDocuments.projectId, project.id), eq(projectDocuments.type, docType as (typeof validDocs)[number]))
    );

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href={`/lab/${project.slug}`}
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        بازگشت به {project.nameFa}
      </Link>

      <article className="surface p-6 sm:p-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-paper text-mark">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-mark">{docLabels[docType as (typeof validDocs)[number]]}</span>
            <h1 className="text-2xl font-bold text-ink">{doc?.titleFa || project.nameFa}</h1>
            <p className="text-sm text-muted">{docDescriptions[docType as (typeof validDocs)[number]]}</p>
          </div>
        </div>

        {doc?.bodyFa ? (
          <div className="max-w-none">
            {doc.bodyFa.split("\n\n").map((paragraph, idx) => (
              <p key={idx} className="leading-[1.85] text-ink">
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-md)] bg-paper p-6 text-center text-muted">این سند هنوز ثبت نشده است.</div>
        )}
      </article>
    </main>
  );
}
