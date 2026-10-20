import { db } from "@/db";
import { projects, projectRequiredRoles, roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { CollaborationForm } from "@/components/CollaborationForm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [project] = await db.select().from(projects).where(eq(projects.slug, slug));
  return {
    title: project ? `همکاری در ${project.nameFa}` : "درخواست همکاری",
    robots: { index: false, follow: true },
  };
}

export default async function CollaboratePage({ params }: Props) {
  const { slug } = await params;
  const [project] = await db.select().from(projects).where(eq(projects.slug, slug));
  if (!project) notFound();

  const projectRolesList = await db
    .select({ id: roles.id, labelFa: roles.labelFa, slug: roles.slug, count: projectRequiredRoles.count })
    .from(projectRequiredRoles)
    .innerJoin(roles, eq(projectRequiredRoles.roleId, roles.id))
    .where(eq(projectRequiredRoles.projectId, project.id));

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href={`/lab/${project.slug}`}
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        بازگشت به {project.nameFa}
      </Link>

      <section className="surface p-6 sm:p-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-paper text-mark">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink">درخواست همکاری</h1>
            <p className="text-sm text-muted">{project.nameFa}</p>
          </div>
        </div>

        {projectRolesList.length > 0 && (
          <div className="mb-6 rounded-[var(--radius-md)] bg-paper p-4">
            <h3 className="mb-2 text-sm font-bold text-ink">نقش‌های باز:</h3>
            <div className="flex flex-wrap gap-2">
              {projectRolesList.map((role) => (
                <span
                  key={role.id}
                  className="rounded-full border border-line bg-elev px-3 py-1 text-xs font-medium text-ink"
                >
                  {role.labelFa} ({role.count})
                </span>
              ))}
            </div>
          </div>
        )}

        <CollaborationForm projectId={project.id} roles={projectRolesList} />
      </section>
    </main>
  );
}
