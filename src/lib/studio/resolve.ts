/**
 * resolve سمت سرور بلوک‌های زندهٔ استودیو از کوئری‌های عمومی فعلی هادیران.
 * فقط دادهٔ عمومی (همان فیلترهای policy سایت) خوانده می‌شود؛ DB نباشد، خالیِ واقعی برمی‌گردد.
 */
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { knowledge, knowledgeTopics, topics } from "@/db/schema";
import { loadAnalyzers } from "@/lib/analyzers/catalog";
import {
  loadPublicCourses,
  loadPublicKnowledgeList,
  loadPublicProjects,
  loadPublicShopList,
} from "@/lib/public/catalog";
import { publicKnowledgeFilter, publicKnowledgeJoin } from "@/lib/public/policy";
import { readPublicCollection } from "@/lib/public/source";
import { memoryItems } from "@/db/schema";
import { STUDIO_LIVE_BLOCKS, type StudioData } from "./validate";

export type StudioLiveItem = { title: string; href: string; meta: string };

function limitOf(props: Record<string, unknown>): number {
  const n = Number(props.limit);
  return [3, 6, 9].includes(n) ? n : 6;
}

async function knowledgeItems(props: Record<string, unknown>): Promise<StudioLiveItem[]> {
  const topicSlug = typeof props.topicSlug === "string" ? props.topicSlug : "";
  if (topicSlug) {
    const { items } = await readPublicCollection("studio knowledge by topic", async () => {
      const rows = await db
        .select({ item: knowledge })
        .from(knowledge)
        .innerJoin(memoryItems, publicKnowledgeJoin)
        .innerJoin(knowledgeTopics, eq(knowledgeTopics.knowledgeId, knowledge.id))
        .innerJoin(topics, eq(knowledgeTopics.topicId, topics.id))
        .where(and(publicKnowledgeFilter, eq(topics.slug, topicSlug)));
      return rows.map((r) => r.item);
    });
    return items.slice(0, limitOf(props)).map((row) => ({
      title: row.titleFa,
      href: `/knowledge/${row.slug}`,
      meta: row.summaryFa ?? "",
    }));
  }
  const { items } = await loadPublicKnowledgeList();
  return items.slice(0, limitOf(props)).map((row) => ({
    title: row.titleFa,
    href: `/knowledge/${row.slug}`,
    meta: row.summaryFa ?? "",
  }));
}

async function itemsFor(type: string, props: Record<string, unknown>): Promise<StudioLiveItem[]> {
  switch (type) {
    case "KnowledgeList":
      return knowledgeItems(props);
    case "ProjectPipeline": {
      const { items } = await loadPublicProjects();
      return items.slice(0, limitOf(props)).map((row) => ({
        title: row.nameFa,
        href: "/ecosystem",
        meta: row.descriptionFa ?? "",
      }));
    }
    case "CourseGrid": {
      const { items } = await loadPublicCourses();
      return items.slice(0, limitOf(props)).map((row) => ({
        title: row.titleFa,
        href: `/courses/${row.slug}`,
        meta: row.descriptionFa ?? "",
      }));
    }
    case "AnalyzerGrid": {
      try {
        const list = await loadAnalyzers();
        return list
          .filter((a) => a.status === "open")
          .slice(0, limitOf(props))
          .map((a) => ({ title: a.nameFa, href: `/analyzers/${a.slug}`, meta: a.summaryFa }));
      } catch {
        return [];
      }
    }
    case "TopicHub": {
      const { items } = await readPublicCollection("studio topics", async () =>
        db.select().from(topics).orderBy(topics.slug),
      );
      return items.slice(0, limitOf(props)).map((row) => ({
        title: row.labelFa,
        href: `/topics/${row.slug}`,
        meta: row.descriptionFa ?? "",
      }));
    }
    case "ShopGrid": {
      const kind = typeof props.kind === "string" && props.kind ? props.kind : null;
      const { items } = await loadPublicShopList(kind);
      return items.slice(0, limitOf(props)).map((row) => ({
        title: row.titleFa,
        href: `/shop/${row.slug}`,
        meta: row.summaryFa ?? "",
      }));
    }
    default:
      return [];
  }
}

/** نسخهٔ resolveشدهٔ داده برای رندر؛ آیتم‌های زنده داخل props می‌نشینند و هرگز ذخیره نمی‌شوند. */
export async function resolveStudioData(data: StudioData): Promise<StudioData> {
  const content = await Promise.all(
    data.content.map(async (block) => {
      if (!STUDIO_LIVE_BLOCKS.includes(block.type)) return block;
      const items = await itemsFor(block.type, block.props).catch(() => [] as StudioLiveItem[]);
      return { ...block, props: { ...block.props, items } };
    }),
  );
  return { content, root: data.root };
}
