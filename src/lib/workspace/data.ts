import "server-only";
import { cache } from "react";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { collaborations, knowledge, memoryItems, projects, semanticRecords, shopListings } from "@/db/schema";
import { gardenPhase } from "@/lib/knowledge/lifecycle";
import type { WorkspaceData, WorkspaceItem } from "./types";

function mapRecord(
  row: typeof semanticRecords.$inferSelect,
  extra?: { slug?: string | null; memoryVisibility?: string | null },
): WorkspaceItem {
  const phase = gardenPhase(row);
  const visibility = extra?.memoryVisibility === "public" || row.visibility === "public" ? "public" : "private";
  const publicUrl =
    phase === "published" && visibility === "public" && extra?.slug ? `/knowledge/${extra.slug}` : undefined;
  return {
    id: row.id,
    title: row.titleFa,
    titleEn: row.titleEn || undefined,
    category: row.intent || "note",
    status: row.status,
    detail: row.summaryFa || "",
    updated: row.updatedAt?.toISOString() || "",
    editUrl: `/workspace/records/${row.id}`,
    phase,
    visibility,
    publicUrl,
  };
}

export const getWorkspaceData = cache(async (ownerId: number): Promise<WorkspaceData> => {
  const empty: WorkspaceData = { source: "error", knowledge: [], projects: [], collaborations: [], productCount: null };
  try {
    const [notes, work, applicants, listings] = await Promise.all([
      db
        .select({
          record: semanticRecords,
          slug: knowledge.slug,
          memoryVisibility: memoryItems.visibility,
        })
        .from(semanticRecords)
        .leftJoin(memoryItems, eq(semanticRecords.promotedMemoryId, memoryItems.id))
        .leftJoin(knowledge, eq(knowledge.memoryItemId, memoryItems.id))
        .where(eq(semanticRecords.ownerId, ownerId))
        .orderBy(desc(semanticRecords.updatedAt)),
      db
        .select({
          id: projects.id,
          slug: projects.slug,
          title: projects.nameFa,
          titleEn: projects.nameEn,
          category: projects.category,
          status: projects.status,
          detail: projects.descriptionFa,
          progress: projects.progress,
          updated: projects.updatedAt,
        })
        .from(projects)
        .orderBy(desc(projects.updatedAt)),
      db
        .select({
          id: collaborations.id,
          title: collaborations.fullName,
          email: collaborations.email,
          status: collaborations.status,
          detail: collaborations.message,
          updated: collaborations.createdAt,
          project: projects.nameFa,
          slug: projects.slug,
        })
        .from(collaborations)
        .leftJoin(projects, eq(collaborations.projectId, projects.id))
        .orderBy(desc(collaborations.createdAt)),
      db.select({ id: shopListings.id }).from(shopListings),
    ]);

    return {
      source: "live",
      productCount: listings.length,
      knowledge: notes.map((row) =>
        mapRecord(row.record, { slug: row.slug, memoryVisibility: row.memoryVisibility }),
      ),
      projects: work.map((item) => ({
        id: String(item.id),
        title: item.title,
        titleEn: item.titleEn || undefined,
        category: item.category || "project",
        status: item.status,
        detail: item.detail || "",
        progress: item.progress || 0,
        updated: item.updated?.toISOString() || "",
        url: `/lab/${item.slug}`,
      })),
      collaborations: applicants.map((item) => ({
        id: String(item.id),
        title: item.title,
        category: item.project || "—",
        status: item.status,
        detail: item.detail || "",
        updated: item.updated?.toISOString() || "",
        email: item.email,
        url: item.slug ? `/lab/${item.slug}` : undefined,
      })),
    };
  } catch (error) {
    console.error("[hadiran] workspace data unavailable", error);
    return empty;
  }
});
