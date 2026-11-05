/**
 * resolve سمت سرور بلوک‌های زندهٔ استودیو از همان query/policy عمومی سایت.
 * دادهٔ رکوردها و کنترل‌های جستجو فقط هنگام رندر تزریق می‌شوند و در JSON ذخیره نمی‌شوند.
 */
import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  courseTopics,
  courses,
  knowledge,
  knowledgeTopics,
  memoryItems,
  projectTopics,
  projects,
  topics,
} from "@/db/schema";
import { loadAnalyzers, analyzerHref } from "@/lib/analyzers/catalog";
import { estimateLabelFa, roleBreakdownFa } from "@/lib/analyzers/estimate";
import { loadPublicPersonProfile, loadPublicPersonRecord } from "@/lib/public/person-profile";
import {
  loadPublicCourses,
  loadPublicKnowledgeList,
  loadPublicProjects,
  loadPublicShopList,
  loadPublicTopicKnowledgeCounts,
  loadPublicWorldCounts,
} from "@/lib/public/catalog";
import {
  publicCourseFilter,
  publicKnowledgeFilter,
  publicKnowledgeJoin,
  publicProjectFilter,
} from "@/lib/public/policy";
import { readPublicCollection, publicCountLabel, type PublicSource } from "@/lib/public/source";
import { formatMoney } from "@/lib/shop/money";
import { isShopKind, shopKindFa } from "@/lib/shop/kinds";
import { growthLabel, minutesFa, type KnowledgeGrowth } from "@/lib/knowledge/article";
import { safeInternalNext } from "@/lib/auth/next-path";
import { STUDIO_LIVE_BLOCKS, type StudioData } from "./validate";

export type StudioLiveItem = {
  title: string;
  href?: string;
  meta: string;
  badge?: string;
  action?: string;
  tags?: string[];
  progress?: number;
  imageUrl?: string;
  price?: string;
  comparePrice?: string;
};
type SearchParams = Record<string, string | string[] | undefined>;
type ControlLink = { href: string; label: string; active?: boolean };
type LiveControls = {
  action: string;
  q: string;
  placeholder: string;
  hidden?: Record<string, string | undefined>;
  groups?: { label?: string; links: ControlLink[] }[];
};

function param(params: SearchParams, key: string, max = 160): string {
  const value = params[key];
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" ? first.trim().slice(0, max) : "";
}

function limitOf(props: Record<string, unknown>): number {
  if (props.limit === "all") return Number.MAX_SAFE_INTEGER;
  const n = Number(props.limit);
  return [3, 6, 9].includes(n) ? n : 6;
}

function makeHref(path: string, params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    idea: "ایده",
    concept: "مفهوم",
    research: "تحقیق",
    prototype: "نمونهٔ اولیه",
    development: "توسعه",
    beta: "بتا",
    production: "تولید",
    archived: "بایگانی‌شده",
    preparing: "در آماده‌سازی",
    open: "باز",
  };
  return labels[status] ?? status;
}

type LiveFacets = { courseTopics?: { labelFa: string; slug: string }[] };

