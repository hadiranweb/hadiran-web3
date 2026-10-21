import { db } from "@/db";
import {
  projects,
  projectTopics,
  topics,
  projectSkills,
  skills,
  projectRequiredRoles,
  roles,
  projectDocuments,
  knowledgeProjects,
  knowledge,
  memoryItems,
  courseProjects,
  courses,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  publicCourseFilter,
  publicKnowledgeFilter,
  publicKnowledgeJoin,
} from "@/lib/public/policy";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth/session";
import {
  ArrowLeft,
  FlaskConical,
  Hash,
  Wrench,
  Users,
  FileText,
  BookOpen,
  GraduationCap,
  Target,
  Lightbulb,
  Eye,
} from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  idea: "ایده",
  concept: "مفهوم",
  research: "تحقیق",
  prototype: "نمونه اولیه",
  development: "توسعه",
  beta: "بتا",
  production: "تولید",
  archived: "بایگانی‌شده",
};

const docLabels: Record<string, string> = {
  whitepaper: "وایت‌پیپر",
  blueprint: "بلوپرینت",
  roadmap: "نقشه راه",
  gantt: "برنامه زمان‌بندی",
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let project: typeof projects.$inferSelect | undefined;
  try {
    [project] = await db.select().from(projects).where(eq(projects.slug, slug));
  } catch {
    return { title: "کارگاه", robots: { index: false, follow: false } };
  }
  if (!project) return { title: "یافت نشد" };
  // noindex is not an access grant: an unpublished project keeps its name off public metadata.
  if (!project.published) {
    return { title: "پروژهٔ منتشرنشده", robots: { index: false, follow: false } };
  }
  return {
    title: project.nameFa,
    description: project.descriptionFa ?? undefined,
    alternates: { canonical: `/lab/${slug}` },
    openGraph: {
      title: project.nameFa,
      description: project.descriptionFa ?? undefined,
      locale: "fa_IR",
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const [project] = await db.select().from(projects).where(eq(projects.slug, slug));
  if (!project) notFound();
  if (!project.published) {
    const account = await getCurrentAccount();
    if (account?.role !== "owner") notFound();
  }

  const [projectTopicsList, projectSkillsList, projectRolesList, projectDocsList, projectKnowledgeList, projectCoursesList] =
    await Promise.all([
      db
        .select({ labelFa: topics.labelFa, slug: topics.slug })
        .from(projectTopics)
        .innerJoin(topics, eq(projectTopics.topicId, topics.id))
        .where(eq(projectTopics.projectId, project.id)),
      db
        .select({ labelFa: skills.labelFa, slug: skills.slug })
        .from(projectSkills)
        .innerJoin(skills, eq(projectSkills.skillId, skills.id))
        .where(eq(projectSkills.projectId, project.id)),
      db
        .select({ labelFa: roles.labelFa, slug: roles.slug, count: projectRequiredRoles.count })
        .from(projectRequiredRoles)
        .innerJoin(roles, eq(projectRequiredRoles.roleId, roles.id))
        .where(eq(projectRequiredRoles.projectId, project.id)),
      db.select().from(projectDocuments).where(eq(projectDocuments.projectId, project.id)),
      db
        .select({ slug: knowledge.slug, titleFa: knowledge.titleFa })
        .from(knowledgeProjects)
        .innerJoin(knowledge, eq(knowledgeProjects.knowledgeId, knowledge.id))
        .innerJoin(memoryItems, publicKnowledgeJoin)
        .where(and(eq(knowledgeProjects.projectId, project.id), publicKnowledgeFilter)),
      db
        .select({ slug: courses.slug, titleFa: courses.titleFa })
        .from(courseProjects)
        .innerJoin(courses, eq(courseProjects.courseId, courses.id))
        .where(and(eq(courseProjects.projectId, project.id), publicCourseFilter)),
    ]);

  const docsByType = Object.fromEntries(projectDocsList.map((d) => [d.type, d]));

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/lab" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        بازگشت به کارگاه
      </Link>

      <section className="surface overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                {project.category}
              </span>
              <h1 className="mt-3 text-3xl font-bold">{project.nameFa}</h1>
              <p className="mt-2 max-w-2xl text-indigo-100">{project.descriptionFa}</p>
            </div>
            <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 sm:flex">
              <FlaskConical className="h-8 w-8" />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
            <span>وضعیت: {statusLabels[project.status] || project.status}</span>
            <span>اولویت: {project.priority}</span>
            <span>پیشرفت: {project.progress}%</span>
          </div>

          <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              {(project.problemFa || project.visionFa || project.conceptFa) && (
                <div className="grid gap-4 sm:grid-cols-3">
                  {project.problemFa && (
                    <div className="rounded-[var(--radius-md)] border border-line bg-paper p-4">
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                        <Target className="h-4 w-4 text-mark" />
                        مسئله
                      </h3>
                      <p className="text-sm leading-relaxed text-ink">{project.problemFa}</p>
                    </div>
                  )}
                  {project.visionFa && (
                    <div className="rounded-[var(--radius-md)] border border-line bg-paper p-4">
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                        <Eye className="h-4 w-4 text-accent" />
                        چشم‌انداز
                      </h3>
                      <p className="text-sm leading-relaxed text-ink">{project.visionFa}</p>
                    </div>
                  )}
                  {project.conceptFa && (
                    <div className="rounded-[var(--radius-md)] border border-line bg-paper p-4">
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                        <Lightbulb className="h-4 w-4 text-mark" />
                        مفهوم
                      </h3>
                      <p className="text-sm leading-relaxed text-ink">{project.conceptFa}</p>
                    </div>
                  )}
                </div>
              )}

              {project.objectivesFa && (project.objectivesFa as string[]).length > 0 && (
                <div>
                  <h3 className="mb-3 text-lg font-bold text-ink">اهداف</h3>
                  <ul className="list-inside list-disc space-y-1 text-ink">
                    {(project.objectivesFa as string[]).map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
                  <FileText className="h-5 w-5 text-mark" />
                  مستندات پروژه
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["whitepaper", "blueprint", "roadmap", "gantt"] as const).map((docType) => {
                    const doc = docsByType[docType];
                    return (
                      <Link
                        key={docType}
                        href={`/lab/${project.slug}/${docType}`}
                        className={`flex flex-col rounded-[var(--radius-md)] border p-4 transition ${
                          doc
                            ? "border-line bg-paper hover:border-accent"
                            : "border-line bg-paper opacity-60"
                        }`}
                      >
                        <span className="text-sm font-bold text-ink">{docLabels[docType]}</span>
                        <span className="mt-1 text-xs text-muted">{doc ? doc.titleFa : "هنوز ثبت نشده"}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <aside className="space-y-8">
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-bold text-ink">
                  <Hash className="h-4 w-4 text-mark" />
                  موضوعات
                </h3>
                <div className="flex flex-wrap gap-2">
                  {projectTopicsList.map((topic) => (
                    <Link
                      key={topic.slug}
                      href={`/topics/${topic.slug}`}
                      className="rounded-full border border-line bg-paper px-3 py-1 text-sm text-ink"
                    >
                      {topic.labelFa}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 font-bold text-ink">
                  <Wrench className="h-4 w-4 text-good" />
                  فناوری‌ها و مهارت‌ها
                </h3>
                <div className="flex flex-wrap gap-2">
                  {projectSkillsList.map((skill) => (
                    <span key={skill.slug} className="rounded-[var(--radius-sm)] border border-line px-3 py-1 text-sm text-ink">
                      {skill.labelFa}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 font-bold text-ink">
                  <Users className="h-4 w-4 text-mark" />
                  نقش‌های موردنیاز
                </h3>
                <div className="space-y-2">
                  {projectRolesList.map((role) => (
                    <div
                      key={role.slug}
                      className="flex items-center justify-between rounded-[var(--radius-sm)] bg-paper px-3 py-2 text-sm"
                    >
                      <span className="text-ink">{role.labelFa}</span>
                      <span className="text-xs text-muted">{role.count} نفر</span>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/lab/${project.slug}/collaborate`}
                  className="mt-3 block rounded-[var(--radius-sm)] bg-accent px-4 py-2.5 text-center text-sm font-medium text-accent-fg"
                >
                  درخواست همکاری
                </Link>
              </div>

              {projectKnowledgeList.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 font-bold text-ink">
                    <BookOpen className="h-4 w-4 text-mark" />
                    دانش مرتبط
                  </h3>
                  <div className="space-y-2">
                    {projectKnowledgeList.map((k) => (
                      <Link
                        key={k.slug}
                        href={`/knowledge/${k.slug}`}
                        className="block rounded-[var(--radius-sm)] bg-paper px-3 py-2 text-sm font-medium text-ink hover:border-accent"
                      >
                        {k.titleFa}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {projectCoursesList.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 font-bold text-ink">
                    <GraduationCap className="h-4 w-4 text-mark" />
                    دوره‌های مرتبط
                  </h3>
                  <div className="space-y-2">
                    {projectCoursesList.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/courses/${c.slug}`}
                        className="block rounded-[var(--radius-sm)] bg-paper px-3 py-2 text-sm font-medium text-ink"
                      >
                        {c.titleFa}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
