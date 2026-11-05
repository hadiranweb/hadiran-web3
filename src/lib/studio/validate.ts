/**
 * اعتبارسنجی دادهٔ Puck پیش از ذخیره، انتشار و رندر عمومی.
 * فقط بلوک‌های مجاز هادیران و props پاک؛ HTML آزاد و اسکریپت راه ندارد.
 */

export const STUDIO_BLOCK_TYPES = [
  "PageHero",
  "HadiranHomeHero",
  "HomeMarquee",
  "HomeFlow",
  "HomeRooms",
  "SectionHeader",
  "RichText",
  "BentoGrid",
  "FAQ",
  "CTABand",
  "Divider",
  "KnowledgeList",
  "ProjectPipeline",
  "CourseGrid",
  "AnalyzerGrid",
  "TopicHub",
  "ShopGrid",
  "SignInPanel",
  "AccountPanel",
  "EcosystemGrid",
  "PersonDetails",
  "PersonPage",
  "ContactMethods",
] as const;

/** بلوک‌های زنده: در Data فقط تنظیمات می‌ماند؛ آیتم‌ها هنگام رندر از دادهٔ واقعی resolve می‌شوند و ذخیره نمی‌شوند. */
export const STUDIO_LIVE_BLOCKS: readonly StudioBlockType[] = [
  "KnowledgeList",
  "ProjectPipeline",
  "CourseGrid",
  "AnalyzerGrid",
  "TopicHub",
  "ShopGrid",
  "EcosystemGrid",
  "PersonDetails",
  "ContactMethods",
];

export type StudioBlockType = (typeof STUDIO_BLOCK_TYPES)[number];
export type StudioTarget = string;
export type StudioValidationOptions = { target?: StudioTarget; forPublish?: boolean };

const MAX_BLOCKS = 60;
const MAX_TEXT = 4000;
const MAX_FAQ_ITEMS = 30;

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
  // مسیرهای نسبیِ هم‌مبدأ؛ backslash و // می‌توانند به URL خارجی نرمال شوند.
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) return raw;
  if (!/^https:\/\//i.test(raw)) return "";
  try {
    const parsed = new URL(raw);
    if (!parsed.hostname || parsed.username || parsed.password) return "";
    return parsed.href;
  } catch {
    return "";
  }
}

const REQUIRED_LIVE_LIST_BLOCKS: Record<string, StudioBlockType> = {
  "site:knowledge": "KnowledgeList",
  "site:analyzers": "AnalyzerGrid",
  "site:lab": "ProjectPipeline",
  "site:courses": "CourseGrid",
  "site:shop": "ShopGrid",
  "site:topics": "TopicHub",
};

const SYSTEM_BLOCK_TARGETS: Partial<Record<StudioBlockType, string>> = {
  HadiranHomeHero: "site:home",
  HomeMarquee: "site:home",
  HomeFlow: "site:home",
  HomeRooms: "site:home",
  SignInPanel: "site:signin",
  AccountPanel: "site:account",
  EcosystemGrid: "site:ecosystem",
  PersonDetails: "site:person",
  PersonPage: "site:person",
  ContactMethods: "site:contact",
};

export const STUDIO_TARGET_BLOCKS = Object.keys(SYSTEM_BLOCK_TARGETS) as StudioBlockType[];

const STRING_PROPS: Record<StudioBlockType, string[]> = {
  PageHero: ["kicker", "title", "lead", "primaryLabel", "secondaryLabel"],
  HadiranHomeHero: ["kicker", "title", "lead", "roomsLine", "brandName"],
  HomeMarquee: [],
  HomeFlow: ["kicker", "title", "lead"],
  HomeRooms: ["kicker", "title", "mapLabel"],
  SectionHeader: ["kicker", "title", "lead"],
  RichText: ["body"],
  BentoGrid: ["title"],
  FAQ: ["heading"],
  CTABand: ["title", "lead", "label"],
  Divider: [],
  KnowledgeList: ["heading", "topicSlug"],
  ProjectPipeline: ["heading"],
  CourseGrid: ["heading"],
  AnalyzerGrid: ["heading"],
  TopicHub: ["heading"],
  ShopGrid: ["heading", "kind"],
  SignInPanel: ["heading", "lead"],
  AccountPanel: [],
  EcosystemGrid: ["heading"],
  PersonDetails: [],
  PersonPage: ["fallbackName", "fallbackKicker", "intro", "missingText"],
  ContactMethods: ["emptyText"],
};