function controlsFor(type: string, params: SearchParams, facets: LiveFacets = {}, props: Record<string, unknown> = {}): LiveControls | undefined {
  const q = param(params, "q", 200);
  if (type === "KnowledgeList") {
    const topic = param(params, "topic", 120);
    const sortRaw = param(params, "sort", 16);
    const sort = sortRaw === "old" || sortRaw === "title" ? sortRaw : "new";
    const requestedView = param(params, "view", 8);
    const view = requestedView === "list" || (!requestedView && props.layout === "list") ? "list" : "cards";
    const short = param(params, "short", 1) === "1" ? "1" : "";
    const base = { topic: topic || undefined, q: q || undefined, sort, view, short: short || undefined };
    const query = (patch: Record<string, string | undefined>) => makeHref("/knowledge", { ...base, ...patch });
    const groups: LiveControls["groups"] = [
      { label: "مرتب‌سازی", links: [
        { href: query({ sort: "new" }), label: "تازه‌ترین", active: sort === "new" },
        { href: query({ sort: "old" }), label: "قدیمی‌ترین", active: sort === "old" },
        { href: query({ sort: "title" }), label: "الفبا", active: sort === "title" },
      ] },
      { label: "نمایش", links: [
        { href: query({ view: "cards" }), label: "کارت", active: view === "cards" },
        { href: query({ view: "list" }), label: "فهرست", active: view === "list" },
        { href: query({ short: short ? undefined : "1" }), label: "نوشتهٔ کوتاه (≤۵ دقیقه)", active: Boolean(short) },
      ] },
    ];
    if (topic) groups.push({ label: "موضوع", links: [{ href: "/knowledge", label: `پاک‌کردن: ${topic}`, active: true }] });
    return {
      action: "/knowledge",
      q,
      placeholder: "جستجو در باغ دانش...",
      hidden: { topic: topic || undefined, sort, view, short: short || undefined },
      groups,
    };
  }

  if (type === "AnalyzerGrid") {
    const status = param(params, "status", 24);
    const query = (nextStatus?: string) => makeHref("/analyzers", { q: q || undefined, status: nextStatus });
    return {
      action: "/analyzers",
      q,
      placeholder: "جستجو در نام آزمون‌ها...",
      hidden: { status: status || undefined },
      groups: [{ label: "وضعیت", links: [
        { href: query(undefined), label: "همه", active: !status },
        { href: query("open"), label: "باز", active: status === "open" },
        { href: query("preparing"), label: "در آماده‌سازی", active: status === "preparing" },
        { href: query("archived"), label: "بایگانی", active: status === "archived" },
      ] }],
    };
  }

  if (type === "ProjectPipeline") {
    const status = param(params, "status", 32);
    const base = { q: q || undefined, status: status || undefined };
    const query = (nextStatus?: string) => makeHref("/lab", { q: q || undefined, status: nextStatus });
    const available = ["idea", "concept", "research", "prototype", "development", "beta", "production"];
    const links: ControlLink[] = [{ href: query(undefined), label: "همه", active: !status }];
    for (const value of available) links.push({ href: query(value), label: statusLabel(value), active: status === value });
    return {
      action: "/lab",
      q,
      placeholder: "جستجو در نام و توضیح پروژه‌ها...",
      hidden: { status: base.status },
      groups: [{ label: "وضعیت", links }],
    };
  }

  if (type === "CourseGrid") {
    const typeFilter = param(params, "type", 16);
    const topic = param(params, "topic", 120);
    const base = { q: q || undefined, type: typeFilter || undefined, topic: topic || undefined };
    const query = (patch: Record<string, string | undefined>) => makeHref("/courses", { ...base, ...patch });
    const topicLinks: ControlLink[] = [
      { href: query({ topic: undefined }), label: "همهٔ موضوع‌ها", active: !topic },
      ...(facets.courseTopics ?? []).map((entry) => ({
        href: query({ topic: entry.slug }),
        label: entry.labelFa,
        active: topic === entry.slug,
      })),
    ];
    return {
      action: "/courses",
      q,
      placeholder: "جستجو در دوره‌ها...",
      hidden: { type: typeFilter || undefined, topic: topic || undefined },
      groups: [
        { label: "نوع", links: [
          { href: query({ type: undefined }), label: "همه", active: !typeFilter },
          { href: query({ type: "free" }), label: "رایگان", active: typeFilter === "free" },
          { href: query({ type: "paid" }), label: "فروشی", active: typeFilter === "paid" },
        ] },
        { label: "موضوع", links: topicLinks },
      ],
    };
  }

  if (type === "ShopGrid") {
    const kindRaw = param(params, "kind", 32);
    const kindBlock = typeof props.kind === "string" && isShopKind(props.kind) ? props.kind : "";
    const kind = isShopKind(kindRaw) ? kindRaw : kindBlock;
    const sortRaw = param(params, "sort", 24);
    const sort = ["price-asc", "price-desc", "title"].includes(sortRaw) ? sortRaw : "new";
    const base = { q: q || undefined, kind: kind || undefined, sort: sort === "new" ? undefined : sort };
    const query = (patch: Record<string, string | undefined>) => makeHref("/shop", { ...base, ...patch });
    return {
      action: "/shop",
      q,
      placeholder: "جستجو در نام و خلاصهٔ کالاها...",
      hidden: { kind: kind || undefined, sort: sort === "new" ? "new" : sort },
      groups: [
        { label: "نوع", links: [
          { href: query({ kind: undefined }), label: "همه", active: !kind },
          { href: query({ kind: "physical_good" }), label: "فیزیکی", active: kind === "physical_good" },
          { href: query({ kind: "digital_entitlement" }), label: "دیجیتال", active: kind === "digital_entitlement" },
          { href: query({ kind: "course_access" }), label: "دوره", active: kind === "course_access" },
        ] },
        { label: "مرتب‌سازی", links: [
          { href: query({ sort: "new" }), label: "تازه‌ترین", active: sort === "new" },
          { href: query({ sort: "price-asc" }), label: "ارزان‌ترین", active: sort === "price-asc" },
          { href: query({ sort: "price-desc" }), label: "گران‌ترین", active: sort === "price-desc" },
          { href: query({ sort: "title" }), label: "الفبا", active: sort === "title" },
        ] },
      ],
    };
  }

  return undefined;
}

