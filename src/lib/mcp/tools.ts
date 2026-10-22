import { and, ilike, inArray, or } from "drizzle-orm";
import { db, hasDatabaseUrl } from "@/db";
import {
  courses,
  courseTopics,
  knowledge,
  knowledgeTopics,
  memoryItems,
  projects,
  projectTopics,
  topics,
} from "@/db/schema";
import { publicCourseFilter, publicKnowledgeFilter, publicKnowledgeJoin, publicProjectFilter } from "@/lib/public/policy";
import { normalizeQueryTokens, scoreTextMatch } from "@/lib/ai";
import { loadAnalyzers } from "@/lib/analyzers/catalog";
import { getTopicRule } from "./config";
import type { EcosystemHits, KnowledgeHit, McpWeights, TopicHit } from "./types";

/**
 * ابزارهای MCP. همهٔ کوئری‌های دانش از مرز انتشار عمومی می‌گذرند
 * (publicKnowledgeFilter/Join)؛ ثبت خام و خصوصی هرگز خوانده نمی‌شود.
 * همه Fail-soft هستند: بدون DB یا با خطای کوئری، فهرست خالی برمی‌گردد.
 */

export async function searchKnowledge(
  query: string,
  opts: { topicSlug?: string | null; limit?: number; weights: McpWeights; includeLayers: boolean },
): Promise<KnowledgeHit[]> {
  if (!hasDatabaseUrl()) return [];
  const tokens = normalizeQueryTokens(query);
  if (tokens.length === 0) return [];
  const limit = Math.min(8, Math.max(1, opts.limit ?? 4));
  try {
    let topicKnowledgeIds: number[] | null = null;
    if (opts.topicSlug) {
      const [topic] = await db.select({ id: topics.id }).from(topics).where(ilike(topics.slug, opts.topicSlug)).limit(1);
      if (!topic) return [];
      const links = await db
        .select({ knowledgeId: knowledgeTopics.knowledgeId })
        .from(knowledgeTopics)
        .where(inArray(knowledgeTopics.topicId, [topic.id]));
      topicKnowledgeIds = [...new Set(links.map((l) => l.knowledgeId))];
      if (topicKnowledgeIds.length === 0) return [];
    }

    const patterns = tokens.map((t) => `%${t}%`);
    const rows = await db
      .select({
        slug: knowledge.slug,
        title: knowledge.titleFa,
        summary: knowledge.summaryFa,
        body: knowledge.bodyFa,
        lineFa: knowledge.lineFa,
        questionFa: knowledge.questionFa,
        rootFa: knowledge.rootFa,
        firstStepFa: knowledge.firstStepFa,
        closingQuestionFa: knowledge.closingQuestionFa,
        closingOptions: knowledge.closingOptions,
      })
      .from(knowledge)
      .innerJoin(memoryItems, publicKnowledgeJoin)
      .where(
        and(
          publicKnowledgeFilter,
          ...(topicKnowledgeIds ? [inArray(knowledge.id, topicKnowledgeIds)] : []),
          or(
            ...patterns.flatMap((p) => [
              ilike(knowledge.titleFa, p),
              ilike(knowledge.summaryFa, p),
              ilike(knowledge.bodyFa, p),
            ]),
          ),
        ),
      )
      .limit(12);

    const w = opts.weights;
    return rows
      .map((row) => {
        const layerText = opts.includeLayers
          ? [row.lineFa, row.rootFa, row.firstStepFa].filter(Boolean).join(" ")
          : "";
        const relevance =
          scoreTextMatch(row.title, tokens) * w.title +
          scoreTextMatch(row.summary, tokens) * w.summary +
          (scoreTextMatch(row.body, tokens) + scoreTextMatch(layerText || null, tokens)) * w.body;
        const options = Array.isArray(row.closingOptions)
          ? (row.closingOptions as unknown[]).filter((x): x is string => typeof x === "string")
          : null;
        return {
          slug: row.slug,
          title: row.title,
          summary: row.summary,
          lineFa: opts.includeLayers ? row.lineFa : null,
          questionFa: opts.includeLayers ? row.questionFa : null,
          rootFa: opts.includeLayers ? row.rootFa : null,
          firstStepFa: opts.includeLayers ? row.firstStepFa : null,
          closingQuestionFa: opts.includeLayers ? row.closingQuestionFa : null,
          closingOptions: opts.includeLayers ? options : null,
          relevance,
        } satisfies KnowledgeHit;
      })
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function searchEcosystem(
  query: string,
  opts: {
    topicIds?: number[];
    includeProjects: boolean;
    includeCourses: boolean;
    includeAnalyzers: boolean;
    weights: McpWeights;
  },
): Promise<EcosystemHits> {
  const empty: EcosystemHits = { projects: [], courses: [], analyzers: [] };
  const tokens = normalizeQueryTokens(query);
  if (tokens.length === 0) return empty;
  const w = opts.weights;
  const patterns = tokens.map((t) => `%${t}%`);

  const [projectsOut, coursesOut, analyzersOut] = await Promise.all([
    (async (): Promise<EcosystemHits["projects"]> => {
      if (!opts.includeProjects || !hasDatabaseUrl()) return [];
      try {
        let ids: number[] | null = null;
        if (opts.topicIds && opts.topicIds.length > 0) {
          const links = await db
            .select({ projectId: projectTopics.projectId })
            .from(projectTopics)
            .where(inArray(projectTopics.topicId, opts.topicIds));
          ids = [...new Set(links.map((l) => l.projectId))];
          if (ids.length === 0) return [];
        }
        const rows = await db
          .select({
            slug: projects.slug,
            title: projects.nameFa,
            summary: projects.descriptionFa,
            problem: projects.problemFa,
            vision: projects.visionFa,
            concept: projects.conceptFa,
          })
          .from(projects)
          .where(
            and(
              publicProjectFilter,
              ...(ids ? [inArray(projects.id, ids)] : []),
              or(
                ...patterns.flatMap((p) => [
                  ilike(projects.nameFa, p),
                  ilike(projects.descriptionFa, p),
                  ilike(projects.problemFa, p),
                  ilike(projects.visionFa, p),
                  ilike(projects.conceptFa, p),
                ]),
              ),
            ),
          )
          .limit(8);
        return rows
          .map((row) => ({
            slug: row.slug,
            name: row.title,
            summary: row.summary,
            relevance:
              scoreTextMatch(row.title, tokens) * w.title +
              scoreTextMatch(row.summary, tokens) * w.summary +
              (scoreTextMatch(row.problem, tokens) + scoreTextMatch(row.vision, tokens) + scoreTextMatch(row.concept, tokens)) * w.body,
          }))
          .sort((a, b) => b.relevance - a.relevance)
          .slice(0, 3);
      } catch {
        return [];
      }
    })(),
    (async (): Promise<EcosystemHits["courses"]> => {
      if (!opts.includeCourses || !hasDatabaseUrl()) return [];
      try {
        let ids: number[] | null = null;
        if (opts.topicIds && opts.topicIds.length > 0) {
          const links = await db
            .select({ courseId: courseTopics.courseId })
            .from(courseTopics)
            .where(inArray(courseTopics.topicId, opts.topicIds));
          ids = [...new Set(links.map((l) => l.courseId))];
          if (ids.length === 0) return [];
        }
        const rows = await db
          .select({ slug: courses.slug, title: courses.titleFa, summary: courses.descriptionFa })
          .from(courses)
          .where(
            and(
              publicCourseFilter,
              ...(ids ? [inArray(courses.id, ids)] : []),
              or(...patterns.flatMap((p) => [ilike(courses.titleFa, p), ilike(courses.descriptionFa, p)])),
            ),
          )
          .limit(8);
        return rows
          .map((row) => ({
            slug: row.slug,
            title: row.title,
            summary: row.summary,
            relevance: scoreTextMatch(row.title, tokens) * w.title + scoreTextMatch(row.summary, tokens) * w.summary,
          }))
          .sort((a, b) => b.relevance - a.relevance)
          .slice(0, 3);
      } catch {
        return [];
      }
    })(),
    (async (): Promise<EcosystemHits["analyzers"]> => {
      if (!opts.includeAnalyzers) return [];
      try {
        // آینه‌ها جدول جدا ندارند؛ از رجیستری پک می‌آیند و فقط بازها پیشنهاد می‌شوند.
        const all = await loadAnalyzers();
        return all
          .filter((a) => a.status === "open")
          .map((a) => ({
            slug: a.slug,
            nameFa: a.nameFa,
            summaryFa: a.summaryFa,
            relevance:
              scoreTextMatch(a.nameFa, tokens) * w.title + scoreTextMatch(a.summaryFa, tokens) * w.summary,
          }))
          .filter((a) => a.relevance > 0)
          .sort((a, b) => b.relevance - a.relevance)
          .slice(0, 3);
      } catch {
        return [];
      }
    })(),
  ]);

  return { projects: projectsOut, courses: coursesOut, analyzers: analyzersOut };
}

export async function resolveTopicGraph(
  query: string,
  weights: McpWeights,
): Promise<{ topics: TopicHit[]; topicIds: number[] }> {
  if (!hasDatabaseUrl()) return { topics: [], topicIds: [] };
  const tokens = normalizeQueryTokens(query);
  if (tokens.length === 0) return { topics: [], topicIds: [] };
  const patterns = tokens.map((t) => `%${t}%`);
  try {
    const rows = await db
      .select({
        id: topics.id,
        slug: topics.slug,
        title: topics.labelFa,
        labelEn: topics.labelEn,
        summary: topics.descriptionFa,
      })
      .from(topics)
      .where(
        or(
          ...patterns.flatMap((p) => [
            ilike(topics.labelFa, p),
            ilike(topics.labelEn, p),
            ilike(topics.slug, p),
            ilike(topics.descriptionFa, p),
          ]),
        ),
      )
      .limit(8);

    const hits: TopicHit[] = [];
    for (const row of rows) {
      const rule = await getTopicRule(row.slug);
      const relevance =
        scoreTextMatch(row.title, tokens) * weights.topic +
        scoreTextMatch(row.labelEn, tokens) * weights.topic +
        scoreTextMatch(row.summary, tokens) * weights.summary +
        2 +
        (rule?.priorityBoost ?? 0);
      hits.push({ slug: row.slug, name: row.title, summary: row.summary, relevance, rule });
    }
    hits.sort((a, b) => b.relevance - a.relevance);
    const topicIds = rows.map((r) => r.id);
    return { topics: hits.slice(0, 4), topicIds };
  } catch {
    return { topics: [], topicIds: [] };
  }
}
