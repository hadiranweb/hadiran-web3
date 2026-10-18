import { ModuleHeading } from "@/components/workspace/ModuleHeading";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { requirePageOwner } from "@/lib/auth/guard";
import { ListingEditor } from "@/components/shop/ListingEditor";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "کالای جدید",
  robots: { index: false, follow: false },
};

export default async function NewListingPage() {
  const account = await requirePageOwner("/workspace/shop/listings/new");
  let courseRows: { id: number; titleFa: string; slug: string }[] = [];
  try {
    if (account.id !== 0) courseRows = await db.select({ id: courses.id, titleFa: courses.titleFa, slug: courses.slug }).from(courses);
  } catch (error) {
    console.error("[hadiran] listing courses", error);
  }
  return (
    <main className="ws-page repo-module">
      <ModuleHeading title="کالای جدید" en="New listing" lede="محصول فیزیکی، دسترسی دیجیتال یا دوره؛ با مشخصات، تصویر و قیمت‌گذاری مستقل." ledeEn="Physical goods, digital entitlements and course access with media, specs and pricing." />
      {account.id === 0 ? <p className="integration-notice mb-6">فرم واقعی ریپو است. در این پیش‌نمایش بدون دیتابیس، ذخیرهٔ کالا فعال نیست.</p> : null}
      <fieldset disabled={account.id === 0}><ListingEditor courses={courseRows} /></fieldset>
    </main>
  );
}