type LiveItemsPayload = { items: StudioLiveItem[]; source: PublicSource; totalItems: number; facets?: LiveFacets };

async function knowledgeItems(props: Record<string, unknown>, params: SearchParams): Promise<LiveItemsPayload> {
  const topicSlugFromBlock = typeof props.topicSlug === "string" ? props.topicSlug : "";
  const topicSlug = topicSlugFromBlock || param(params, "topic", 120);
  const queryText = param(params, "q", 200);
  const list = await loadPublicKnowledgeList(queryText || undefined);
  let source = list.source;
  let items = list.items;
  if (topicSlug) {
    const topicMatches = await readPublicCollection("studio knowledge by topic", async () => {
      const rows = await db
        .select({ item: knowledge })
        .from(knowledge)
        .innerJoin(memoryItems, publicKnowledgeJoin)
        .innerJoin(knowledgeTopics, eq(knowledgeTopics.knowledgeId, knowledge.id))
        .innerJoin(topics, eq(knowledgeTopics.topicId, topics.id))
        .where(and(publicKnowledgeFilter, eq(topics.slug, topicSlug)));
      return rows.map((row) => row.item.id);
    });
    if (topicMatches.source !== "live") source = topicMatches.source;
    else {
      const allowed = new Set(topicMatches.items);
      items = items.filter((item) => allowed.has(item.id));
    }
  }
  if (param(params, "short", 1) === "1") items = items.filter((item) => typeof item.readingMinutes === "number" && item.readingMinutes <= 5);
  const sort = param(params, "sort", 16);
  items = [...items].sort((a, b) => {
    if (sort === "title") return a.titleFa.localeCompare(b.titleFa, "fa");
    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return sort === "old" ? at - bt : bt - at;
  });
  const visibleItems = items.slice(0, limitOf(props));
  const topicRows = visibleItems.length
    ? await readPublicCollection("studio public knowledge topics", () =>
        db.select({ knowledgeId: knowledgeTopics.knowledgeId, labelFa: topics.labelFa })
          .from(knowledgeTopics)
          .innerJoin(topics, eq(knowledgeTopics.topicId, topics.id))
          .where(inArray(knowledgeTopics.knowledgeId, visibleItems.map((item) => item.id))),
      )
    : { source: "live" as const, items: [] };
  if (topicRows.source !== "live" && source === "live") source = topicRows.source;
  const tagsByItem = new Map<number, string[]>();
  for (const row of topicRows.items) tagsByItem.set(row.knowledgeId, [...(tagsByItem.get(row.knowledgeId) ?? []), row.labelFa]);
  const typeLabels: Record<string, string> = { wiki: "ویکی", article: "مقاله", note: "یادداشت", research: "پژوهش", idea: "ایده" };
  return {
    source,
    totalItems: list.items.length,
    items: visibleItems.map((item) => ({
      title: item.titleFa,
      href: `/knowledge/${encodeURIComponent(item.slug)}`,
      badge: [growthLabel(item.growth as KnowledgeGrowth) || typeLabels[item.type] || item.type, minutesFa(item.readingMinutes)].filter(Boolean).join(" · "),
      meta: item.lineFa || item.summaryFa || "",
      tags: tagsByItem.get(item.id) ?? [],
      action: "خواندن",
    })),
  };
}

