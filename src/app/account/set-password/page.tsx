import type { Metadata } from "next";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تعیین رمز",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ t?: string }> };

export default async function SetPasswordPage({ searchParams }: Props) {
  const { t } = await searchParams;
  return (
    <PageShell width="narrow">
      <PageHeader title="تعیین رمز حساب" lede="این لینک یک‌بارمصرف است. رمز را در تلگرام نفرستید." />
      <SetPasswordForm token={t ?? ""} />
    </PageShell>
  );
}
