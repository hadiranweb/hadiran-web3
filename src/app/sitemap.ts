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
    { url: absoluteUrl("/courses"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/topics"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  if (!process.env.DATABASE_URL) return entries;

  try {
    const { db } = await import("@/db");
    const { knowledge, projects, courses, projectDocuments, topics } = await import("@/db/schema");
    const [knowledgeRows, projectRows, courseRows, documentRows, topicRows] = await Promise.all([
      db.select({ slug: knowledge.slug, updatedAt: knowledge.updatedAt }).from(knowledge),
      db.select({ slug: projects.slug, updatedAt: projects.updatedAt, id: projects.id }).from(projects),
      db.select({ slug: courses.slug, updatedAt: courses.updatedAt }).from(courses),
      db
        .select({
          type: projectDocuments.type,
          updatedAt: projectDocuments.updatedAt,
          projectId: projectDocuments.projectId,
        })
        .from(projectDocuments),
      db.select({ slug: topics.slug, createdAt: topics.createdAt }).from(topics),
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
  } catch (error) {
    console.error("sitemap db error:", error);
  }

  return entries;
}