async function ecosystemItems(): Promise<LiveItemsPayload> {
  const [counts, copy] = await Promise.all([
    loadPublicWorldCounts(),
    import("@/lib/content/site-copy").then((module) => module.getSiteCopy()),
  ]);
  const { rooms } = copy;
  const worlds = [
    { room: rooms.knowledge, promise: "فکرهای تازه‌کاشته، در حال رشد و آزموده.", count: counts.knowledge, unit: "مطلب", action: "نوشته‌ای پیدا کن و بخوان" },
    { room: rooms.lab, promise: "ظرف‌ها و پروژه‌های باز؛ همکاری از صفحهٔ همان کار.", count: counts.projects, unit: "ظرف", action: "پروژه را ببین و راه همکاری را بخوان" },
    { room: rooms.mirrors, promise: "آزمون‌های منتشرشده با مرز روشن؛ خلاصه رایگان و تفسیر کامل جدا.", count: counts.analyzers, unit: "آزمون باز", action: "آزمون را انتخاب کن و شروع کن" },
    { room: rooms.courses, promise: "آموزش؛ تا دورهٔ واقعی نیاید خالی می‌ماند.", count: counts.courses, unit: "دوره", action: "مسیر یادگیری را ببین" },
    { room: rooms.shop, promise: "کالای فیزیکی و دیجیتال؛ پرداخت بیرون سایت و تحویل بعد از تأیید دریافت.", count: counts.shop, unit: "کالا", action: "محصول را مقایسه کن" },
    { room: rooms.person, promise: "مسیر، نگاه و راه‌های ارتباط شخص.", count: null, unit: "", action: "درباره من و راه تماس" },
  ];
  return {
    source: "live",
    totalItems: worlds.length,
    items: worlds.map(({ room, promise, count: publicCount, unit, action }) => ({
      title: room.label,
      href: room.href,
      meta: promise,
      badge: publicCount ? publicCountLabel(publicCount, unit) : "",
      action,
    })),
  };
}

