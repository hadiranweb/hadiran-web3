import { db } from "@/db";
import { person } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Mail, ExternalLink, User, FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";

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
    <main className="mx-auto max-w-3xl px-4 py-10">
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

      <p className="mb-2 text-sm font-medium text-indigo-600">هادیران</p>
      <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">راه‌های تماس</h1>
      <p className="mt-3 mb-8 max-w-2xl text-base leading-relaxed text-slate-600">
        این صفحه فقط روش‌های ارتباط است، نه بیوگرافی و نه فرم همکاری. برای شناخت مسیر و دیدگاه به{" "}
        <Link href="/hadiran" className="font-medium text-indigo-600 hover:text-indigo-800">
          درباره من
        </Link>{" "}
        برو؛ برای پیوستن به یک پروژه از صفحهٔ همان پروژه اقدام کن.
      </p>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
          <Mail className="h-5 w-5 text-rose-500" />
          روش‌های ارتباط
        </h2>

        {methods.length === 0 ? (
          <p className="text-sm text-slate-500">روش تماسی ثبت نشده است.</p>
        ) : (
          <ul className="space-y-3">
            {methods.map((method) => {
              const href = method.url || undefined;
              const external = Boolean(href && /^https?:\/\//i.test(href));
              const inner = (
                <>
                  <span className="text-xs font-medium text-slate-500">{method.label}</span>
                  <span className="mt-1 flex items-center gap-2 text-base font-semibold text-slate-900">
                    {method.value}
                    {external && <ExternalLink className="h-4 w-4 text-slate-400" />}
                  </span>
                </>
              );
              return (
                <li key={method.label}>
                  {href ? (
                    <a
                      href={href}
                      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                      className="block rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition hover:border-indigo-200 hover:bg-indigo-50/50"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link
          href="/hadiran"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-indigo-200"
        >
          <User className="h-4 w-4 text-indigo-600" />
          درباره من
        </Link>
        <Link
          href="/lab"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-indigo-200"
        >
          <FlaskConical className="h-4 w-4 text-violet-600" />
          همکاری از آزمایشگاه
        </Link>
      </div>
    </main>
  );
}
