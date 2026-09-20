import { db } from "@/db";
import {
  knowledge,
  projects,
  courses,
  topics,
  knowledgeTopics,
  projectTopics,
  courseTopics,
} from "@/db/schema";
import { and, eq, ilike, inArray, or } from "drizzle-orm";

export interface RetrievedEntity {
  type: "knowledge" | "project" | "course" | "topic";
  slug: string;
  title: string;
  summary?: string | null;
  relevance: number;
}

export interface ChatReferences {
  knowledge: { slug: string; title: string; summary?: string | null }[];
  projects: { slug: string; name: string; summary?: string | null }[];
  courses: { slug: string; title: string; summary?: string | null }[];
  topics: { slug: string; name: string; summary?: string | null }[];
}

export interface AIResponse {
  answer: string;
  references: ChatReferences;
  related: RetrievedEntity[];
}

const EMPTY_REFERENCES: ChatReferences = {
  knowledge: [],
  projects: [],
  courses: [],
  topics: [],
};

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[^\w\s\u0600-\u06FF]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function score(text: string | null | undefined, queryTokens: string[]): number {
  if (!text) return 0;
  const t = normalize(text);
  return queryTokens.reduce((acc, token) => acc + t.filter((x) => x.includes(token)).length, 0);
}

function mergeEntity(
  map: Map<string, RetrievedEntity>,
  entity: RetrievedEntity
) {
  const key = `${entity.type}:${entity.slug}`;
  const existing = map.get(key);
  if (existing) {
    existing.relevance += entity.relevance;
    if (!existing.summary && entity.summary) existing.summary = entity.summary;
  } else {
    map.set(key, { ...entity });
  }
}

function toReferences(entities: RetrievedEntity[]): ChatReferences {
  const knowledgeItems: ChatReferences["knowledge"] = [];
  const projectItems: ChatReferences["projects"] = [];
  const courseItems: ChatReferences["courses"] = [];
  const topicItems: ChatReferences["topics"] = [];

  for (const item of entities) {
    if (item.type === "knowledge") {
      knowledgeItems.push({ slug: item.slug, title: item.title, summary: item.summary });
    } else if (item.type === "project") {
      projectItems.push({ slug: item.slug, name: item.title, summary: item.summary });
    } else if (item.type === "course") {
      courseItems.push({ slug: item.slug, title: item.title, summary: item.summary });
    } else {
      topicItems.push({ slug: item.slug, name: item.title, summary: item.summary });
    }
  }

  return {
    knowledge: knowledgeItems.slice(0, 4),
    projects: projectItems.slice(0, 3),
    courses: courseItems.slice(0, 3),
    topics: topicItems.slice(0, 4),
  };
}

function buildAnswer(refs: ChatReferences): string {
  const topTopic = refs.topics[0];
  const topKnowledge = refs.knowledge[0];
  const topProject = refs.projects[0];
  const topCourse = refs.courses[0];

  if (!topTopic && !topKnowledge && !topProject && !topCourse) {
    return "سؤال جالبی است. فعلاً در دانش موجود من مطلب مستقیمی پیدا نکردم، ولی می‌توانی در دانشنامه یا آزمایشگاه جستجو کنی یا سؤال را با کلمات دیگری بپرسی.";
  }

  const parts: string[] = [];

  if (topTopic) {
    const desc = topTopic.summary?.trim();
    parts.push(
      desc
        ? `بر اساس دانش هادیران، موضوع «${topTopic.name}» یکی از محورهای اصلی است. ${desc}`
        : `بر اساس دانش هادیران، موضوع «${topTopic.name}» یکی از محورهای اصلی است.`
    );
  } else {
    parts.push("مسئله‌ات را گرفتم؛ این‌طور می‌توانیم شفافش کنیم.");
  }

  if (topKnowledge) {
    parts.push(`در دانشنامه، مطلب «${topKnowledge.title}» می‌تواند پاسخت را تکمیل کند.`);
  }
  if (topProject) {
    parts.push(
      `پروژهٔ «${topProject.name}» هم مرتبط است و می‌توانی وایت‌پیپر و بلوپرینت آن را ببینی.`
    );
  }
  if (topCourse) {
    parts.push(`اگر دنبال یادگیری عمیق‌تری هستی، دورهٔ «${topCourse.title}» پیشنهاد می‌شود.`);
  }

  return parts.join(" ");
}