async function itemsFor(type: string, props: Record<string, unknown>, params: SearchParams): Promise<LiveItemsPayload> {
  switch (type) {
    case "KnowledgeList":
      return knowledgeItems(props, params);
    case "EcosystemGrid":
      return ecosystemItems();
    case "ProjectPipeline": {
      const list = await loadPublicProjects();
      const topicLinks = await readPublicCollection("studio public project topics", async () =>
        db.select({ projectId: projectTopics.projectId, labelFa: topics.labelFa })
          .from(projectTopics)
          .innerJoin(topics, eq(projectTopics.topicId, topics.id)),
      );
      const tagsByProject = new Map<number, string[]>();
      for (const row of topicLinks.items) {
        tagsByProject.set(row.projectId, [...(tagsByProject.get(row.projectId) ?? []), row.labelFa]);
      }
      const q = param(params, "q", 200).toLowerCase();
      const status = param(params, "status", 32);
      const visible = list.items
        .filter((row) => !status || row.status === status)
        .filter((row) => !q || `${row.nameFa} ${row.descriptionFa ?? ""}`.toLowerCase().includes(q));
      return {
        source: list.source,
        totalItems: list.items.length,
        items: visible.slice(0, limitOf(props)).map((row) => ({
          title: row.nameFa,
          href: `/lab/${encodeURIComponent(row.slug)}`,
          meta: row.descriptionFa ?? "",
          badge: statusLabel(row.status),
          tags: tagsByProject.get(row.id) ?? [],
          progress: typeof row.progress === "number" ? row.progress : undefined,
          action: "مشاهدهٔ پروژه",
        })),
      };
    }
    case "CourseGrid": {
      const list = await loadPublicCourses();
      const topicLinks = await readPublicCollection("studio public course topics", async () =>
        db.select({ courseId: courseTopics.courseId, labelFa: topics.labelFa, slug: topics.slug })
          .from(courseTopics)
          .innerJoin(topics, eq(courseTopics.topicId, topics.id)),
      );
      const publicIds = new Set(list.items.map((course) => course.id));
      const topicByCourse = new Map<number, { labelFa: string; slug: string }[]>();
      for (const row of topicLinks.items) {
        if (!publicIds.has(row.courseId)) continue;
        topicByCourse.set(row.courseId, [...(topicByCourse.get(row.courseId) ?? []), { labelFa: row.labelFa, slug: row.slug }]);
      }
      const courseTopicOptions = [...new Map(
        [...topicByCourse.values()].flat().map((topic) => [topic.slug, topic]),
      ).values()];
      const q = param(params, "q", 200).toLowerCase();
      const typeFilter = param(params, "type", 16);
      const topicFilter = param(params, "topic", 120);
      const visible = list.items
        .filter((row) => !["free", "paid"].includes(typeFilter) || row.type === typeFilter)
        .filter((row) => !topicFilter || topicByCourse.get(row.id)?.some((topic) => topic.slug === topicFilter))
        .filter((row) => !q || `${row.titleFa} ${row.descriptionFa ?? ""}`.toLowerCase().includes(q));
      return {
        source: topicFilter && topicLinks.source !== "live" ? topicLinks.source : list.source,
        totalItems: list.items.length,
        facets: { courseTopics: courseTopicOptions },
        items: visible.slice(0, limitOf(props)).map((row) => ({
          title: row.titleFa,
          href: `/courses/${encodeURIComponent(row.slug)}`,
          meta: row.descriptionFa ?? "",
          tags: (topicByCourse.get(row.id) ?? []).map((topic) => topic.labelFa),
          badge: row.type === "free" ? "رایگان" : "فروشی",
          action: "ورود",
        })),
      };
    }
    case "AnalyzerGrid": {
      const analyzers = await loadAnalyzers();
      const q = param(params, "q", 200).toLowerCase();
      const status = param(params, "status", 24);
      const visible = analyzers
        .filter((item) => !status || item.status === status)
        .filter((item) => !q || `${item.nameFa} ${item.summaryFa}`.toLowerCase().includes(q));
      return {
        source: "live",
        totalItems: analyzers.length,
        items: visible.slice(0, limitOf(props)).map((item) => {
          const href = analyzerHref(item) ?? undefined;
          return {
            title: item.nameFa,
            href,
            meta: [item.summaryFa, `${item.estimate.questionCount.toLocaleString("fa-IR")} پرسش · ${item.estimate.sectionCount.toLocaleString("fa-IR")} بخش`, item.roleBreakdownFa].filter(Boolean).join("\n"),
            badge: `${statusLabel(item.status)} · ${estimateLabelFa(item.estimate.minutes)} (تخمین)`,
            action: href ? "شروع" : "",
          };
        }),
      };
    }
    case "TopicHub": {
      const topicList = await readPublicCollection("studio topics", async () => db.select().from(topics).orderBy(topics.slug));
      const [knowledgeCounts, projectCounts, courseCounts] = await Promise.all([
        loadPublicTopicKnowledgeCounts(),
        readPublicCollection("studio topic project counts", async () => db.select({ topicId: projectTopics.topicId, n: count() }).from(projectTopics).innerJoin(projects, eq(projectTopics.projectId, projects.id)).where(publicProjectFilter).groupBy(projectTopics.topicId)),
        readPublicCollection("studio topic course counts", async () => db.select({ topicId: courseTopics.topicId, n: count() }).from(courseTopics).innerJoin(courses, eq(courseTopics.courseId, courses.id)).where(publicCourseFilter).groupBy(courseTopics.topicId)),
      ]);
      const countMap = (rows: { topicId: number; n: number }[]) => new Map(rows.map((row) => [row.topicId, Number(row.n)]));
      const kMap = countMap(knowledgeCounts.items);
      const pMap = countMap(projectCounts.items);
      const cMap = countMap(courseCounts.items);
      const segment = (source: PublicSource, value: number) => source === "live" ? value.toLocaleString("fa-IR") : "—";
      return {
        source: topicList.source,
        totalItems: topicList.items.length,
        items: topicList.items.slice(0, limitOf(props)).map((topic) => ({
          title: topic.labelFa,
          href: `/topics/${encodeURIComponent(topic.slug)}`,
          meta: [topic.labelEn ?? "", topic.descriptionFa ?? "", `${segment(knowledgeCounts.source, kMap.get(topic.id) ?? 0)} دانش · ${segment(projectCounts.source, pMap.get(topic.id) ?? 0)} پروژه · ${segment(courseCounts.source, cMap.get(topic.id) ?? 0)} دوره`].filter(Boolean).join("\n"),
          action: "ورود",
        })),
      };
    }
    case "ShopGrid": {
      const kindBlock = typeof props.kind === "string" && isShopKind(props.kind) ? props.kind : "";
      const kindQuery = param(params, "kind", 32);
      const kind = isShopKind(kindQuery) ? kindQuery : kindBlock;
      const list = await loadPublicShopList(kind || undefined);
      const q = param(params, "q", 200).toLowerCase();
      const sortRaw = param(params, "sort", 24);
      const sort = ["price-asc", "price-desc", "title"].includes(sortRaw) ? sortRaw : "new";
      const visible = list.items
        .filter((item) => !q || `${item.titleFa} ${item.summaryFa ?? ""}`.toLowerCase().includes(q))
        .slice()
        .sort((a, b) => {
          if (sort === "price-asc") return a.amount - b.amount;
          if (sort === "price-desc") return b.amount - a.amount;
          if (sort === "title") return a.titleFa.localeCompare(b.titleFa, "fa");
          return 0;
        });
      return {
        source: list.source,
        totalItems: list.items.length,
        items: visible.slice(0, limitOf(props)).map((item) => ({
          title: item.titleFa,
          href: `/shop/${encodeURIComponent(item.slug)}`,
          meta: item.summaryFa ?? "",
          imageUrl: publicHref(item.coverImageUrl),
          badge: shopKindFa(item.kind),
          price: formatMoney(item.amount, item.currency ?? "IRR"),
          comparePrice: item.comparePrice && item.comparePrice > item.amount ? formatMoney(item.comparePrice, item.currency ?? "IRR") : undefined,
          action: "جزئیات",
        })),
      };
    }
    default:
      return { source: "live", totalItems: 0, items: [] };
  }
}
function publicHref(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const raw = value.trim();
  if (!raw || /[\\\u0000-\u001f\u007f]/.test(raw)) return undefined;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  if (/^(mailto:|tel:)/i.test(raw)) return raw;
  try {
    const parsed = new URL(raw);
    if (["https:", "http:"].includes(parsed.protocol) && parsed.hostname && !parsed.username && !parsed.password) return parsed.href;
  } catch {
    return undefined;
  }
  return undefined;
}

