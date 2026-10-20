import "server-only";
import { cache } from "react";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { collaborations, projects, semanticRecords, shopListings } from "@/db/schema";
import type { WorkspaceData, WorkspaceItem } from "./types";

function mapRecord(row: typeof semanticRecords.$inferSelect): WorkspaceItem {
  return {
    id: row.id,
    title: row.titleFa,
    titleEn: row.titleEn || undefined,
    category: row.intent || "note",
    status: row.status,
    detail: row.summaryFa || "",
    updated: row.updatedAt?.toISOString() || "",
    editUrl: `/workspace/records/${row.id}`,
  };
}

export const getWorkspaceData = cache(async (ownerId: number): Promise<WorkspaceData> => {
  const empty: WorkspaceData = { source: "error", knowledge: [], projects: [], collaborations: [], productCount: null };
  try {
    const [notes, work, applicants, listings] = await Promise.all([
      db.select().from(semanticRecords).where(eq(semanticRecords.ownerId, ownerId)).orderBy(desc(semanticRecords.updatedAt)),
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
      knowledge: notes.map(mapRecord),
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
