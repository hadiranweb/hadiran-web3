import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudioRender } from "@/components/studio/StudioRender";
import { getPublishedBySlug } from "@/lib/studio/pages";
import { validateStudioData } from "@/lib/studio/validate";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedBySlug(slug);
  if (!page) return { title: "صفحه", robots: { index: false, follow: false } };
  const seo = (page.seo ?? {}) as { title?: string; description?: string; canonical?: string; index?: boolean };
  return {
    title: seo.title || page.titleFa,
    description: seo.description || undefined,
    alternates: seo.canonical ? { canonical: seo.canonical } : undefined,
    robots: seo.index === false ? { index: false, follow: false } : undefined,
  };
}

export default async function StudioPublicPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPublishedBySlug(slug);
  if (!page) notFound();
  const data = validateStudioData(page.publishedData);
  if (!data) notFound();
  return <StudioRender data={data} />;
}
