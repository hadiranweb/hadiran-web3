import type { Metadata } from "next";
import Link from "@/components/workspace/WorkspaceLink";
import { ChartNoAxesCombined, ArrowLeft, BookOpen, FlaskConical, GraduationCap, Layers, ShoppingBag, Sparkles, User } from "lucide-react";
import { HomeChat } from "@/components/HomeChat";
import { ReassemblyPortrait } from "@/components/portrait/ReassemblyPortrait";
import { siteConfig } from "@/lib/site";

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
    title: "هادیران | گفت‌وگو برای درک و شفاف‌سازی مسئله",
    description: "فضایی برای بازنمایی دقیق ایده‌ها، ساختاردهی به دغدغه‌ها و هم‌مسیر شدن.",
    url: siteConfig.url || "/",
    type: "website",
    locale: "fa_IR",
  },
};

const steps = [
  {
    number: "۱",
    title: "مسئله را بنویسید",
    body: "به همان شکلی که هست. لازم نیست از ابتدا ساختار کامل یا پاسخ نهایی را بدانید.",
  },
  {
    number: "۲",
    title: "هدف و مانع اصلی را جدا می‌کنیم",
    body: "گفتگو کمک می‌کند نتیجه مطلوب و بزرگ‌ترین گره فعلی از هم تفکیک شوند.",
  },
  {
    number: "۳",
    title: "گام بعدی را مشخص می‌کنیم",
    body: "از دل ابهام، یک اقدام عینی و قابل پیگیری برای ادامه مسیر بیرون می‌کشیم.",
  },
];

const sections = [
  { href: "/ecosystem", title: "اکوسیستم", note: "نمای کلی اتصال بخش‌های هادیران", icon: Layers },
  { href: "/knowledge", title: "دانشنامه", note: "مقاله‌ها، یادداشت‌ها و پژوهش‌ها", icon: BookOpen },
  { href: "/lab", title: "آزمایشگاه", note: "پروژه‌ها و آزمایش‌های در جریان", icon: FlaskConical },
  { href: "/analyzers", title: "تحلیلگرها", note: "ارزیابی ساختاریافته و گزارش شخصی", icon: ChartNoAxesCombined },
  { href: "/courses", title: "دوره‌ها", note: "مسیرهای یادگیری و آموزش", icon: GraduationCap },
  { href: "/shop", title: "فروشگاه", note: "محصولات و اسناد دیجیتال", icon: ShoppingBag },
  { href: "/hadiran", title: "درباره من", note: "مسیر، نگاه و زمینه فعالیت هادی", icon: User },
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
    <main className="flex-1">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="page-hero">
        <div className="aurora" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="wrap home-hero-grid">
          <div className="home-hero-copy">
            <span className="eyebrow">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              هادیران
            </span>
            <h1 className="display mt-6">
              گفت‌وگو برای درک و <span className="text-accent">شفاف‌سازی مسئله</span>
            </h1>
            <p className="lede mt-5 max-w-2xl">
              مسئله‌ات را بنویس؛ هدف و مانع اصلی را با هم جدا می‌کنیم و به گام بعدی می‌رسیم.
            </p>
            <div className="home-hero-note mt-7">
              <span className="home-status-dot" aria-hidden="true" />
              ورودی گفتگو از همین حالا فعال است
            </div>
          </div>

          <div className="home-portrait-shell">
            <ReassemblyPortrait />
          </div>
        </div>

        <div className="wrap wrap-narrow home-chat-wrap">
          <HomeChat />
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {["اکوسیستم", "دانشنامه", "آزمایشگاه", "دوره‌ها", "موضوعات"].map((word) => (
            <span key={word} className="marquee-item">
              <span>{word}</span>
              <span className="marquee-symbol">◇</span>
            </span>
          ))}
        </div>
      </div>

      <section className="wrap wrap-narrow conversation-flow" aria-labelledby="flow-title">
        <div className="section-heading">
          <span className="eyebrow">مسیر گفتگو</span>
          <h2 id="flow-title" className="title-xl mt-4">
            از مسئله مبهم تا <span className="text-accent">گام بعدی</span>
          </h2>
        </div>

        <ol className="flow-list">
          {steps.map((step) => (
            <li key={step.number} className="flow-item">
              <span className="flow-number" aria-hidden="true">
                {step.number}
              </span>
              <div>
                <h3 className="title-lg">{step.title}</h3>
                <p className="lede mt-2 max-w-xl">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap home-sections" aria-labelledby="sections-title">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">جهان‌های هادیران</span>
            <h2 id="sections-title" className="title-lg mt-4">
              هر بخش، یک مسیر مشخص
            </h2>
          </div>
          <Link href="/ecosystem" className="more hidden sm:inline-flex">
            نمای کامل اکوسیستم
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="section-cards">
          {sections.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="card card-hover section-card">
                <span className={`tile ${index % 3 === 1 ? "tile-gold" : ""}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="section-card-copy">
                  <span className="section-card-title">{item.title}</span>
                  <span className="muted text-sm leading-7">{item.note}</span>
                </span>
                <span className="more">
                  ورود
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
