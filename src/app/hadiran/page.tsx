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
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";
import { HadiranMark } from "@/components/HadiranMark";
import { PageShell } from "@/components/ui/PageShell";
import { Surface } from "@/components/ui/Surface";
import { personCopy, voice } from "@/lib/copy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "درباره من",
  description: "اسمم هادی است؛ یعنی راهنما. راه‌حل نمی‌فروشم. اول می‌بینیم، بعد می‌سازیم.",
  alternates: { canonical: "/hadiran" },
};

export default async function HadiranPage() {
  const [hadiran] = await db.select().from(person).where(eq(person.slug, "hadiran"));

  if (!hadiran) {
    return (
      <PageShell width="narrow">
        <p className="text-sm font-medium text-mark">{voice.altTitle}</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">هادی</h1>
        <p className="mt-4 max-w-3xl text-base leading-[1.85] text-ink">{personCopy.missing}</p>
      </PageShell>
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
    <PageShell width="narrow">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: hadiran.nameFa,
          alternateName: hadiran.nameEn || undefined,
          description: personCopy.intro.join(" "),
          url: absoluteUrl("/hadiran"),
          sameAs,
        }}
      />
      <Surface className="p-6 sm:p-10">
        <div className="mb-8 flex items-center gap-5">
          {hadiran.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hadiran.avatarUrl}
              alt=""
              className="h-24 w-24 rounded-[var(--radius-lg)] object-cover"
            />
          ) : (
            <HadiranMark className="h-24 w-24" />
          )}
          <div>
            <p className="text-sm font-medium text-mark">شخص</p>
            <h1 className="text-3xl font-extrabold leading-[1.35] text-ink">{hadiran.nameFa}</h1>
            {hadiran.nameEn ? (
              <p className="mt-1 text-sm text-muted" dir="ltr">
                {hadiran.nameEn}
              </p>
            ) : null}
          </div>
        </div>

        <div className="max-w-3xl space-y-4 text-base leading-[1.85] text-ink">
          {personCopy.intro.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        {hadiran.perspectiveFa ? (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-bold leading-[1.7] text-ink">دیدگاه</h2>
            <p className="rounded-[var(--radius-md)] bg-paper p-4 text-sm leading-[1.85] text-ink">
              {hadiran.perspectiveFa}
            </p>
          </section>
        ) : null}

        {personTopicsList.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-bold leading-[1.7] text-ink">موضوعات</h2>
            <div className="flex flex-wrap gap-2">
              {personTopicsList.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/topics/${topic.slug}`}
                  className="rounded-full border border-line bg-paper px-3 py-1 text-sm text-ink hover:border-accent"
                >
                  {topic.labelFa}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {personSkillsList.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-bold leading-[1.7] text-ink">مهارت‌ها</h2>
            <div className="flex flex-wrap gap-2">
              {personSkillsList.map((skill) => (
                <span key={skill.id} className="rounded-[var(--radius-sm)] border border-line px-3 py-1 text-sm text-ink">
                  {skill.labelFa}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {personOrganizationsList.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-bold leading-[1.7] text-ink">سازمان‌ها و نقش‌ها</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {personOrganizationsList.map((org) => (
                <li key={org.id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-line p-4">
                  <div>
                    <p className="font-semibold text-ink">{org.nameFa}</p>
                    {org.roleFa ? <p className="text-sm text-muted">{org.roleFa}</p> : null}
                  </div>
                  {org.url ? (
                    <a href={org.url} target="_blank" rel="noreferrer" className="text-muted hover:text-ink">
                      <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {contactMethods.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-bold leading-[1.7] text-ink">تماس</h2>
            <div className="flex flex-wrap gap-3">
              {contactMethods.map((method) => {
                const href = method.url && /^https?:\/\//i.test(method.url) ? method.url : null;
                const body = (
                  <>
                    {method.label}: {method.value}
                  </>
                );
                return href ? (
                  <a
                    key={method.label}
                    href={href}
                    className="inline-flex rounded-[var(--radius-sm)] border border-line bg-paper px-4 py-2 text-sm font-medium text-ink hover:border-accent"
                  >
                    {body}
                  </a>
                ) : (
                  <span
                    key={method.label}
                    className="inline-flex rounded-[var(--radius-sm)] border border-line bg-paper px-4 py-2 text-sm font-medium text-ink"
                  >
                    {body}
                  </span>
                );
              })}
            </div>
            <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
              <Link href="/contact" className="text-accent">
                صفحهٔ تماس
              </Link>
              <Link href="/privacy" className="text-accent">
                حریم خصوصی
              </Link>
            </p>
          </section>
        ) : (
          <p className="mt-10 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
            <Link href="/contact" className="text-accent">
              صفحهٔ تماس
            </Link>
            <Link href="/privacy" className="text-accent">
              حریم خصوصی
            </Link>
          </p>
        )}
      </Surface>
    </PageShell>
  );
}
