/**
 * رجیستری متن — «دیسک».
 *
 * هر متن قابل ویرایش یک کلید معنایی دارد: `group.key`. اینجا:
 *  - مقدار پیش‌فرض (fallback وقتی DB نیست یا کلید override نشده)
 *  - فراداده‌ای که ویرایشگر لازم دارد (برچسب، راهنما، سقف طول، چندخطی، محل مصرف)
 *
 * این فایل خالص است (بدون DB و بدون server-only) تا در تست و کلاینت هم قابل import باشد.
 */

import {
  contactCopy,
  homeFlow,
  houseCopy,
  knowledgeCopy,
  labCopy,
  mirrorsCopy,
  navNotes,
  personCopy,
  rooms,
  siteCopy,
  voice,
} from "@/lib/copy";

export const COPY_GROUPS = [
  "voice",
  "rooms",
  "notes",
  "house",
  "knowledge",
  "mirrors",
  "lab",
  "home",
  "person",
  "contact",
  "site",
] as const;

export type CopyGroup = (typeof COPY_GROUPS)[number];

export const GROUP_LABELS: Record<CopyGroup, { title: string; hint: string }> = {
  voice: { title: "صدای خانه", hint: "شعار، عنوان مرورگر و جمله‌هایی که در همان نگاه اول دیده می‌شوند." },
  rooms: { title: "نام اتاق‌ها", hint: "برچسبی که در ناو و فوتر دیده می‌شود. مسیر URL عوض نمی‌شود." },
  notes: { title: "توضیح اتاق‌ها", hint: "یک جملهٔ کوتاه زیر نام هر اتاق در پنل ناوبری." },
  house: { title: "اتاق خانه", hint: "تیتر و lede صفحهٔ /ecosystem." },
  knowledge: { title: "باغ دانش", hint: "تیتر و lede فهرست /knowledge." },
  mirrors: { title: "آینه‌ها", hint: "تیتر و lede فهرست /analyzers." },
  lab: { title: "کارگاه", hint: "تیتر و lede فهرست /lab." },
  home: { title: "سه گام خانه", hint: "بلوک «از حرف تا ظرف» در صفحهٔ خانه." },
  person: { title: "متن درباره من", hint: "جمله‌های صفحهٔ /hadiran. خودِ هویت در فاز بعد می‌آید." },
  contact: { title: "تماس", hint: "پیامی که وقتی راه ارتباطی خالی است دیده می‌شود." },
  site: { title: "نام و امضای سایت", hint: "نام برند و جملهٔ فوتر." },
};

export type CopyField = {
  key: string;
  group: CopyGroup;
  label: string;
  hint?: string;
  maxLength: number;
  multiline?: boolean;
  usedAt: string[];
  /** مسیر مقدار در شیء SiteCopy؛ کلید فقط برای انسان است. */
  path: (string | number)[];
};

const f = (
  key: string,
  group: CopyGroup,
  label: string,
  path: (string | number)[],
  maxLength: number,
  usedAt: string[],
  extra: { hint?: string; multiline?: boolean } = {},
): CopyField => ({ key, group, label, path, maxLength, usedAt, ...extra });

const NAV_AT = ["src/components/Nav.tsx", "src/components/Footer.tsx"];

