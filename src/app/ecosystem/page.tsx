import { db } from "@/db";
import { knowledge, memoryItems, projects, courses, topics } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { Brain, User, BookOpen, FlaskConical, GraduationCap, Hash, MessageCircle } from "lucide-react";
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
  let topicCount = { value: 0 };
  try {
    [knowledgeCount] = await db
      .select({ value: count() })
      .from(knowledge)
      .innerJoin(memoryItems, eq(knowledge.memoryItemId, memoryItems.id))
      .where(eq(memoryItems.visibility, "public"));
    [projectCount] = await db.select({ value: count() }).from(projects);
    [courseCount] = await db.select({ value: count() }).from(courses);
    [topicCount] = await db.select({ value: count() }).from(topics);
  } catch (error) {
    console.error("[hadiran] ecosystem counts failed", error);
  }

  const stats = [
    { label: "مقاله و یادداشت", value: knowledgeCount.value, icon: BookOpen, href: "/knowledge" },
    { label: "پروژه و آزمایش", value: projectCount.value, icon: FlaskConical, href: "/lab" },
    { label: "دوره آموزشی", value: courseCount.value, icon: GraduationCap, href: "/courses" },
    { label: "موضوع", value: topicCount.value, icon: Hash, href: "/topics" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="mx-auto max-w-3xl space-y-6 text-center lg:max-w-none lg:text-right">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
          <Brain className="h-4 w-4" />
          <span>نقشهٔ اکوسیستم</span>
        </div>
        <h1 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
          اکوسیستم هادیران: دانش، آموزش، آزمایشگاه و هویت در یک گراف متصل
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600 lg:mx-0">
          هادیران یک اکوسیستم شخصی برای نمایش هویت، انتقال دانش، آموزش، ساخت پروژه و ایجاد همکاری
          است. چهار جهان از طریق موضوع به هم وصل می‌شوند؛ هم‌فکری در خانه، نقشه اینجاست.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <s.icon className="mx-auto mb-2 h-5 w-5 text-indigo-600" />
              <p className="text-2xl font-bold text-slate-900">{s.value.toLocaleString("fa-IR")}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <MessageCircle className="h-4 w-4" />
            شروع هم‌فکری
          </Link>
          <Link
            href="/hadiran"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <User className="h-4 w-4" />
            درباره من
          </Link>
          <Link
            href="/lab"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <FlaskConical className="h-4 w-4" />
            ورود به آزمایشگاه
          </Link>
        </div>
      </section>
    </main>
  );
}
