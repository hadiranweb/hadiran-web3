import "server-only";
import { cache } from "react";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { knowledge, memoryItems, shopListings } from "@/db/schema";
import { publicKnowledgeFilter } from "@/lib/knowledge/public";
import { analyzerHref, loadAnalyzers } from "@/lib/analyzers/catalog";
import { shopKindFa } from "@/lib/shop/kinds";
import { landingPreviewEnabled, sampleKnowledge, sampleListings } from "./preview";
import { publicConnections, type PublicResourceSnapshot, type PublicResource } from "./resources";
/** Capped public directory, not a promise of a full database count. */
export const loadPublicResources = cache(async (): Promise<PublicResourceSnapshot> => {
  const preview = landingPreviewEnabled();
  let writings: Pick<typeof knowledge.$inferSelect,"slug"|"titleFa"|"summaryFa"|"bodyFa">[] = [];
  let products: Pick<typeof shopListings.$inferSelect,"slug"|"titleFa"|"summaryFa"|"kind"|"coverImageUrl">[] = [];
  const sources: PublicResourceSnapshot["sources"] = { knowledge: preview ? "preview" : "unavailable", product: preview ? "preview" : "unavailable", analyzer: "live" };
  if (preview) { writings = sampleKnowledge; products = sampleListings; }
  else {
    await Promise.all([
      (async () => { try { writings = await db.select({slug:knowledge.slug,titleFa:knowledge.titleFa,summaryFa:knowledge.summaryFa,bodyFa:knowledge.bodyFa}).from(knowledge).innerJoin(memoryItems, eq(knowledge.memoryItemId,memoryItems.id)).where(publicKnowledgeFilter).orderBy(desc(knowledge.updatedAt)).limit(24); sources.knowledge = "live"; } catch { /* Unavailable is not zero or sample content. */ } })(),
      (async () => { try { products = await db.select({slug:shopListings.slug,titleFa:shopListings.titleFa,summaryFa:shopListings.summaryFa,kind:shopListings.kind,coverImageUrl:shopListings.coverImageUrl}).from(shopListings).where(eq(shopListings.published,true)).orderBy(desc(shopListings.updatedAt)).limit(24); sources.product = "live"; } catch { /* Never fall back to samples when a database is configured. */ } })(),
    ]);
  }
  const resources: PublicResource[] = [
    ...writings.map(item => ({ id: `knowledge:${item.slug}`, kind: "knowledge" as const, title: item.titleFa, summary: item.summaryFa || "", href: `/knowledge/${item.slug}`, minutes: Math.max(1,Math.ceil((item.bodyFa || "").split(/\s+/).length/180)) })),
    ...products.map(item => ({ id: `product:${item.slug}`, kind: "product" as const, title: item.titleFa, summary: item.summaryFa || "", href: `/shop/${item.slug}`, format: shopKindFa(item.kind), cover: item.coverImageUrl })),
  ];
  const analyzers = await loadAnalyzers();
  for (const item of analyzers) { const href = analyzerHref(item); if (href) resources.push({ id: `analyzer:${item.slug}`, kind: "analyzer", title: item.nameFa, summary: item.summaryFa, href }); }
  const connections = preview ? [
    { from: "knowledge:a-better-question", to: "product:thinking-notebook", label: "تمرین همراه", provenance: "preview-editorial" as const },
    { from: "knowledge:seeing-connections", to: "product:systems-field-guide", label: "راهنمای همراه", provenance: "preview-editorial" as const },
    { from: "knowledge:reflection-not-verdict", to: "analyzer:casio-ss", label: "آشنایی با ارزیابی", provenance: "preview-editorial" as const },
  ] : [];
  return { resources, connections: publicConnections(resources,connections), sources };
});