export async function retrieveForQuery(query: string): Promise<AIResponse> {
  const tokens = normalize(query);
  if (tokens.length === 0) {
    return {
      answer:
        "سلام. مسئله‌ات را بگو تا با هم شفافش کنیم — از بازنمایی ایده تا معماری سیستم، هوش مصنوعی و وب۳.",
      references: EMPTY_REFERENCES,
      related: [],
    };
  }

  const patterns = tokens.map((t) => `%${t}%`);
  const merged = new Map<string, RetrievedEntity>();

  const [knowledgeMatches, projectMatches, courseMatches, topicMatches] = await Promise.all([
    db
      .select({
        id: knowledge.id,
        slug: knowledge.slug,
        title: knowledge.titleFa,
        summary: knowledge.summaryFa,
        body: knowledge.bodyFa,
      })
      .from(knowledge)
      .where(
        and(
          eq(knowledge.aiIndexable, true),
          or(
            ...patterns.flatMap((p) => [
              ilike(knowledge.titleFa, p),
              ilike(knowledge.summaryFa, p),
              ilike(knowledge.bodyFa, p),
            ])
          )
        )
      )
      .limit(8),
    db
      .select({
        id: projects.id,
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
          eq(projects.published, true),
          or(
            ...patterns.flatMap((p) => [
              ilike(projects.nameFa, p),
              ilike(projects.descriptionFa, p),
              ilike(projects.problemFa, p),
              ilike(projects.visionFa, p),
              ilike(projects.conceptFa, p),
            ])
          )
        )
      )
      .limit(8),
    db
      .select({
        id: courses.id,
        slug: courses.slug,
        title: courses.titleFa,
        summary: courses.descriptionFa,
      })
      .from(courses)
      .where(
        and(
          eq(courses.published, true),
          or(
            ...patterns.flatMap((p) => [
              ilike(courses.titleFa, p),
              ilike(courses.descriptionFa, p),
            ])
          )
        )
      )
      .limit(8),
    db
      .select({
        id: topics.id,
        slug: topics.slug,
        title: topics.labelFa,
        summary: topics.descriptionFa,
        labelEn: topics.labelEn,
      })
      .from(topics)
      .where(
        or(
          ...patterns.flatMap((p) => [
            ilike(topics.labelFa, p),
            ilike(topics.labelEn, p),
            ilike(topics.slug, p),
            ilike(topics.descriptionFa, p),
          ])
        )
      )
      .limit(8),
  ]);

  for (const k of knowledgeMatches) {
    mergeEntity(merged, {
      type: "knowledge",
      slug: k.slug,
      title: k.title,
      summary: k.summary,
      relevance: score(k.title, tokens) * 3 + score(k.summary, tokens) * 2 + score(k.body, tokens),
    });
  }

  for (const p of projectMatches) {
    mergeEntity(merged, {
      type: "project",
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      relevance:
        score(p.title, tokens) * 3 +
        score(p.summary, tokens) * 2 +
        score(p.problem, tokens) +
        score(p.vision, tokens) +
        score(p.concept, tokens),
    });
  }

  for (const c of courseMatches) {
    mergeEntity(merged, {
      type: "course",
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      relevance: score(c.title, tokens) * 3 + score(c.summary, tokens) * 2,
    });
  }

  for (const t of topicMatches) {
    mergeEntity(merged, {
      type: "topic",
      slug: t.slug,
      title: t.title,
      summary: t.summary,
      relevance:
        score(t.title, tokens) * 4 + score(t.labelEn, tokens) * 4 + score(t.summary, tokens) * 2 + 2,
    });
  }

  const topicIds = topicMatches.map((t) => t.id);
  if (topicIds.length > 0) {
    const [knowledgeLinks, projectLinks, courseLinks] = await Promise.all([
      db
        .select({ knowledgeId: knowledgeTopics.knowledgeId })
        .from(knowledgeTopics)
        .where(inArray(knowledgeTopics.topicId, topicIds)),
      db
        .select({ projectId: projectTopics.projectId })
        .from(projectTopics)
        .where(inArray(projectTopics.topicId, topicIds)),
      db
        .select({ courseId: courseTopics.courseId })
        .from(courseTopics)
        .where(inArray(courseTopics.topicId, topicIds)),
    ]);

    const kIds = [...new Set(knowledgeLinks.map((l) => l.knowledgeId))];
    const pIds = [...new Set(projectLinks.map((l) => l.projectId))];
    const cIds = [...new Set(courseLinks.map((l) => l.courseId))];

    const [hopKnowledge, hopProjects, hopCourses] = await Promise.all([
      kIds.length
        ? db
            .select({
              slug: knowledge.slug,
              title: knowledge.titleFa,
              summary: knowledge.summaryFa,
              body: knowledge.bodyFa,
            })
            .from(knowledge)
            .where(and(eq(knowledge.aiIndexable, true), inArray(knowledge.id, kIds)))
        : Promise.resolve([]),
      pIds.length
        ? db
            .select({
              slug: projects.slug,
              title: projects.nameFa,
              summary: projects.descriptionFa,
            })
            .from(projects)
            .where(and(eq(projects.published, true), inArray(projects.id, pIds)))
        : Promise.resolve([]),
      cIds.length
        ? db
            .select({
              slug: courses.slug,
              title: courses.titleFa,
              summary: courses.descriptionFa,
            })
            .from(courses)
            .where(and(eq(courses.published, true), inArray(courses.id, cIds)))
        : Promise.resolve([]),
    ]);

    const hopBonus = 8;
    for (const k of hopKnowledge) {
      mergeEntity(merged, {
        type: "knowledge",
        slug: k.slug,
        title: k.title,
        summary: k.summary,
        relevance: hopBonus + score(k.title, tokens) * 2 + score(k.summary, tokens),
      });
    }
    for (const p of hopProjects) {
      mergeEntity(merged, {
        type: "project",
        slug: p.slug,
        title: p.title,
        summary: p.summary,
        relevance: hopBonus + score(p.title, tokens) * 2 + score(p.summary, tokens),
      });
    }
    for (const c of hopCourses) {
      mergeEntity(merged, {
        type: "course",
        slug: c.slug,
        title: c.title,
        summary: c.summary,
        relevance: hopBonus + score(c.title, tokens) * 2 + score(c.summary, tokens),
      });
    }
  }

  const related = [...merged.values()].sort((a, b) => b.relevance - a.relevance);
  const knowledgeRanked = related.filter((e) => e.type === "knowledge");
  const projectRanked = related.filter((e) => e.type === "project");
  const courseRanked = related.filter((e) => e.type === "course");
  const topicRanked = related.filter((e) => e.type === "topic");

  const references = toReferences([
    ...topicRanked,
    ...knowledgeRanked,
    ...projectRanked,
    ...courseRanked,
  ]);

  return {
    answer: buildAnswer(references),
    references,
    related: related.slice(0, 8),
  };
}
