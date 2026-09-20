export const siteConfig = {
  nameFa: "هادیران",
  nameEn: "Hadiran",
  shortName: "Hadiran",
  description:
    "ارتباط مستقیم و هم‌فکری با هادی درباره هستی‌شناسی سیستم‌ها، حل مسائل پیچیده، هوش خودمختار و معماری وب۳.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
};

export function absoluteUrl(path = "/"): string {
  const base = siteConfig.url.replace(/\/$/, "");
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