export const COPY_FIELDS: CopyField[] = [
  // ---------- voice ----------
  f("voice.browserTitle", "voice", "عنوان مرورگر (تب)", ["voice", "browserTitle"], 90,
    ["src/app/page.tsx", "src/app/manifest.ts"], { hint: "در تب مرورگر و نام اپ نصب‌شده دیده می‌شود." }),
  f("voice.altTitle", "voice", "عنوان جایگزین", ["voice", "altTitle"], 90,
    ["src/app/page.tsx", "src/app/hadiran/page.tsx"], { hint: "در اشتراک‌گذاری شبکه‌های اجتماعی و بالای صفحهٔ درباره من." }),
  f("voice.slogan", "voice", "شعار اصلی (H1 خانه)", ["voice", "slogan"], 120,
    ["src/app/page.tsx"]),
  f("voice.subSlogan", "voice", "زیرشعار", ["voice", "subSlogan"], 160,
    ["src/app/page.tsx"]),
  f("voice.distinction", "voice", "جملهٔ تمایز", ["voice", "distinction"], 80,
    ["src/app/page.tsx"], { hint: "خط کوچک بالای شعار." }),
  f("voice.roomsLine", "voice", "خط معرفی اتاق‌ها", ["voice", "roomsLine"], 160,
    ["src/app/page.tsx"]),
  f("voice.description", "voice", "توضیح سایت (SEO)", ["voice", "description"], 200,
    ["src/app/page.tsx", "src/app/manifest.ts"]),

  // ---------- rooms ----------
  f("rooms.house.label", "rooms", "نام «خانه»", ["rooms", "house", "label"], 40, NAV_AT),
  f("rooms.person.label", "rooms", "نام «درباره من»", ["rooms", "person", "label"], 40, NAV_AT),
  f("rooms.knowledge.label", "rooms", "نام «باغ دانش»", ["rooms", "knowledge", "label"], 40, NAV_AT),
  f("rooms.lab.label", "rooms", "نام «کارگاه»", ["rooms", "lab", "label"], 40, NAV_AT),
  f("rooms.mirrors.label", "rooms", "نام «آینه‌ها»", ["rooms", "mirrors", "label"], 40, NAV_AT),
  f("rooms.courses.label", "rooms", "نام «دوره‌ها»", ["rooms", "courses", "label"], 40, NAV_AT),
  f("rooms.shop.label", "rooms", "نام «فروشگاه»", ["rooms", "shop", "label"], 40, NAV_AT),
  f("rooms.topics.label", "rooms", "نام «موضوعات»", ["rooms", "topics", "label"], 40, ["src/components/Footer.tsx"]),
  f("rooms.contact.label", "rooms", "نام «تماس»", ["rooms", "contact", "label"], 40, NAV_AT),
  f("rooms.privacy.label", "rooms", "نام «حریم خصوصی»", ["rooms", "privacy", "label"], 40, NAV_AT),

  // ---------- notes ----------
  f("notes.house", "notes", "توضیح خانه", ["notes", "house"], 80, ["src/components/Nav.tsx"]),
  f("notes.person", "notes", "توضیح درباره من", ["notes", "person"], 80, ["src/components/Nav.tsx"]),
  f("notes.knowledge", "notes", "توضیح باغ دانش", ["notes", "knowledge"], 80, ["src/components/Nav.tsx"]),
  f("notes.lab", "notes", "توضیح کارگاه", ["notes", "lab"], 80, ["src/components/Nav.tsx"]),
  f("notes.mirrors", "notes", "توضیح آینه‌ها", ["notes", "mirrors"], 80, ["src/components/Nav.tsx"]),
  f("notes.courses", "notes", "توضیح دوره‌ها", ["notes", "courses"], 80, ["src/components/Nav.tsx"]),
  f("notes.shop", "notes", "توضیح فروشگاه", ["notes", "shop"], 80, ["src/components/Nav.tsx"]),

  // ---------- house ----------
  f("house.title", "house", "تیتر خانه", ["houseCopy", "title"], 60, ["src/app/ecosystem/page.tsx"]),
  f("house.heading", "house", "سرتیتر خانه", ["houseCopy", "heading"], 80, ["src/app/ecosystem/page.tsx"]),
  f("house.lede", "house", "متن معرفی خانه", ["houseCopy", "lede"], 320, ["src/app/ecosystem/page.tsx"], { multiline: true }),

  // ---------- knowledge ----------
  f("knowledge.title", "knowledge", "تیتر باغ دانش", ["knowledgeCopy", "title"], 60,
    ["src/app/knowledge/page.tsx"]),
  f("knowledge.lede", "knowledge", "متن معرفی باغ دانش", ["knowledgeCopy", "lede"], 320,
    ["src/app/knowledge/page.tsx"], { multiline: true }),

  // ---------- mirrors ----------
  f("mirrors.title", "mirrors", "تیتر آینه‌ها", ["mirrorsCopy", "title"], 60, ["src/app/analyzers/page.tsx"]),
  f("mirrors.lede", "mirrors", "متن معرفی آینه‌ها", ["mirrorsCopy", "lede"], 320,
    ["src/app/analyzers/page.tsx"], { multiline: true }),

  // ---------- lab ----------
  f("lab.title", "lab", "تیتر کارگاه", ["labCopy", "title"], 60, ["src/app/lab/page.tsx"]),
  f("lab.lede", "lab", "متن معرفی کارگاه", ["labCopy", "lede"], 320, ["src/app/lab/page.tsx"], { multiline: true }),

  // ---------- home flow ----------
  f("home.kicker", "home", "بالانویس سه گام", ["homeFlow", "kicker"], 40, ["src/app/page.tsx"]),
  f("home.title", "home", "تیتر سه گام", ["homeFlow", "title"], 80, ["src/app/page.tsx"]),
  f("home.lede", "home", "متن سه گام", ["homeFlow", "lede"], 320, ["src/app/page.tsx"], { multiline: true }),
  f("home.steps.1.title", "home", "گام ۱ — عنوان", ["homeFlow", "steps", 0, "title"], 60, ["src/app/page.tsx"]),
  f("home.steps.1.body", "home", "گام ۱ — متن", ["homeFlow", "steps", 0, "body"], 200, ["src/app/page.tsx"], { multiline: true }),
  f("home.steps.2.title", "home", "گام ۲ — عنوان", ["homeFlow", "steps", 1, "title"], 60, ["src/app/page.tsx"]),
  f("home.steps.2.body", "home", "گام ۲ — متن", ["homeFlow", "steps", 1, "body"], 200, ["src/app/page.tsx"], { multiline: true }),
  f("home.steps.3.title", "home", "گام ۳ — عنوان", ["homeFlow", "steps", 2, "title"], 60, ["src/app/page.tsx"]),
  f("home.steps.3.body", "home", "گام ۳ — متن", ["homeFlow", "steps", 2, "body"], 200, ["src/app/page.tsx"], { multiline: true }),

  // ---------- person ----------
  f("person.missing", "person", "پیام وقتی هویت خالی است", ["personCopy", "missing"], 160,
    ["src/app/hadiran/page.tsx"], { multiline: true }),
  f("person.intro.1", "person", "معرفی — جملهٔ ۱", ["personCopy", "intro", 0], 200, ["src/app/hadiran/page.tsx"], { multiline: true }),
  f("person.intro.2", "person", "معرفی — جملهٔ ۲", ["personCopy", "intro", 1], 200, ["src/app/hadiran/page.tsx"], { multiline: true }),
  f("person.intro.3", "person", "معرفی — جملهٔ ۳", ["personCopy", "intro", 2], 200, ["src/app/hadiran/page.tsx"], { multiline: true }),
  f("person.intro.4", "person", "معرفی — جملهٔ ۴", ["personCopy", "intro", 3], 200, ["src/app/hadiran/page.tsx"], { multiline: true }),

  // ---------- contact ----------
  f("contact.empty", "contact", "پیام نبودِ راه ارتباط", ["contactCopy", "empty"], 200,
    ["src/app/contact/page.tsx"], { multiline: true }),

  // ---------- site ----------
  f("site.nameFa", "site", "نام فارسی برند", ["site", "nameFa"], 40, ["src/components/Nav.tsx", "src/components/Footer.tsx"]),
  f("site.nameEn", "site", "نام انگلیسی برند", ["site", "nameEn"], 40, ["src/app/page.tsx"]),
  f("site.tagline", "site", "جملهٔ امضای فوتر", ["site", "tagline"], 240, ["src/components/Footer.tsx"], { multiline: true }),
];

