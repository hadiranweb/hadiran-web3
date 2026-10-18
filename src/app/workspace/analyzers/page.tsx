import { buildCasioAuthoredPack } from "@/lib/analyzers/casio-ss/authored-pack";
import { ModuleHeading } from "@/components/workspace/ModuleHeading";
import Link from "@/components/workspace/WorkspaceLink";
import type { Metadata } from "next";
import { requirePageStaff } from "@/lib/auth/guard";
import { listAccessiblePacks } from "@/lib/analyzers/access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تألیف تحلیلگر‌ها",
  robots: { index: false, follow: false },
};

const statusFa: Record<string, string> = {
  draft: "پیش‌نویس",
  open: "باز",
  archived: "بایگانی",
};

export default async function WorkspaceAnalyzersPage() {
  const account = await requirePageStaff("/workspace/analyzers");
  const authored = account.id === 0 ? [{ pack: buildCasioAuthoredPack(), access: { view: true, edit: true, responses: false, grant: false } }] : await listAccessiblePacks(account);

  return (
    <main className="ws-page repo-module space-y-8">
      <ModuleHeading title="تحلیلگرها" en="Analyzer authoring" lede="ساخت و ویرایش سؤال، نمره، رضایت و گزارش؛ همهٔ آزمون‌ها از جمله CASIO از همین میز مدیریت می‌شوند." ledeEn="Manage questions, scoring, consent and reports for every assessment, including CASIO." action={<Link href="/workspace/analyzers/new" className="ws-button ws-primary">آزمون تازه</Link>} />
      {account.id === 0 ? <p className="integration-notice">در پیش‌نمایش، CASIO با بستهٔ بذر اولیه اجرا می‌شود. ویرایشگر قابل بررسی است؛ ذخیرهٔ تغییرات و ساخت تحلیلگر به دیتابیس نیاز دارد.</p> : null}


      <section>
        {authored.length === 0 ? (
          <p className="text-sm text-muted">آزمونی نیست.</p>
        ) : (
          <ul className="space-y-2">
            {authored.map(({ pack, access }) => (
              <li key={pack.slug}>
                <Link
                  href={`/workspace/analyzers/${pack.slug}`}
                  className="block rounded-2xl border border-line bg-elev p-4 hover:border-accent"
                >
                  <p className="font-medium text-ink">{pack.nameFa}</p>
                  <p className="mt-1 text-xs text-muted">
                    {pack.slug} · {statusFa[pack.status] ?? pack.status} · {pack.version}
                    {access.edit ? "" : " · خواندنی"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
