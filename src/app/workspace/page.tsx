import Link from "next/link";
import { db } from "@/db";
import { semanticRecords } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requirePageOwner } from "@/lib/auth/guard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "میز کار",
  robots: { index: false, follow: false },
};

export default async function WorkspacePage() {
  const account = await requirePageOwner("/workspace");
  let items: (typeof semanticRecords.$inferSelect)[] = [];
  try {
    items = await db
      .select()
      .from(semanticRecords)
      .where(eq(semanticRecords.ownerId, account.id))
      .orderBy(desc(semanticRecords.updatedAt));
  } catch (error) {
    console.error("[hadiran] workspace list", error);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">میز کار</h1>
          <p className="mt-1 text-sm text-slate-500">ثبت خام اینجا می‌ماند تا ارتقا شود. دانشنامه فقط نمود تأییدشده است.</p>
        </div>
        <Link
          href="/workspace/capture"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          ثبت جدید
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-slate-500">هنوز ثبتی نیست.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/workspace/records/${item.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-200"
              >
                <p className="font-medium text-slate-900">{item.titleFa}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.status} · {item.visibility}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