function personDetailsData(data: Awaited<ReturnType<typeof loadPublicPersonProfile>>["data"]) {
  if (!data) return null;
  const { hadiran, personSkillsList, personTopicsList, personOrganizationsList } = data;
  const contacts = Array.isArray(hadiran.contactMethods) ? hadiran.contactMethods : [];
  return {
    avatarUrl: publicHref(hadiran.avatarUrl) ?? null,
    nameFa: hadiran.nameFa,
    nameEn: hadiran.nameEn ?? null,
    perspectiveFa: hadiran.perspectiveFa ?? null,
    topics: personTopicsList.map((row) => ({ labelFa: row.labelFa, slug: row.slug })),
    skills: personSkillsList.map((row) => ({ labelFa: row.labelFa })),
    organizations: personOrganizationsList.map((row) => ({ nameFa: row.nameFa, roleFa: row.roleFa, url: publicHref(row.url) ?? null })),
    contacts: contacts.flatMap((method) => {
      if (!method || typeof method !== "object") return [];
      const raw = method as { label?: unknown; value?: unknown; url?: unknown };
      if (typeof raw.label !== "string" || typeof raw.value !== "string") return [];
      const url = publicHref(raw.url);
      return [{ label: raw.label.slice(0, 128), value: raw.value.slice(0, 256), ...(url ? { url } : {}) }];
    }),
  };
}

function activeLiveFilter(type: string, props: Record<string, unknown>, params: SearchParams): boolean {
  const q = param(params, "q", 200);
  if (type === "KnowledgeList") {
    return Boolean(q || param(params, "topic", 120) || param(params, "short", 1) === "1" || (typeof props.topicSlug === "string" && props.topicSlug));
  }
  if (type === "ProjectPipeline" || type === "AnalyzerGrid") return Boolean(q || param(params, "status", 32));
  if (type === "CourseGrid") return Boolean(q || ["free", "paid"].includes(param(params, "type", 16)) || param(params, "topic", 120));
  if (type === "ShopGrid") {
    const kind = param(params, "kind", 32);
    const sort = param(params, "sort", 24);
    const blockKind = typeof props.kind === "string" && isShopKind(props.kind) ? props.kind : "";
    return Boolean(q || isShopKind(kind) || blockKind || (["price-asc", "price-desc", "title"].includes(sort)));
  }
  return false;
}

