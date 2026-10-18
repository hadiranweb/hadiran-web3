import { hasAnalyzerDesk } from "@/lib/analyzers/access";
import { safeReturnPath, workspaceHome } from "@/lib/workspace/access";
import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/SignInForm";
import { developmentTestLogin } from "@/lib/auth/config";
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
  const preview = developmentTestLogin();
  const account = await getCurrentAccount();
  const { next } = await searchParams;
  const nextPath = safeReturnPath(next);
  if (account) redirect(nextPath === "/" ? workspaceHome({ ...account, analyzerDesk: await hasAnalyzerDesk(account) }) : nextPath);

  return (
    <PageShell width="narrow" className="auth-shell flex min-h-[70vh] flex-col justify-center py-16">
      <HadiranMark className="mb-4 h-12 w-12" />
      <p className="hadiran-brand-text mb-2 text-sm font-medium">هادیران</p>
      <h1 className="mb-8 text-3xl font-extrabold leading-[1.35] text-ink">ورود با موبایل</h1>
      <SignInForm nextPath={nextPath} previewLogin={!!preview} />
    </PageShell>
  );
}
