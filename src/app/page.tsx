import type { Metadata } from "next";
import Link from "next/link";
import { HomeChat } from "@/components/HomeChat";
import { siteConfig } from "@/lib/site";
import { rooms, voice } from "@/lib/copy";
import { HadiranMark } from "@/components/HadiranMark";

export const metadata: Metadata = {
  title: {
    absolute: voice.browserTitle,
  },
  description: voice.description,
  alternates: {
    canonical: siteConfig.url || "/",
  },
  openGraph: {
    title: voice.altTitle,
    description: voice.subSlogan,
    url: siteConfig.url || "/",
    type: "website",
    locale: "fa_IR",
  },
};

const worlds = [rooms.house, rooms.person, rooms.knowledge, rooms.lab, rooms.mirrors, rooms.courses];

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
    <main className="home-wash mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl flex-col px-4 py-6 sm:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="mb-6 shrink-0 text-center">
        <HadiranMark className="mx-auto mb-3 h-10 w-10" />
        <p className="text-sm font-medium text-mark">{voice.distinction}</p>
        <h1 className="mt-2 text-2xl font-extrabold leading-[1.35] tracking-tight text-ink sm:text-3xl">
          {voice.slogan}
        </h1>
        <p className="mx-auto mt-2.5 max-w-xl text-sm leading-[1.85] text-muted sm:text-base">{voice.subSlogan}</p>
        <nav aria-label="اتاق‌های خانهٔ هادیران" className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {worlds.map((world) => (
            <Link
              key={world.href}
              href={world.href}
              className="inline-flex items-center rounded-full border border-line bg-elev px-3.5 py-1.5 text-xs font-medium text-muted transition hover:border-accent hover:text-ink"
            >
              {world.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <HomeChat />
      </div>
    </main>
  );
}
