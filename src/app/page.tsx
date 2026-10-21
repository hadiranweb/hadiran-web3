import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HomeChat } from "@/components/HomeChat";
import { HadiranMark } from "@/components/HadiranMark";
import { HomePortrait } from "@/components/portrait/HomePortrait";
import { siteConfig } from "@/lib/site";
import { getSiteCopy } from "@/lib/content/site-copy";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getSiteCopy();
  return {
    title: {
      absolute: copy.voice.browserTitle,
    },
    description: copy.voice.description,
    alternates: {
      canonical: siteConfig.url || "/",
    },
    openGraph: {
      title: copy.voice.altTitle,
      description: copy.voice.subSlogan,
      url: siteConfig.url || "/",
      type: "website",
      locale: "fa_IR",
    },
  };
}

function homeJsonLd(nameFa: string, nameEn: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: nameFa,
    alternateName: nameEn,
    description: siteConfig.description,
    url: siteConfig.url,
    inLanguage: "fa",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/knowledge?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export default async function HomePage() {
  const copy = await getSiteCopy();
  const { rooms, voice, homeFlow, site } = copy;
  const worlds = [rooms.house, rooms.knowledge, rooms.lab, rooms.mirrors, rooms.courses, rooms.person];
  const marquee = [rooms.house, rooms.knowledge, rooms.lab, rooms.mirrors, rooms.courses, rooms.shop];
  const jsonLd = homeJsonLd(site.nameFa, site.nameEn);

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="page-hero">
        <div className="aurora" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="wrap home-hero-grid">
          <div className="home-hero-copy">
            <p className="eyebrow">{voice.distinction}</p>
            <h1 className="display mt-5 text-ink">{voice.slogan}</h1>
            <p className="lede mt-4 max-w-xl">{voice.subSlogan}</p>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted">{voice.roomsLine}</p>
            <p className="home-hero-note mt-6">
              <span className="home-status-dot" aria-hidden="true" />
              اول می‌بینیم، بعد می‌سازیم
            </p>
          </div>
          <div className="home-portrait-shell">
            <HomePortrait />
            <p className="home-portrait-brand">
              <HadiranMark className="h-7 w-7" />
              <span>{site.nameFa}</span>
            </p>
          </div>
        </div>
        <div className="wrap home-chat-wrap">
          <HomeChat />
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((tile) => (
            <p key={tile} className="marquee-item">
              {marquee.map((room) => (
                <span key={`${tile}-${room.href}`}>
                  {room.label}
                  <span className="marquee-symbol"> · </span>
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>

      <section className="conversation-flow">
        <div className="wrap">
          <div className="section-heading">
            <p className="eyebrow">{homeFlow.kicker}</p>
            <h2 className="title-xl mt-4 text-ink">{homeFlow.title}</h2>
            <p className="lede mt-3">{homeFlow.lede}</p>
          </div>
          <ol className="flow-list">
            {homeFlow.steps.map((step) => (
              <li key={step.n} className="flow-item">
                <span className="flow-number">{step.n}</span>
                <div>
                  <h3 className="title-lg text-ink">{step.title}</h3>
                  <p className="lede mt-2">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="home-sections">
        <div className="wrap">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">اتاق‌ها</p>
              <h2 className="title-xl mt-3 text-ink">یک خانه، چند در</h2>
            </div>
            <Link href={rooms.house.href} className="more">
              نقشهٔ خانه
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>
          <ul className="section-cards">
            {worlds.map((world) => (
              <li key={world.href}>
                <Link href={world.href} className="card card-hover section-card">
                  <div className="section-card-copy">
                    <span className="tile" aria-hidden="true">
                      {world.label.slice(0, 1)}
                    </span>
                    <h3 className="section-card-title mt-3">{world.label}</h3>
                  </div>
                  <span className="more">
                    ورود
                    <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