function emptyTextFor(type: string): string {
  const messages: Record<string, string> = {
    KnowledgeList: "هنوز مطلب منتشرشده‌ای نیست.",
    ProjectPipeline: "هنوز پروژه‌ای ثبت نشده.",
    CourseGrid: "هنوز دوره‌ای منتشر نشده.",
    AnalyzerGrid: "آزمونی برای نمایش نیست.",
    TopicHub: "موضوعی ثبت نشده.",
    ShopGrid: "هنوز کالای منتشرشده‌ای نیست.",
  };
  return messages[type] ?? "هنوز داده‌ای برای نمایش نیست.";
}

function filteredEmptyTextFor(type: string): string {
  const messages: Record<string, string> = {
    KnowledgeList: "با این صافی چیزی نبود. جستجو یا صافی کوتاه/موضوع را بردار.",
    ProjectPipeline: "با این صافی پروژه‌ای نبود. صافی وضعیت یا جستجو را بردار.",
    CourseGrid: "با این صافی دوره‌ای نبود. نوع، موضوع یا جستجو را تغییر بده.",
    AnalyzerGrid: "با این صافی آزمونی نبود. وضعیت یا جستجو را تغییر بده.",
    TopicHub: "با این جستجو موضوعی نبود.",
    ShopGrid: "با این صافی کالایی نبود. نوع، مرتب‌سازی یا جستجو را تغییر بده.",
  };
  return messages[type] ?? "با این صافی موردی برای نمایش نیست.";
}

function contactMethodsData(data: Awaited<ReturnType<typeof loadPublicPersonRecord>>["data"]) {
  const methods = data && Array.isArray(data.contactMethods) ? data.contactMethods : [];
  return methods.flatMap((method) => {
    if (!method || typeof method !== "object") return [];
    const raw = method as { label?: unknown; value?: unknown; url?: unknown };
    if (typeof raw.label !== "string" || typeof raw.value !== "string") return [];
    const url = publicHref(raw.url);
    return [{ label: raw.label.slice(0, 128), value: raw.value.slice(0, 256), ...(url ? { url } : {}) }];
  });
}

export type StudioResolveOptions = {
  mode?: "preview" | "public";
  signInNextPath?: string;
  searchParams?: SearchParams;
};

function safeNextPath(value: string | undefined): string {
  return safeInternalNext(value);
}

/** دادهٔ زنده/پویا فقط در پاسخ رندر resolve می‌شود؛ هیچ‌کدام به draft یا snapshot نمی‌چسبد. */
export async function resolveStudioData(data: StudioData, options: StudioResolveOptions = {}): Promise<StudioData> {
  const searchParams = options.searchParams ?? {};
  let personProfilePromise: ReturnType<typeof loadPublicPersonProfile> | undefined;
  const getPersonProfile = () => personProfilePromise ??= loadPublicPersonProfile();
  const content = await Promise.all(
    data.content.map(async (block) => {
      if (block.type === "PersonPage" || block.type === "PersonDetails") {
        const profile = await getPersonProfile();
        return { ...block, props: { ...block.props, profile: personDetailsData(profile.data), source: profile.source } };
      }
      if (block.type === "ContactMethods") {
        const profile = await loadPublicPersonRecord();
        return { ...block, props: { ...block.props, methods: contactMethodsData(profile.data), source: profile.source } };
      }
      if (STUDIO_LIVE_BLOCKS.includes(block.type)) {
        const payload = await itemsFor(block.type, block.props, searchParams);
        const controls = controlsFor(block.type, searchParams, payload.facets, block.props);
        return {
          ...block,
          props: {
            ...block.props,
            ...(block.type === "KnowledgeList" && ["cards", "list"].includes(param(searchParams, "view", 8))
              ? { layout: param(searchParams, "view", 8) }
              : {}),
            items: payload.items,
            liveSource: payload.source,
            totalItems: payload.totalItems,
            hasActiveFilter: activeLiveFilter(block.type, block.props, searchParams),
            emptyMessage: emptyTextFor(block.type),
            filteredEmptyMessage: filteredEmptyTextFor(block.type),
            ...(controls ? { controls } : {}),
          },
        };
      }
      if (block.type === "HadiranHomeHero") {
        return { ...block, props: { ...block.props, interactive: options.mode === "public" } };
      }
      if (block.type === "SignInPanel") {
        return { ...block, props: { ...block.props, nextPath: safeNextPath(options.signInNextPath) } };
      }
      return block;
    }),
  );
  return { content, root: data.root };
}
