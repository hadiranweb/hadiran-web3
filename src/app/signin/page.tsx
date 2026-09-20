import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/SignInForm";
import { getCurrentAccount } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "ورود",
  description: "ورود به هادیران با کد یک‌بارمصرف پیامکی.",
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
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <p className="mb-2 text-sm font-medium text-indigo-600">هادیران</p>
      <h1 className="text-3xl font-bold text-slate-900">ورود با موبایل</h1>
      <p className="mt-2 mb-8 text-sm leading-7 text-slate-500">
        رمز لازم نیست. یک کد کوتاه به شمارهٔ ایرانی‌ات پیامک می‌شود.
      </p>
      <Suspense fallback={<p className="text-sm text-slate-400">در حال بارگذاری…</p>}>
        <SignInForm />
      </Suspense>
    </main>
  );
}
