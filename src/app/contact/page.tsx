import { db } from "@/db";
import { person } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";


export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تماس",
  description: "راه‌های ارتباط با هادیران: ایمیل و شبکه‌های عمومی. درخواست همکاری روی هر پروژه از صفحهٔ همان پروژه است.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "تماس با هادیران",
    description: "روش‌های تماس مستقیم؛ بدون فرم پیام.",
    url: "/contact",
    locale: "fa_IR",
    type: "website",
  },
};

type ContactMethod = { label: string; value: string; url?: string };

export default async function ContactPage() {
  const [hadiran] = await db.select().from(person).where(eq(person.slug, "hadiran"));
  const methods: ContactMethod[] = hadiran?.contactMethods ?? [];
  const sameAs = methods
    .map((m) => m.url)
    .filter((url): url is string => Boolean(url && /^https?:\/\//i.test(url)));

  return (
    <PageShell width="narrow">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "تماس با هادیران",
          url: absoluteUrl("/contact"),
          mainEntity: {
            "@type": "Person",
            name: hadiran?.nameFa || "هادیران",
            url: absoluteUrl("/hadiran"),
            sameAs,
          },
        }}
      />

      <PageHeader
        kicker="هادیران"
        title="راه‌های تماس"
        lede="این صفحه فقط روش‌های ارتباط است، نه بیوگرافی و نه فرم همکاری."
      />

      <Surface className="p-6 sm:p-10">
        {methods.length === 0 ? (
          <p className="text-sm leading-7 text-muted">روش تماسی ثبت نشده است.</p>
        ) : (
          <ul className="space-y-3">
            {methods.map((method) => {
              const href = method.url || undefined;
              const external = Boolean(href && /^https?:\/\//i.test(href));
              const inner = (
                <>
                  <span className="text-xs font-medium text-muted">{method.label}</span>
                  <span className="mt-1 block text-base font-semibold text-ink">{method.value}</span>
                </>
              );
              return (
                <li key={method.label}>
                  {href ? (
                    <a
                      href={href}
                      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                      className="block rounded-[var(--radius-md)] border border-line bg-paper px-4 py-3 hover:border-accent"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div className="rounded-[var(--radius-md)] border border-line bg-paper px-4 py-3">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Surface>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link
          href="/hadiran"
          className="rounded-[var(--radius-md)] border border-line bg-elev px-4 py-3 text-sm font-medium text-ink"
        >
          درباره من
        </Link>
        <Link
          href="/lab"
          className="rounded-[var(--radius-md)] border border-line bg-elev px-4 py-3 text-sm font-medium text-ink"
        >
          همکاری از آزمایشگاه
        </Link>
      </div>
    </PageShell>
  );
}
