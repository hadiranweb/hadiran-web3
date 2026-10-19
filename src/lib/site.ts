export const siteConfig = {
  nameFa: "هادیران",
  nameEn: "Hadiran",
  shortName: "Hadiran",
  description:
    "مسئله‌ات را بگو؛ با هم شفافش می‌کنیم. از گلوگاه روزمره تا معماری سیستم — اول می‌بینیم، بعد می‌سازیم.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
};

export function absoluteUrl(path = "/"): string {
  const base = siteConfig.url.replace(/\/$/, "");
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
