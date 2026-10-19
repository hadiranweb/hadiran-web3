import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { PeopleDesk } from "@/components/workspace/PeopleDesk";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "اعضا",
  robots: { index: false, follow: false },
};

export default async function PeoplePage() {
  await requirePageOwner("/workspace/people");
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">اعضا</h1>
      <p className="text-sm leading-7 text-slate-500">
        فهرست ثبت‌نام‌ها برای مدیر میز است، نه صفحهٔ ادمین جدا. نقش و دسترسی را همین‌جا عوض کنید. ردپا را کامل یا تکه‌تکه
        پاک کنید — از جمله شماره. پیوند معرف را جایگزین یا قطع کنید.
      </p>
      <PeopleDesk />
    </main>
  );
}
