import { db } from "@/db";
import { knowledge, memoryItems, projects, courses } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { HadiranMark } from "@/components/HadiranMark";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "اکوسیستم هادیران | دانش، آموزش، آزمایشگاه، هویت",
  },
  description:
    "نقشهٔ اکوسیستم شخصی هادیران: هویت، دانشنامه، آکادمی و آزمایشگاه پروژه که از طریق موضوع به هم متصل‌اند.",
  alternates: { canonical: "/ecosystem" },
  openGraph: {
    title: "اکوسیستم هادیران",
    description: "دانش، آموزش، آزمایشگاه و هویت در یک گراف متصل.",
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
      href: "/knowledge",
      label: "دانشنامه",
      promise: "مقالات، یادداشت‌ها و ایده‌های ثبت‌شده.",
      count: knowledgeCount.value,
      unit: "مطلب",
    },
    {
      href: "/lab",
      label: "آزمایشگاه",
      promise: "پروژه‌ها؛ همکاری از صفحهٔ همان پروژه.",
      count: projectCount.value,
      unit: "پروژه",
    },
    {
      href: "/courses",
      label: "دوره‌ها",
      promise: "آموزش؛ تا دورهٔ واقعی نیاید خالی می‌ماند.",
      count: courseCount.value,
      unit: "دوره",
    },
    {
      href: "/hadiran",
      label: "هادی",
      promise: "مسیر، دیدگاه و راه‌های ارتباط شخص.",
      count: null,
      unit: "",
    },
  ];

  return (
    <PageShell width="wide">
      <PageHeader
        kicker="نقشه"
        title="چهار جهان، یک اکوسیستم"
        lede="هادیران فضای کار است نه شعار. دانش، آموزش، آزمایشگاه و هویت از طریق موضوع به هم وصل می‌شوند. هم‌فکری در خانه است؛ نقشه اینجاست."
      />

      <ul className="grid gap-4 sm:grid-cols-2">
        {worlds.map((world) => (
          <li key={world.href}>
            <Link href={world.href} className="surface block h-full p-6 transition hover:border-accent">
              <h2 className="text-xl font-bold leading-[1.7] text-ink">{world.label}</h2>
              <p className="mt-2 text-sm leading-7 text-muted">{world.promise}</p>
              {world.count != null ? (
                <p className="mt-6 text-xs text-muted">
                  {world.count.toLocaleString("fa-IR")} {world.unit}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg"
        >
          شروع هم‌فکری
        </Link>
        <Link
          href="/hadiran"
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-line bg-elev px-5 py-2.5 text-sm font-medium text-ink"
        >
          <HadiranMark className="h-4 w-4" />
          درباره من
        </Link>
      </div>
    </PageShell>
  );
}
