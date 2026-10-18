import { AccountAvatarPanel } from "@/components/auth/AccountAvatarPanel";
import { readAccountAvatar } from "@/lib/account/avatar-store";
import { previewStore } from "@/lib/preview/store";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { requirePageAccount } from "@/lib/auth/guard";
import { ensureAccountPublicCode } from "@/lib/auth/public-code";
import { referredByPublicCode } from "@/lib/auth/referral";
import { maskPhone } from "@/lib/auth/phone";
import { AccountReferralForm } from "@/components/auth/AccountReferralForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { AccountPasswordForm } from "@/components/auth/AccountPasswordForm";
import { AccountProfileForm } from "@/components/auth/AccountProfileForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "حساب",
  description: "نام و شناسهٔ حساب هادیران.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await requirePageAccount("/account");
  const preview = await previewStore(session);
  const { avatar } = await readAccountAvatar(session);
  const publicCode = preview ? "پیش‌نمایش" : await ensureAccountPublicCode(session.id);
  const referredBy = preview ? null : await referredByPublicCode(session.id);
  const [row] = preview ? [{ ...preview.profile, phone: session.phone }] : await db
    .select({
      givenName: accounts.givenName,
      familyName: accounts.familyName,
      phone: accounts.phone,
    })
    .from(accounts)
    .where(eq(accounts.id, session.id))
    .limit(1);

  return (
    <PageShell width="narrow" className="account-profile-page">
      {preview ? <p className="integration-notice mb-6">حساب نمایشی؛ نام‌ها فقط تا پایان همین نشست نگه داشته می‌شوند و شناسهٔ واقعی ساخته نمی‌شود.</p> : null}
      <PageHeader
        title="حساب من"
        lede="نام برای گزارش‌ها و تحلیلگر‌هاست. شناسهٔ هشت‌رقمی همان کد معرف شماست؛ با آن وارد نمی‌شوید."
      />
      <dl className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="surface p-5">
          <dt className="text-xs font-medium text-mark">کد معرف / شناسه</dt>
          <dd className="mt-2 font-mono text-2xl tracking-wide text-ink" dir="ltr">
            {publicCode}
          </dd>
        </div>
        <div className="surface p-5">
          <dt className="text-xs font-medium text-mark">ورود</dt>
          <dd className="mt-2 text-sm leading-7 text-ink" dir="ltr">
            {maskPhone(row?.phone || session.phone)}
          </dd>
          <dd className="mt-1 text-xs text-muted">موبایل تأییدشده. ایمیل و تلگرام هنوز روشن نیستند.</dd>
        </div>
      </dl>
      <AccountAvatarPanel initial={avatar} name={row?.givenName || "دوست هادیران"} />
      {preview ? null : <AccountReferralForm referredBy={referredBy} />}
      <AccountProfileForm givenName={row?.givenName ?? ""} familyName={row?.familyName ?? ""} />
      {session.needsPassword ? <AccountPasswordForm /> : null}
    </PageShell>
  );
}