const HREF_PROPS: Record<StudioBlockType, string[]> = {
  PageHero: ["primaryHref", "secondaryHref"],
  HadiranHomeHero: [],
  HomeMarquee: [],
  HomeFlow: [],
  HomeRooms: ["mapHref"],
  SectionHeader: [],
  RichText: [],
  BentoGrid: [],
  FAQ: [],
  CTABand: ["href"],
  Divider: [],
  KnowledgeList: [],
  ProjectPipeline: [],
  CourseGrid: [],
  AnalyzerGrid: [],
  TopicHub: [],
  ShopGrid: [],
  SignInPanel: [],
  AccountPanel: [],
  EcosystemGrid: [],
  PersonDetails: [],
  PersonPage: [],
  ContactMethods: [],
};

const ENUM_PROPS: Record<StudioBlockType, Record<string, string[]>> = {
  PageHero: { align: ["start", "center"] },
  HadiranHomeHero: {},
  HomeMarquee: {},
  HomeFlow: {},
  HomeRooms: {},
  SectionHeader: { align: ["start", "center"] },
  RichText: { mode: ["paragraphs", "bullets"] },
  BentoGrid: { columns: ["2", "3"] },
  FAQ: {},
  CTABand: {},
  Divider: { space: ["sm", "md", "lg"] },
  KnowledgeList: { limit: ["3", "6", "9", "all"], layout: ["cards", "list"] },
  ProjectPipeline: { limit: ["3", "6", "9", "all"], layout: ["cards", "list"] },
  CourseGrid: { limit: ["3", "6", "9", "all"], layout: ["cards", "list"] },
  AnalyzerGrid: { limit: ["3", "6", "9", "all"], layout: ["cards", "list"] },
  TopicHub: { limit: ["3", "6", "9", "all"], layout: ["cards", "list"] },
  ShopGrid: { limit: ["3", "6", "9", "all"], layout: ["cards", "list"] },
  SignInPanel: {},
  AccountPanel: {},
  EcosystemGrid: {},
  PersonDetails: {},
  PersonPage: {},
  ContactMethods: {},
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
    out.items = items
      .filter(isRecord)
      .map((item) => ({
        title: cleanString(item.title, 256),
        body: cleanString(item.body, 1000),
        badge: cleanString(item.badge, 80),
        href: cleanHref(item.href),
      }))
      .filter((item) => Boolean(item.title.trim() || item.body.trim() || item.href))
      .filter((item) => !(item.title.trim() === "کارت" && !item.body.trim() && !item.badge.trim() && !item.href));
  }
  if (type === "HomeMarquee") {
    out.items = (Array.isArray(raw.items) ? raw.items.slice(0, 12) : [])
      .filter(isRecord)
      .map((item) => ({ label: cleanString(item.label, 128) }))
      .filter((item) => item.label.trim());
  }
  if (type === "HomeFlow") {
    out.items = (Array.isArray(raw.items) ? raw.items.slice(0, 12) : [])
      .filter(isRecord)
      .map((item) => ({
        n: cleanString(item.n, 32),
        title: cleanString(item.title, 256),
        body: cleanString(item.body, 1000),
      }))
      .filter((item) => item.n || item.title.trim() || item.body.trim());
  }
  if (type === "HomeRooms") {
    out.items = (Array.isArray(raw.items) ? raw.items.slice(0, 12) : [])
      .filter(isRecord)
      .map((item) => ({ label: cleanString(item.label, 128), href: cleanHref(item.href) }))
      .filter((item) => item.label.trim() || item.href);
  }
  // حذف پیش‌فرض‌های دیده‌شدهٔ نسخهٔ نخست، تا در صفحه‌های قدیمی به‌صورت محتوای جعلی نمانند.
  if (type === "PageHero" && out.title === "عنوان صفحه") out.title = "";
  if (type === "SectionHeader" && out.title === "عنوان بخش") out.title = "";
  if (type === "CTABand" && out.label === "شروع" && out.href === "/" && !out.title && !out.lead) {
    out.label = "";
    out.href = "";
  }
  if (type === "FAQ") {
    const items = Array.isArray(raw.items) ? raw.items.slice(0, MAX_FAQ_ITEMS) : [];
    out.items = items
      .filter(isRecord)
      .map((item) => ({
        question: cleanString(item.question, 256),
        answer: cleanString(item.answer, 3000),
      }))
      .filter((item) => item.question.trim() || item.answer.trim());
  }
  return out;
}

export interface StudioData {
  content: { type: StudioBlockType; props: Record<string, unknown> & { id?: string } }[];
  root: { props?: Record<string, unknown> };
}