export const FIELD_BY_KEY: Map<string, CopyField> = new Map(COPY_FIELDS.map((item) => [item.key, item]));

export function fieldsOfGroup(group: string): CopyField[] {
  return COPY_FIELDS.filter((item) => item.group === group);
}

export function isCopyGroup(value: string): value is CopyGroup {
  return (COPY_GROUPS as readonly string[]).includes(value);
}

// ---------- ساختار مقدار ----------

export type SiteCopy = {
  voice: {
    browserTitle: string;
    altTitle: string;
    slogan: string;
    subSlogan: string;
    distinction: string;
    roomsLine: string;
    description: string;
  };
  rooms: {
    house: { href: string; label: string };
    person: { href: string; label: string };
    knowledge: { href: string; label: string };
    lab: { href: string; label: string };
    mirrors: { href: string; label: string };
    courses: { href: string; label: string };
    shop: { href: string; label: string };
    topics: { href: string; label: string };
    contact: { href: string; label: string };
    privacy: { href: string; label: string };
  };
  notes: Record<keyof typeof navNotes, string>;
  personCopy: { missing: string; intro: string[] };
  knowledgeCopy: { title: string; lede: string };
  mirrorsCopy: { title: string; lede: string };
  labCopy: { title: string; lede: string };
  houseCopy: { title: string; heading: string; lede: string };
  contactCopy: { empty: string };
  homeFlow: {
    kicker: string;
    title: string;
    lede: string;
    steps: { n: string; title: string; body: string }[];
  };
  site: { nameFa: string; nameEn: string; tagline: string };
};

