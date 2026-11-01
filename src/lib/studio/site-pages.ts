/**
 * رجیستری صفحه‌های واقعی سایت برای استودیو.
 *
 * قانون: هر صفحهٔ سایت یک «صفحهٔ استودیویی» متناظر دارد (target = `site:<key>`).
 * تا وقتی برای آن صفحه چیزی در استودیو منتشر نشود، نسخهٔ کدی فعلی بی‌کم‌وکاست
 * نمایش داده می‌شود؛ انتشار در استودیو همان مسیر واقعی را takeover می‌کند.
 * متن‌ها و نام‌های نسخهٔ کدی از «متن و نام» می‌آیند (copyGroups)؛ نسخهٔ استودیویی
 * از بلوک‌ها. این فایل خالص است تا در سرور، کلاینت و تست import شود.
 */

export type SitePageKind = "public" | "auth" | "member";

export type SitePageDef = {
  key: string;
  path: string;
  titleFa: string;
  kind: SitePageKind;
  /** گروه‌های «متن و نام» که متن نسخهٔ کدی این صفحه را تغذیه می‌کنند. */
  copyGroups: string[];
  note: string;
};

export const SITE_PAGES: SitePageDef[] = [
  { key: "home", path: "/", titleFa: "خانه", kind: "public", copyGroups: ["voice", "home", "rooms", "site"], note: "برای حفظ تصویر واقعی، نشان و گفت‌وگوی زندهٔ خانه از بلوک سیستمی «سربرگ خانهٔ هادیران» استفاده کن؛ انتشار بدون آن رد می‌شود." },
  { key: "ecosystem", path: "/ecosystem", titleFa: "خانه (اکوسیستم)", kind: "public", copyGroups: ["house", "rooms"], note: "نقشهٔ اتاق‌های هادیران." },
  { key: "knowledge", path: "/knowledge", titleFa: "باغ دانش", kind: "public", copyGroups: ["knowledge", "rooms"], note: "فهرست دانش؛ برای بازسازی با بلوک «فهرست دانش (زنده)» آماده است." },
  { key: "analyzers", path: "/analyzers", titleFa: "آینه‌ها", kind: "public", copyGroups: ["mirrors", "rooms"], note: "هاب آینه‌ها؛ بلوک «آینه‌ها (زنده)» همان دادهٔ واقعی را می‌خواند." },
  { key: "lab", path: "/lab", titleFa: "کارگاه", kind: "public", copyGroups: ["lab", "rooms"], note: "فهرست پروژه‌ها؛ بلوک «پروژه‌های کارگاه (زنده)» آماده است." },
  { key: "courses", path: "/courses", titleFa: "دوره‌ها", kind: "public", copyGroups: ["rooms"], note: "فهرست دوره‌ها؛ بلوک «دوره‌ها (زنده)» آماده است." },
  { key: "shop", path: "/shop", titleFa: "فروشگاه", kind: "public", copyGroups: ["rooms"], note: "فهرست کالاها؛ بلوک «فروشگاه (زنده)» آماده است." },
  { key: "topics", path: "/topics", titleFa: "موضوع‌ها", kind: "public", copyGroups: ["rooms"], note: "هاب موضوع‌ها؛ بلوک «موضوع‌ها (زنده)» آماده است." },
  { key: "person", path: "/hadiran", titleFa: "دربارهٔ من", kind: "public", copyGroups: ["person"], note: "صفحهٔ معرفی هادی." },
  { key: "contact", path: "/contact", titleFa: "تماس", kind: "public", copyGroups: ["contact"], note: "راه‌های ارتباطی." },
  { key: "privacy", path: "/privacy", titleFa: "حریم خصوصی", kind: "public", copyGroups: ["site"], note: "متن ثابت حقوقی؛ با «متن ساده» در استودیو بازسازی می‌شود." },
  {
    key: "signin",
    path: "/signin",
    titleFa: "ورود",
    kind: "auth",
    copyGroups: [],
    note: "صفحهٔ کارکردی: بلوک «فرم ورود» الزامی است و مقصد امنِ next از نشانی ورود حفظ می‌شود؛ انتشار بدون فرم رد می‌شود.",
  },
  {
    key: "account",
    path: "/account",
    titleFa: "حساب کاربری",
    kind: "member",
    copyGroups: [],
    note: "بلوک «حساب واقعی» محتوای سروریِ پروفایل، قفسه، معرف و فرم‌های حساب را در همان جای صفحه نگه می‌دارد؛ انتشار بدون آن رد می‌شود و اطلاعات شخصی در JSON ذخیره نمی‌شوند.",
  },
];

export function sitePageByKey(key: string): SitePageDef | null {
  return SITE_PAGES.find((page) => page.key === key) ?? null;
}

export function sitePageByTarget(target: string | null | undefined): SitePageDef | null {
  if (!target || !target.startsWith("site:")) return null;
  return sitePageByKey(target.slice("site:".length));
}

/** target ذخیره‌شده در studio_pages برای صفحهٔ سایت. */
export function siteTarget(key: string): string {
  return `site:${key}`;
}

/** اسلاگ داخلی صفحهٔ استودیوییِ یک صفحهٔ سایت (عمومی نیست؛ مسیر واقعی از def می‌آید). */
export function siteSlug(key: string): string {
  return `site-${key}`;
}
