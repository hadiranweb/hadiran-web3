import type { Metadata } from "next";
import Link from "next/link";
import { HomeChat } from "@/components/HomeChat";
import { siteConfig } from "@/lib/site";
import {
  BookOpen,
  FlaskConical,
  GraduationCap,
  Layers,
  User,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: {
    absolute: "هادیران | فضای هم‌فکری، شفاف‌سازی مسئله و طراحی سیستم‌ها",
  },
  description:
    "ارتباط مستقیم و هم‌فکری با هادی درباره هستی‌شناسی سیستم‌ها، حل مسائل پیچیده، هوش خودمختار و معماری وب۳.",
  alternates: {
    canonical: siteConfig.url || "/",
  },
  openGraph: {
    title: "هادیران | گفتگوی بی‌واسطه و ساختاردهی به ایده‌ها",
    description:
      "فضایی برای کاوش مشترک در واقعیت مسائل، مدل‌سازی معنادار و تکامل دانش.",
    url: siteConfig.url || "/",
    type: "website",
    locale: "fa_IR",
  },
};

interface WorldLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

const worlds: WorldLink[] = [
  { href: "/ecosystem", label: "اکوسیستم", icon: Layers },
  { href: "/hadiran", label: "درباره من", icon: User },
  { href: "/knowledge", label: "دانشنامه", icon: BookOpen },
  { href: "/lab", label: "آزمایشگاه", icon: FlaskConical },
  { href: "/courses", label: "دوره‌ها", icon: GraduationCap },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.nameFa,
  alternateName: siteConfig.nameEn,
  description: siteConfig.description,
  url: siteConfig.url,
  inLanguage: "fa",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteConfig.url}/knowledge?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl flex-col justify-between px-4 py-8 antialiased">
      {/* سئوی ساختاریافته (Schema.org) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-8 text-center">
        {/* تیتر متصل‌کننده، فعال و دعوت‌کننده به اقدام بر اساس NLP و Rapport */}
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          مسئله‌ات را بگو؛ با هم شفافش می‌کنیم
        </h1>

        {/* زیرتیتر مبتنی بر ارزش هستی‌شناسانه و هم‌فکری انسانی */}
        <p className="mx-auto mt-3.5 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
          فضایی برای بازنمایی دقیق ایده‌ها، ساختاردهی به دغدغه‌ها و هم‌مسیر شدن
          در مرزهای معماری سیستم‌ها، هوش مصنوعی و وب۳.
        </p>

        {/* درگاه‌های ورود به بخش‌های سیستم */}
        <nav
          aria-label="بخش‌های اکوسیستم هادیران"
          className="mt-6 flex flex-wrap items-center justify-center gap-2"
        >
          {worlds.map((world) => {
            const Icon = world.icon;
            return (
              <Link
                key={world.href}
                href={world.href}
                className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-indigo-300 hover:bg-white hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-slate-900 dark:hover:text-indigo-400"
              >
                <Icon className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:text-indigo-400" />
                <span>{world.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* بستر تعاملی چت و دریافت ورودی */}
      <div className="flex-1">
        <HomeChat />
      </div>
    </main>
  );
}