/**
 * دادهٔ ورودی را به شکل امن و محدود برمی‌گرداند؛ null یعنی نامعتبر.
 * target در API واقعی صفحه پاس می‌شود تا بلوک‌های سیستمی به مسیر اشتباه نروند.
 */
export function validateStudioData(input: unknown, options: StudioValidationOptions = {}): StudioData | null {
  if (!isRecord(input)) return null;
  const content = input.content;
  if (!Array.isArray(content) || content.length > MAX_BLOCKS) return null;
  const cleaned: StudioData["content"] = [];
  for (const entry of content) {
    if (!isRecord(entry) || typeof entry.type !== "string") return null;
    if (!(STUDIO_BLOCK_TYPES as readonly string[]).includes(entry.type)) return null;
    const type = entry.type as StudioBlockType;
    const expectedTarget = SYSTEM_BLOCK_TARGETS[type];
    if (options.target && expectedTarget && options.target !== expectedTarget) return null;
    const props = isRecord(entry.props) ? entry.props : {};
    let id = typeof props.id === "string" ? props.id.trim().slice(0, 64) : "";
    if (!id || cleaned.some((block) => block.props.id === id)) {
      const base = `studio-${type.toLowerCase()}-${cleaned.length + 1}`;
      id = base;
      let suffix = 2;
      while (cleaned.some((block) => block.props.id === id)) {
        id = `${base}-${suffix}`;
        suffix += 1;
      }
    }
    cleaned.push({
      type,
      props: {
        ...cleanProps(type, props),
        id,
      },
    });
  }
  const root = isRecord(input.root) ? input.root : {};
  const rootProps = isRecord(root.props) ? root.props : {};
  const data: StudioData = {
    content: cleaned,
    root: {
      props: {
        title: cleanString(rootProps.title, 256),
      },
    },
  };
  if (options.forPublish && !hasValidPageComposition(data, options.target)) return null;
  return data;
}

/** ترکیب انتشار: یک H1 و بلوک سیستمیِ الزامی در مسیرهای ورود/حساب/خانه. */
export function hasValidPageComposition(data: StudioData, target?: StudioTarget): boolean {
  const types = data.content.map((block) => block.type);
  const pageHeroCount = types.filter((type) => type === "PageHero").length;
  const hadiranHeroCount = types.filter((type) => type === "HadiranHomeHero").length;
  const signInCount = types.filter((type) => type === "SignInPanel").length;
  const accountCount = types.filter((type) => type === "AccountPanel").length;
  const ecosystemCount = types.filter((type) => type === "EcosystemGrid").length;
  const personDetailsCount = types.filter((type) => type === "PersonDetails").length;
  const personPageCount = types.filter((type) => type === "PersonPage").length;
  const contactMethodsCount = types.filter((type) => type === "ContactMethods").length;
  if (target === "site:person" && personPageCount > 0) {
    const personPage = data.content.find((block) => block.type === "PersonPage");
    return personPageCount === 1 && pageHeroCount === 0 && personDetailsCount === 0 &&
      hadiranHeroCount === 0 && signInCount === 0 && accountCount === 0 &&
      typeof personPage?.props.fallbackName === "string" && Boolean(personPage.props.fallbackName.trim());
  }
  const h1Count = pageHeroCount + hadiranHeroCount + signInCount + accountCount;
  if (h1Count !== 1) return false;
  const h1Block = data.content.find((block) => ["PageHero", "HadiranHomeHero", "SignInPanel"].includes(block.type));
  if (h1Block && typeof h1Block.props.title === "string" && !h1Block.props.title.trim()) return false;
  if (h1Block && typeof h1Block.props.heading === "string" && !h1Block.props.heading.trim()) return false;

  if (target === "site:home") return hadiranHeroCount === 1;
  const requiredLiveBlock = target ? REQUIRED_LIVE_LIST_BLOCKS[target] : undefined;
  if (requiredLiveBlock) return pageHeroCount === 1 && types.filter((type) => type === requiredLiveBlock).length === 1;
  if (target === "site:signin") {
    const block = data.content.find((entry) => entry.type === "SignInPanel");
    return signInCount === 1 && Boolean(block?.props.heading);
  }
  if (target === "site:account") return accountCount === 1;
  if (target === "site:ecosystem") return pageHeroCount === 1 && ecosystemCount === 1;
  if (target === "site:person") return pageHeroCount === 1 && personDetailsCount === 1;
  if (target === "site:contact") return pageHeroCount === 1 && contactMethodsCount === 1;
  if (target?.startsWith("site:")) return pageHeroCount === 1;
  return pageHeroCount === 1;
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
