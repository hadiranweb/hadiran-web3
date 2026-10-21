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
    absolute: "خانه هادیران | باغ دانش، کارگاه، آینه‌ها، دوره‌ها، فروشگاه، هادی",
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

type World = {
  href: string;
  label: string;
  promise: string;
  cta: string;
  count: PublicCount | null;
  unit: string;
};

export default async function EcosystemPage() {
  const counts = await loadPublicWorldCounts();

  const worlds: World[] = [
    {
      href: rooms.knowledge.href,
      label: rooms.knowledge.label,
      promise: "فکرهای تازه‌کاشته، در حال رشد و آزموده.",
      cta: "نوشته‌ای پیدا کن و بخوان",
      count: counts.knowledge,
      unit: "مطلب",
    },
    {
      href: rooms.lab.href,
      label: rooms.lab.label,
      promise: "ظرف‌ها و پروژه‌های باز؛ همکاری از صفحهٔ همان کار.",
      cta: "پروژه را ببین و راه همکاری را بخوان",
      count: counts.projects,
      unit: "ظرف",
    },
    {
      href: rooms.mirrors.href,
      label: rooms.mirrors.label,
      promise: "آزمون‌های منتشرشده با مرز روشن؛ خلاصه رایگان و تفسیر کامل جدا.",
      cta: "آزمون را انتخاب کن و شروع کن",
      count: counts.analyzers,
      unit: "آزمون باز",
    },
    {
      href: rooms.courses.href,
      label: rooms.courses.label,
      promise: "آموزش؛ تا دورهٔ واقعی نیاید خالی می‌ماند.",
      cta: "مسیر یادگیری را ببین",
      count: counts.courses,
      unit: "دوره",
    },
    {
      href: rooms.shop.href,
      label: rooms.shop.label,
      promise: "کالای فیزیکی و دیجیتال؛ پرداخت بیرون سایت و تحویل بعد از تأیید دریافت.",
      cta: "محصول را مقایسه کن",
      count: counts.shop,
      unit: "کالا",
    },
    {
      href: rooms.person.href,
      label: "هادی",
      promise: "مسیر، نگاه و راه‌های ارتباط شخص.",
      cta: "درباره من و راه تماس",
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
                {world.count ? <p className="chip mt-4">{publicCountLabel(world.count, world.unit)}</p> : null}
                <p className="mt-3 text-xs font-medium text-ink">{world.cta}</p>
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