export const DEFAULT_COPY: SiteCopy = {
  voice: { ...voice },
  rooms: {
    house: { href: rooms.house.href, label: rooms.house.label },
    person: { href: rooms.person.href, label: rooms.person.label },
    knowledge: { href: rooms.knowledge.href, label: rooms.knowledge.label },
    lab: { href: rooms.lab.href, label: rooms.lab.label },
    mirrors: { href: rooms.mirrors.href, label: rooms.mirrors.label },
    courses: { href: rooms.courses.href, label: rooms.courses.label },
    shop: { href: rooms.shop.href, label: rooms.shop.label },
    topics: { href: rooms.topics.href, label: rooms.topics.label },
    contact: { href: rooms.contact.href, label: rooms.contact.label },
    privacy: { href: rooms.privacy.href, label: rooms.privacy.label },
  },
  notes: { ...navNotes },
  personCopy: { missing: personCopy.missing, intro: [...personCopy.intro] },
  knowledgeCopy: { ...knowledgeCopy },
  mirrorsCopy: { ...mirrorsCopy },
  labCopy: { ...labCopy },
  houseCopy: { ...houseCopy },
  contactCopy: { ...contactCopy },
  homeFlow: {
    kicker: homeFlow.kicker,
    title: homeFlow.title,
    lede: homeFlow.lede,
    steps: homeFlow.steps.map((step) => ({ ...step })),
  },
  site: { ...siteCopy },
};

/** فقط آنچه ناو و فوتر لازم دارند — تا کل رجیستری به payload کلاینت نرود. */
export type ChromeCopy = {
  rooms: SiteCopy["rooms"];
  notes: SiteCopy["notes"];
  site: { nameFa: string; tagline: string };
};

export function chromeCopy(copy: SiteCopy): ChromeCopy {
  return {
    rooms: copy.rooms,
    notes: copy.notes,
    site: { nameFa: copy.site.nameFa, tagline: copy.site.tagline },
  };
}

/** مقدار پیش‌فرض یک کلید؛ اگر کلید ناشناخته باشد null. */
export function defaultValue(key: string): string | null {
  const field = FIELD_BY_KEY.get(key);
  if (!field) return null;
  return readPath(DEFAULT_COPY, field.path);
}

function readPath(target: unknown, path: (string | number)[]): string | null {
  let cursor: unknown = target;
  for (const step of path) {
    if (cursor == null || typeof cursor !== "object") return null;
    cursor = (cursor as Record<string | number, unknown>)[step as never];
  }
  return typeof cursor === "string" ? cursor : null;
}

function writePath(target: SiteCopy, path: (string | number)[], value: string) {
  let cursor: unknown = target;
  for (let i = 0; i < path.length - 1; i += 1) {
    if (cursor == null || typeof cursor !== "object") return;
    cursor = (cursor as Record<string | number, unknown>)[path[i] as never];
  }
  if (cursor == null || typeof cursor !== "object") return;
  (cursor as Record<string | number, unknown>)[path[path.length - 1] as never] = value;
}

/** پاک‌سازی مقدار ورودی: متن ساده، بدون HTML، با سقف طول رجیستری. */
export function normalizeCopyValue(
  field: CopyField,
  raw: unknown,
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== "string") return { ok: false, error: "مقدار باید متن باشد." };
  const value = raw.replace(/\r\n/g, "\n").trim();
  if (/[<>]/.test(value)) return { ok: false, error: "متن ساده است؛ < و > مجاز نیست." };
  if (value.length > field.maxLength) {
    return { ok: false, error: `حداکثر ${field.maxLength.toLocaleString("fa-IR")} نویسه.` };
  }
  return { ok: true, value };
}

/**
 * ادغام مقدار زنده روی پیش‌فرض. خالص و بدون DB — قابل تست.
 * کلید ناشناخته یا مقدار نامعتبر نادیده گرفته می‌شود تا یک سطر خراب کل صفحه را نبرد.
 */
export function applyOverrides(base: SiteCopy, overrides: Record<string, string | null | undefined>): SiteCopy {
  const next: SiteCopy = structuredClone(base);
  for (const [key, raw] of Object.entries(overrides)) {
    if (typeof raw !== "string") continue;
    const field = FIELD_BY_KEY.get(key);
    if (!field) continue;
    const clean = normalizeCopyValue(field, raw);
    if (!clean.ok || !clean.value) continue;
    writePath(next, field.path, clean.value);
  }
  return next;
}
