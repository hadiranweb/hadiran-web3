import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/SignInForm";
import { getCurrentAccount } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { HadiranMark } from "@/components/HadiranMark";
import { PageShell } from "@/components/ui/PageShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ورود",
  description: "ورود به هادیران با رمز عبور یا کد یک‌بارمصرف پیامکی.",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const account = await getCurrentAccount();
  const { next } = await searchParams;
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (account) redirect(nextPath);

  return (
    <PageShell width="narrow" className="flex min-h-[70vh] flex-col justify-center py-16">
      <HadiranMark className="mb-4 h-12 w-12" />
      <p className="hadiran-brand-text mb-2 text-sm font-medium">هادیران</p>
      <h1 className="text-3xl font-extrabold leading-[1.35] text-ink">ورود با موبایل</h1>
      <p className="mt-2 mb-8 text-sm leading-7 text-muted">
        شماره را بگذار. اگر قبلاً وارد شده باشی رمز می‌خواهیم؛ وگرنه یک کد پیامکی می‌آید.
      </p>
      <Suspense fallback={<p className="text-sm text-muted">در حال بارگذاری…</p>}>
        <SignInForm />
      </Suspense>
    </PageShell>
  );
}
