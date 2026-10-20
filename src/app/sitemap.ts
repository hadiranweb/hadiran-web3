import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/ecosystem"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/hadiran"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/knowledge"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/lab"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/analyzers"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/analyzers/casio-ss"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/courses"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/topics"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/shop"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  if (!process.env.DATABASE_URL) return entries;

  try {
    const { db } = await import("@/db");
    const { knowledge, memoryItems, projects, courses, projectDocuments, topics, shopListings } = await import("@/db/schema");
    const { publicCourseFilter, publicKnowledgeFilter, publicKnowledgeJoin, publicProjectFilter, publicShopFilter } =
      await import("@/lib/public/policy");
    const [knowledgeRows, projectRows, courseRows, documentRows, topicRows, shopRows] = await Promise.all([
      db
        .select({ slug: knowledge.slug, updatedAt: knowledge.updatedAt })
        .from(knowledge)
        .innerJoin(memoryItems, publicKnowledgeJoin)
        .where(publicKnowledgeFilter),
      db.select({ slug: projects.slug, updatedAt: projects.updatedAt, id: projects.id }).from(projects).where(publicProjectFilter),
      db.select({ slug: courses.slug, updatedAt: courses.updatedAt }).from(courses).where(publicCourseFilter),
      db
        .select({
          type: projectDocuments.type,
          updatedAt: projectDocuments.updatedAt,
          projectId: projectDocuments.projectId,
        })
        .from(projectDocuments),
      db.select({ slug: topics.slug, createdAt: topics.createdAt }).from(topics),
      db
        .select({ slug: shopListings.slug, updatedAt: shopListings.updatedAt })
        .from(shopListings)
        .where(publicShopFilter),
    ]);

    for (const row of knowledgeRows) {
      entries.push({
        url: absoluteUrl(`/knowledge/${row.slug}`),
        lastModified: row.updatedAt ?? now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    const projectById = new Map(projectRows.map((p) => [p.id, p]));

    for (const row of projectRows) {
      entries.push({
        url: absoluteUrl(`/lab/${row.slug}`),
        lastModified: row.updatedAt ?? now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const doc of documentRows) {
      const project = projectById.get(doc.projectId);
      if (!project) continue;
      entries.push({
        url: absoluteUrl(`/lab/${project.slug}/${doc.type}`),
        lastModified: doc.updatedAt ?? now,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }

    for (const row of courseRows) {
      entries.push({
        url: absoluteUrl(`/courses/${row.slug}`),
        lastModified: row.updatedAt ?? now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    for (const row of topicRows) {
      entries.push({
        url: absoluteUrl(`/topics/${row.slug}`),
        lastModified: row.createdAt ?? now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }

    for (const row of shopRows) {
      entries.push({
        url: absoluteUrl(`/shop/${row.slug}`),
        lastModified: row.updatedAt ?? now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }

    try {
      const { analyzerPacks } = await import("@/db/schema");
      const analyzerRows = await db
        .select({ slug: analyzerPacks.slug, status: analyzerPacks.status, updatedAt: analyzerPacks.updatedAt })
        .from(analyzerPacks);
      for (const row of analyzerRows) {
        if (row.status !== "open" || row.slug === "casio-ss") continue;
        entries.push({
          url: absoluteUrl(`/analyzers/${row.slug}`),
          lastModified: row.updatedAt ?? now,
          changeFrequency: "monthly",
          priority: 0.5,
        });
      }
    } catch {
      // table 0014 may not exist yet
    }
  } catch (error) {
    console.error("sitemap db error:", error);
  }

  return entries;
}
