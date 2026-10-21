import { and, count, desc, eq, like, or } from "drizzle-orm";
import { db } from "@/db";
import { courses, knowledge, knowledgeTopics, memoryItems, projects, shopListings } from "@/db/schema";
import { isShopKind, type ShopKind } from "@/lib/shop/kinds";
import {
  publicCourseFilter,
  publicKnowledgeFilter,
  publicKnowledgeJoin,
  publicProjectFilter,
  publicShopFilter,
} from "./policy";
import { readPublicCollection, readPublicCount, type PublicCollection, type PublicCount } from "./source";

export async function loadPublicWorldCounts(): Promise<{
  knowledge: PublicCount;
  projects: PublicCount;
  courses: PublicCount;
  analyzers: PublicCount;
  shop: PublicCount;
}> {
  const [knowledgeCount, projectCount, courseCount, analyzerCount, shopCount] = await Promise.all([
    readPublicCount("public knowledge count", async () => {
      const [row] = await db
        .select({ value: count() })
        .from(knowledge)
        .innerJoin(memoryItems, publicKnowledgeJoin)
        .where(publicKnowledgeFilter);
      return Number(row?.value ?? 0);
    }),
    readPublicCount("public project count", async () => {
      const [row] = await db.select({ value: count() }).from(projects).where(publicProjectFilter);
      return Number(row?.value ?? 0);
    }),
    readPublicCount("public course count", async () => {
      const [row] = await db.select({ value: count() }).from(courses).where(publicCourseFilter);
      return Number(row?.value ?? 0);
    }),
    readPublicCount("public analyzer count", async () => {
      const { loadAnalyzers } = await import("@/lib/analyzers/catalog");
      const list = await loadAnalyzers();
      return list.filter((item) => item.status === "open").length;
    }),
    readPublicCount("public shop count", async () => {
      const [row] = await db.select({ value: count() }).from(shopListings).where(publicShopFilter);
      return Number(row?.value ?? 0);
    }),
  ]);

  return {
    knowledge: knowledgeCount,
    projects: projectCount,
    courses: courseCount,
    analyzers: analyzerCount,
    shop: shopCount,
  };
}

export async function loadPublicKnowledgeList(q?: string): Promise<PublicCollection<typeof knowledge.$inferSelect>> {
  return readPublicCollection("public knowledge list", async () => {
    const query = q?.trim();
    const search = query
      ? or(like(knowledge.titleFa, `%${query}%`), like(knowledge.summaryFa, `%${query}%`), like(knowledge.bodyFa, `%${query}%`))
      : undefined;
    const rows = await db
      .select({ item: knowledge })
      .from(knowledge)
      .innerJoin(memoryItems, publicKnowledgeJoin)
      .where(search ? and(publicKnowledgeFilter, search) : publicKnowledgeFilter);
    return rows.map((row) => row.item);
  });
}

export async function loadPublicProjects(): Promise<PublicCollection<typeof projects.$inferSelect>> {
  return readPublicCollection("public project list", () => db.select().from(projects).where(publicProjectFilter));
}

export async function loadPublicCourses(): Promise<PublicCollection<typeof courses.$inferSelect>> {
  return readPublicCollection("public course list", () => db.select().from(courses).where(publicCourseFilter));
}

export async function loadPublicShopList(kind?: string | null): Promise<PublicCollection<typeof shopListings.$inferSelect>> {
  const kindFilter: ShopKind | null = kind && isShopKind(kind) ? kind : null;
  return readPublicCollection("public shop list", async () => {
    const where = kindFilter ? and(publicShopFilter, eq(shopListings.kind, kindFilter)) : publicShopFilter;
    return db.select().from(shopListings).where(where).orderBy(desc(shopListings.updatedAt));
  });
}

export async function loadPublicTopicKnowledgeCounts() {
  return readPublicCollection("public topic knowledge counts", async () =>
    db
      .select({ topicId: knowledgeTopics.topicId, n: count() })
      .from(knowledgeTopics)
      .innerJoin(knowledge, eq(knowledgeTopics.knowledgeId, knowledge.id))
      .innerJoin(memoryItems, publicKnowledgeJoin)
      .where(publicKnowledgeFilter)
      .groupBy(knowledgeTopics.topicId),
  );
}
