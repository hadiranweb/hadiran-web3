import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { requirePageAccount } from "@/lib/auth/guard";
import type { SessionAccount } from "@/lib/auth/session";
import { ensureAccountPublicCode } from "@/lib/auth/public-code";
import { referredByPublicCode } from "@/lib/auth/referral";
import { maskPhone } from "@/lib/auth/phone";
import { AccountReferralForm } from "@/components/auth/AccountReferralForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { AccountAvatarPanel } from "@/components/auth/AccountAvatarPanel";
import { AccountPasswordForm } from "@/components/auth/AccountPasswordForm";
import { AccountProfileForm } from "@/components/auth/AccountProfileForm";
import { readAccountAvatar } from "@/lib/account/avatar-store";
import { listShelf } from "@/lib/knowledge/bookmarks";
import { ShelfList } from "@/components/knowledge/ShelfList";
import { StudioTakeover } from "@/components/studio/StudioTakeover";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "حساب",
  description: "نام و شناسهٔ حساب هادیران.",
  robots: { index: false, follow: false },
};

async function loadAccountPanelData(session: SessionAccount) {
  const publicCode = await ensureAccountPublicCode(session.id);
  const referredBy = await referredByPublicCode(session.id);
  const { avatar } = await readAccountAvatar(session);
  // قفسه اگر جدولش تازه باشد و مایگریشن هنوز اجرا نشده باشد، صفحه را نمی‌شکند.
  const shelf = await listShelf(session.id).catch(() => []);
  const [row] = await db
    .select({
      givenName: accounts.givenName,
      familyName: accounts.familyName,
      phone: accounts.phone,
    })
    .from(accounts)
    .where(eq(accounts.id, session.id))
    .limit(1);
  const givenName = row?.givenName ?? "";
  const familyName = row?.familyName ?? "";
  return {
    publicCode,
    referredBy,
    avatar,
    shelf,
    givenName,
    familyName,
    phone: maskPhone(row?.phone || session.phone),
    name: [givenName, familyName].filter(Boolean).join(" ") || session.displayName || "عضو",
    needsPassword: session.needsPassword,
  };
}

type AccountPanelData = Awaited<ReturnType<typeof loadAccountPanelData>>;

/** بدنهٔ اصلی، بدون PageShell؛ در استودیو به‌صورت server slot در AccountPanel قرار می‌گیرد. */
function AccountPanelContent({ data }: { data: AccountPanelData }) {
  return (
    <>
      <PageHeader
        title="حساب من"
        lede="نام برای گزارش‌ها و آینه‌هاست. شناسهٔ هشت‌رقمی همان کد معرف شماست؛ با آن وارد نمی‌شوید."
      />
      <dl className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="surface p-5">
          <dt className="text-xs font-medium text-mark">کد معرف / شناسه</dt>
          <dd className="mt-2 font-mono text-2xl tracking-wide text-ink" dir="ltr">
            {data.publicCode}
          </dd>
        </div>
        <div className="surface p-5">
          <dt className="text-xs font-medium text-mark">ورود</dt>
          <dd className="mt-2 text-sm leading-7 text-ink" dir="ltr">
            {data.phone}
          </dd>
          <dd className="mt-1 text-xs text-muted">موبایل تأییدشده. ایمیل و تلگرام هنوز روشن نیستند.</dd>
        </div>
      </dl>
      <ShelfList items={data.shelf} />
      <AccountAvatarPanel initial={data.avatar} name={data.name} />
      <AccountReferralForm referredBy={data.referredBy} />
      <AccountProfileForm givenName={data.givenName} familyName={data.familyName} />
      {data.needsPassword ? <AccountPasswordForm /> : null}
      <p className="mt-8 text-sm">
        <Link href="/account/purchases" className="text-accent">
          خریدهای من
        </Link>
      </p>
    </>
  );
}

export default async function AccountPage() {
  // گیت احراز هویت پیش از takeover؛ مهمان هیچ‌وقت نسخهٔ استودیویی حساب را نمی‌بیند.
  const session = await requirePageAccount("/account");
  const data = await loadAccountPanelData(session);
  const accountPanel = <AccountPanelContent data={data} />;
  return (
    <StudioTakeover siteKey="account" accountPanel={accountPanel}>
      <PageShell width="narrow">
        <AccountPanelContent data={data} />
      </PageShell>
    </StudioTakeover>
  );
}
