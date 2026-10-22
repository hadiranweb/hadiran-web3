/**
 * اعتبارسنجی دادهٔ Puck پیش از ذخیره و پیش از رندر عمومی.
 * فقط بلوک‌های مجاز هادیران، فقط props پاک؛ HTML آزاد و اسکریپت راه ندارد.
 */

export const STUDIO_BLOCK_TYPES = [
  "PageHero",
  "SectionHeader",
  "RichText",
  "BentoGrid",
  "CTABand",
  "Divider",
  "KnowledgeList",
  "ProjectPipeline",
  "CourseGrid",
  "AnalyzerGrid",
  "TopicHub",
  "ShopGrid",
] as const;

/** بلوک‌های زنده: در Data فقط تنظیمات می‌ماند؛ آیتم‌ها هنگام رندر از دادهٔ واقعی resolve می‌شوند و ذخیره نمی‌شوند. */
export const STUDIO_LIVE_BLOCKS: readonly StudioBlockType[] = [
  "KnowledgeList",
  "ProjectPipeline",
  "CourseGrid",
  "AnalyzerGrid",
  "TopicHub",
  "ShopGrid",
];

export type StudioBlockType = (typeof STUDIO_BLOCK_TYPES)[number];

const MAX_ITEMS = 60;
const MAX_TEXT = 4000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown, max = MAX_TEXT): string {
  if (typeof value !== "string") return "";
  return value.replace(/<script[\s\S]*?<\/script>/gi, "").slice(0, max);
}

function cleanHref(value: unknown): string {
  const raw = cleanString(value, 512).trim();
  if (!raw) return "";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  if (/^https:\/\//i.test(raw)) return raw;
  return "";
}

const STRING_PROPS: Record<StudioBlockType, string[]> = {
  PageHero: ["kicker", "title", "lead", "primaryLabel", "secondaryLabel"],
  SectionHeader: ["kicker", "title", "lead"],
  RichText: ["body"],
  BentoGrid: ["title"],
  CTABand: ["title", "lead", "label"],
  Divider: [],
  KnowledgeList: ["heading", "topicSlug"],
  ProjectPipeline: ["heading"],
  CourseGrid: ["heading"],
  AnalyzerGrid: ["heading"],
  TopicHub: ["heading"],
  ShopGrid: ["heading", "kind"],
};

const HREF_PROPS: Record<StudioBlockType, string[]> = {
  PageHero: ["primaryHref", "secondaryHref"],
  SectionHeader: [],
  RichText: [],
  BentoGrid: [],
  CTABand: ["href"],
  Divider: [],
  KnowledgeList: [],
  ProjectPipeline: [],
  CourseGrid: [],
  AnalyzerGrid: [],
  TopicHub: [],
  ShopGrid: [],
};

const ENUM_PROPS: Record<StudioBlockType, Record<string, string[]>> = {
  PageHero: { align: ["start", "center"] },
  SectionHeader: { align: ["start", "center"] },
  RichText: {},
  BentoGrid: { columns: ["2", "3"] },
  CTABand: {},
  Divider: { space: ["sm", "md", "lg"] },
  KnowledgeList: { limit: ["3", "6", "9"], layout: ["cards", "list"] },
  ProjectPipeline: { limit: ["3", "6", "9"], layout: ["cards", "list"] },
  CourseGrid: { limit: ["3", "6", "9"], layout: ["cards", "list"] },
  AnalyzerGrid: { limit: ["3", "6", "9"], layout: ["cards", "list"] },
  TopicHub: { limit: ["3", "6", "9"], layout: ["cards", "list"] },
  ShopGrid: { limit: ["3", "6", "9"], layout: ["cards", "list"] },
};

function cleanProps(type: StudioBlockType, raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of STRING_PROPS[type]) out[key] = cleanString(raw[key]);
  for (const key of HREF_PROPS[type]) out[key] = cleanHref(raw[key]);
  for (const [key, allowed] of Object.entries(ENUM_PROPS[type])) {
    out[key] = allowed.includes(String(raw[key])) ? String(raw[key]) : allowed[0];
  }
  if (typeof out.topicSlug === "string" && !/^[a-z0-9][a-z0-9-_]{0,120}$/.test(out.topicSlug)) out.topicSlug = "";
  if (typeof out.kind === "string" && !/^[a-z0-9-]{0,32}$/.test(out.kind)) out.kind = "";
  if (type === "BentoGrid") {
    const items = Array.isArray(raw.items) ? raw.items.slice(0, 8) : [];
    out.items = items.filter(isRecord).map((item) => ({
      title: cleanString(item.title, 256),
      body: cleanString(item.body, 1000),
    }));
  }
  return out;
}

export interface StudioData {
  content: { type: StudioBlockType; props: Record<string, unknown> & { id?: string } }[];
  root: { props?: Record<string, unknown> };
}

/** دادهٔ ورودی را به شکل امن و محدود برمی‌گرداند؛ null یعنی نامعتبر. */
export function validateStudioData(input: unknown): StudioData | null {
  if (!isRecord(input)) return null;
  const content = input.content;
  if (!Array.isArray(content) || content.length > MAX_ITEMS) return null;
  const cleaned: StudioData["content"] = [];
  for (const entry of content) {
    if (!isRecord(entry) || typeof entry.type !== "string") return null;
    if (!(STUDIO_BLOCK_TYPES as readonly string[]).includes(entry.type)) return null;
    const type = entry.type as StudioBlockType;
    const props = isRecord(entry.props) ? entry.props : {};
    cleaned.push({
      type,
      props: {
        ...cleanProps(type, props),
        ...(typeof props.id === "string" ? { id: props.id.slice(0, 64) } : {}),
      },
    });
  }
  const root = isRecord(input.root) ? input.root : {};
  const rootProps = isRecord(root.props) ? root.props : {};
  return {
    content: cleaned,
    root: {
      props: {
        title: cleanString(rootProps.title, 256),
      },
    },
  };
}

export function cleanSeo(input: unknown): Record<string, unknown> {
  if (!isRecord(input)) return {};
  const index = input.index === false ? false : true;
  return {
    title: cleanString(input.title, 256),
    description: cleanString(input.description, 512),
    canonical: cleanHref(input.canonical),
    index,
  };
}

export function cleanSlug(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const slug = input.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-_]{1,120}$/.test(slug)) return null;
  return slug;
}

export const EMPTY_STUDIO_DATA: StudioData = { content: [], root: { props: { title: "" } } };
