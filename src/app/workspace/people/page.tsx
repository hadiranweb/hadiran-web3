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
    <div className="ws-page">
      <header className="ws-page-heading">
        <div>
          <p className="ws-overline">میز</p>
          <h1>اعضا</h1>
          <p>
            فهرست ثبت‌نام‌ها برای مدیر میز است، نه صفحهٔ ادمین جدا. نقش و دسترسی را همین‌جا عوض کنید. ردپا را کامل یا
            تکه‌تکه پاک کنید — از جمله شماره. پیوند معرف را جایگزین یا قطع کنید.
          </p>
        </div>
      </header>
      <PeopleDesk />
    </div>
  );
}
