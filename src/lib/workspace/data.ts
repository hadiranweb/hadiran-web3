import { previewStore } from "@/lib/preview/store";
import "server-only";
import { cache } from "react";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { semanticRecords, projects, collaborations, shopListings } from "@/db/schema";
import { getCurrentAccount } from "@/lib/auth/session";
import { demoProjects, demoCollaborations } from "./demo";
import type { WorkspaceData } from "./types";

export const getWorkspaceData = cache(async (): Promise<WorkspaceData> => {
  const account = await getCurrentAccount();
  const empty: WorkspaceData = { source: "error", knowledge: [], projects: [], collaborations: [] };
  if (account?.role !== "owner") return empty;
  const preview = await previewStore(account);
  const mapRecord = (n: typeof semanticRecords.$inferSelect) => ({ id: n.id, title: n.titleFa, titleEn: n.titleEn || undefined, category: n.intent || "note", status: n.status, detail: n.summaryFa || "", body: n.bodyFa || "", updated: n.updatedAt?.toISOString() || "", editUrl: `/workspace/records/${n.id}` });
  if (preview) return { source: "demo", knowledge: preview.records.map(mapRecord), projects: demoProjects, collaborations: demoCollaborations, productCount: null };
  try {
    const [notes, work, applicants, listings] = await Promise.all([
      db.select().from(semanticRecords).where(eq(semanticRecords.ownerId, account.id)).orderBy(desc(semanticRecords.updatedAt)),
      db.select({ id: projects.id, slug: projects.slug, title: projects.nameFa, titleEn: projects.nameEn, category: projects.category, status: projects.status, detail: projects.descriptionFa, progress: projects.progress, updated: projects.updatedAt }).from(projects).orderBy(desc(projects.updatedAt)),
      db.select({ id: collaborations.id, title: collaborations.fullName, email: collaborations.email, status: collaborations.status, detail: collaborations.message, updated: collaborations.createdAt, project: projects.nameFa }).from(collaborations).leftJoin(projects, eq(collaborations.projectId, projects.id)).orderBy(desc(collaborations.createdAt)),
      db.select({ id: shopListings.id }).from(shopListings),
    ]);
    return {
      source: "live",
      knowledge: notes.map(mapRecord),
      productCount: listings.length,
      projects: work.map((p) => ({ id: String(p.id), title: p.title, titleEn: p.titleEn || undefined, category: p.category || "project", status: p.status, detail: p.detail || "", progress: p.progress || 0, updated: p.updated?.toISOString() || "", url: `/lab/${p.slug}` })),
      collaborations: applicants.map((c) => ({ id: String(c.id), title: c.title, category: c.project || "—", status: c.status, detail: c.detail || "", updated: c.updated?.toISOString() || "", email: c.email })),
    };
  } catch (error) { console.error("workspace data unavailable", error); return empty; }
});
