import { db } from "@/db";
import {
  person,
  skills,
  topics,
  organizations,
  personSkills,
  personTopics,
  personOrganizations,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { Mail, ExternalLink, Lightbulb, Building2, Tag, Wrench, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "درباره من",
  description:
    "هادی؛ مسیر، دیدگاه و مهارت‌ها در هستی‌شناسی سیستم‌ها، حل مسائل پیچیده، هوش خودمختار و معماری وب۳.",
  alternates: { canonical: "/hadiran" },
};

export default async function HadiranPage() {
  const [hadiran] = await db.select().from(person).where(eq(person.slug, "hadiran"));

  if (!hadiran) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">پروفایل یافت نشد</h1>
      </main>
    );
  }

  const personSkillsList = await db
    .select({ id: skills.id, labelFa: skills.labelFa, slug: skills.slug })
    .from(personSkills)
    .innerJoin(skills, eq(personSkills.skillId, skills.id))
    .where(eq(personSkills.personId, hadiran.id));

  const personTopicsList = await db
    .select({ id: topics.id, labelFa: topics.labelFa, slug: topics.slug })
    .from(personTopics)
    .innerJoin(topics, eq(personTopics.topicId, topics.id))
    .where(eq(personTopics.personId, hadiran.id));

  const personOrganizationsList = await db
    .select({
      id: organizations.id,
      nameFa: organizations.nameFa,
      url: organizations.url,
      roleFa: personOrganizations.roleFa,
    })
    .from(personOrganizations)
    .innerJoin(organizations, eq(personOrganizations.organizationId, organizations.id))
    .where(eq(personOrganizations.personId, hadiran.id));

  const contactMethods = hadiran.contactMethods ?? [];
  const sameAs = contactMethods
    .map((m) => m.url)
    .filter((url): url is string => Boolean(url && /^https?:\/\//i.test(url)));

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: hadiran.nameFa,
          alternateName: hadiran.nameEn || undefined,
          description: hadiran.introFa || undefined,
          url: absoluteUrl("/hadiran"),
          sameAs,
        }}
      />
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600" />
        <div className="px-6 pb-8 sm:px-10">
          <div className="-mt-16 mb-6 flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-white bg-slate-100 text-4xl font-bold text-indigo-600 shadow-sm">
                ه
              </div>
              <div className="pb-2">
                <h1 className="text-3xl font-bold text-slate-900">{hadiran.nameFa}</h1>
                <p className="text-slate-500">{hadiran.nameEn}</p>
              </div>
            </div>
          </div>

          <p className="max-w-3xl text-lg leading-relaxed text-slate-700">{hadiran.introFa}</p>

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                دیدگاه
              </h2>
              <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {hadiran.perspectiveFa}
              </p>
            </div>
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
                <Tag className="h-5 w-5 text-indigo-500" />
                موضوعات تخصصی
              </h2>
              <div className="flex flex-wrap gap-2">
                {personTopicsList.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/topics/${topic.slug}`}
                    className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700"
                  >
                    {topic.labelFa}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
              <Wrench className="h-5 w-5 text-emerald-500" />
              مهارت‌ها
            </h2>
            <div className="flex flex-wrap gap-2">
              {personSkillsList.map((skill) => (
                <span
                  key={skill.id}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
                >
                  {skill.labelFa}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
              <Building2 className="h-5 w-5 text-blue-500" />
              سازمان‌ها و نقش‌ها
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {personOrganizationsList.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{org.nameFa}</p>
                    <p className="text-sm text-slate-500">{org.roleFa}</p>
                  </div>
                  {org.url && (
                    <a
                      href={org.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-indigo-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
              <Mail className="h-5 w-5 text-rose-500" />
              تماس
            </h2>
            <div className="flex flex-wrap gap-3">
              {contactMethods.map((method) => (
                <a
                  key={method.label}
                  href={method.url || "#"}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                >
                  {method.label}: {method.value}
                </a>
              ))}
            </div>
            <Link
              href="/contact"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              صفحهٔ تماس
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
