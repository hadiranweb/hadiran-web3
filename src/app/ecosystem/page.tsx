import { db } from "@/db";
import { knowledge, memoryItems, projects, courses } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HadiranMark } from "@/components/HadiranMark";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoomPage } from "@/components/ui/RoomPage";
import { houseCopy, rooms } from "@/lib/copy";
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
  let knowledgeCount = { value: 0 };
  let projectCount = { value: 0 };
  let courseCount = { value: 0 };
  try {
    [knowledgeCount] = await db
      .select({ value: count() })
      .from(knowledge)
      .innerJoin(memoryItems, eq(knowledge.memoryItemId, memoryItems.id))
      .where(eq(memoryItems.visibility, "public"));
    [projectCount] = await db.select({ value: count() }).from(projects);
    [courseCount] = await db.select({ value: count() }).from(courses);
  } catch (error) {
    console.error("[hadiran] ecosystem counts failed", error);
  }

  const worlds = [
    {
      href: rooms.knowledge.href,
      label: rooms.knowledge.label,
      promise: "فکرهای تازه‌کاشته، در حال رشد و آزموده.",
      count: knowledgeCount.value,
      unit: "مطلب",
    },
    {
      href: rooms.lab.href,
      label: rooms.lab.label,
      promise: "ظرف‌ها و پروژه‌های باز؛ همکاری از صفحهٔ همان کار.",
      count: projectCount.value,
      unit: "ظرف",
    },
    {
      href: rooms.courses.href,
      label: rooms.courses.label,
      promise: "آموزش؛ تا دورهٔ واقعی نیاید خالی می‌ماند.",
      count: courseCount.value,
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
                {world.count != null ? (
                  <p className="chip mt-4">
                    {world.count.toLocaleString("fa-IR")} {world.unit}
                  </p>
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
