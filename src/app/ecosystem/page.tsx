import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HadiranMark } from "@/components/HadiranMark";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoomPage } from "@/components/ui/RoomPage";
import { houseCopy, rooms } from "@/lib/copy";
import { loadPublicWorldCounts } from "@/lib/public/catalog";
import { publicCountLabel, type PublicCount } from "@/lib/public/source";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "خانه هادیران | باغ دانش، کارگاه، دوره‌ها، هادی",
  },
  description: houseCopy.lede,
  alternates: { canonical: "/ecosystem" },
  openGraph: {
    title: "خانه هادیران",
    description: houseCopy.lede,
    url: "/ecosystem",
    type: "website",
    locale: "fa_IR",
  },
};

export default async function EcosystemPage() {
  const counts = await loadPublicWorldCounts();

  const worlds: {
    href: string;
    label: string;
    promise: string;
    count: PublicCount | null;
    unit: string;
  }[] = [
    {
      href: rooms.knowledge.href,
      label: rooms.knowledge.label,
      promise: "فکرهای تازه‌کاشته، در حال رشد و آزموده.",
      count: counts.knowledge,
      unit: "مطلب",
    },
    {
      href: rooms.lab.href,
      label: rooms.lab.label,
      promise: "ظرف‌ها و پروژه‌های باز؛ همکاری از صفحهٔ همان کار.",
      count: counts.projects,
      unit: "ظرف",
    },
    {
      href: rooms.courses.href,
      label: rooms.courses.label,
      promise: "آموزش؛ تا دورهٔ واقعی نیاید خالی می‌ماند.",
      count: counts.courses,
      unit: "دوره",
    },
    {
      href: rooms.person.href,
      label: "هادی",
      promise: "مسیر، نگاه و راه‌های ارتباط شخص.",
      count: null,
      unit: "",
    },
  ];

  return (
    <RoomPage hero={<PageHeader kicker="نقشه" title={houseCopy.heading} lede={houseCopy.lede} />}>
      <ul className="section-cards listing-cards">
        {worlds.map((world) => (
          <li key={world.href}>
            <Link href={world.href} className="card card-hover section-card">
              <div className="section-card-copy">
                <h2 className="section-card-title">{world.label}</h2>
                <p className="muted mt-2 text-sm leading-7">{world.promise}</p>
                {world.count ? (
                  <p className="chip mt-4">{publicCountLabel(world.count, world.unit)}</p>
                ) : null}
              </div>
              <span className="more">
                ورود
                <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/" className="ws-button ws-primary">
          شروع هم‌فکری
        </Link>
        <Link href="/hadiran" className="ws-button">
          <HadiranMark className="h-4 w-4" />
          درباره من
        </Link>
      </div>
    </RoomPage>
  );
}
