import "server-only";
import { asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { knowledge, knowledgeTopics, memoryItems, topics } from "@/db/schema";
import { publicKnowledgeFilter } from "@/lib/knowledge/public";
import type { GardenSnapshot } from "./types";

export async function loadPublicGarden(): Promise<GardenSnapshot> {
  const empty: GardenSnapshot = { source: "unavailable", asOf: null, total: null, notes: [], limit: 12 };
  if (!process.env.DATABASE_URL) return empty;
  try {
    return await db.transaction(async tx => {
      const [total] = await tx.select({ value: count() }).from(knowledge)
        .innerJoin(memoryItems, eq(knowledge.memoryItemId, memoryItems.id)).where(publicKnowledgeFilter);
      const rows = await tx.select({ id: knowledge.id, slug: knowledge.slug, title: knowledge.titleFa,
        summary: sql<string>`left(coalesce(${knowledge.summaryFa},''),600)`,
        body: sql<string>`left(coalesce(${knowledge.bodyFa},''),4000)`,
        excerpted: sql<boolean>`length(coalesce(${knowledge.bodyFa},''))>4000`,
        type: knowledge.type, updatedAt: knowledge.updatedAt })
        .from(knowledge).innerJoin(memoryItems, eq(knowledge.memoryItemId, memoryItems.id))
        .where(publicKnowledgeFilter).orderBy(desc(knowledge.updatedAt), asc(knowledge.slug)).limit(empty.limit);
      const links = rows.length ? await tx.select({ id: knowledgeTopics.knowledgeId, slug: topics.slug, label: topics.labelFa })
        .from(knowledgeTopics).innerJoin(topics, eq(knowledgeTopics.topicId, topics.id))
        .where(inArray(knowledgeTopics.knowledgeId, rows.map(row => row.id))).orderBy(asc(topics.slug)).limit(96) : [];
      const time = await tx.execute(sql`select transaction_timestamp() as "asOf"`);
      return { ...empty, source: "live", asOf: new Date(time.rows[0].asOf as string).toISOString(), total: total.value,
        notes: rows.map(row => ({ slug: row.slug, title: row.title, summary: row.summary, body: row.body,
          excerpted: row.excerpted, type: row.type, updatedAt: row.updatedAt?.toISOString() ?? null,
          topics: links.filter(link => link.id === row.id).slice(0,3).map(link => ({slug: link.slug,label: link.label})) })) };
    }, { isolationLevel: "repeatable read", accessMode: "read only" });
  } catch (error) {
    console.error("[hadiran] public garden unavailable", error instanceof Error ? error.name : "unknown");
    return { ...empty, source: "error" };
  }
}
