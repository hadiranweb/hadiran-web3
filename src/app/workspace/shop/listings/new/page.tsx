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
  await requirePageOwner("/workspace/shop/listings/new");
  let courseRows: { id: number; titleFa: string; slug: string }[] = [];
  try {
    courseRows = await db.select({ id: courses.id, titleFa: courses.titleFa, slug: courses.slug }).from(courses);
  } catch (error) {
    console.error("[hadiran] listing courses", error);
  }
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">کالای جدید</h1>
      <ListingEditor courses={courseRows} />
    </main>
  );
}
