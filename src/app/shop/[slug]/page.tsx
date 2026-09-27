import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { shopListings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentAccount } from "@/lib/auth/session";
import { hasListingEntitlement } from "@/lib/shop/access";
import { formatMoney } from "@/lib/shop/money";
import { MarkdownReadonly } from "@/components/MarkdownReadonly";
import { StartOrderButton } from "@/components/shop/StartOrderButton";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [item] = await db.select().from(shopListings).where(eq(shopListings.slug, slug));
    if (!item || !item.published) return { title: "یافت نشد", robots: { index: false, follow: false } };
    return {
      title: item.titleFa,
      description: item.summaryFa ?? undefined,
      alternates: { canonical: `/shop/${slug}` },
    };
  } catch {
    return { title: "فروشگاه" };
  }
}

export default async function ShopItemPage({ params }: Props) {
  const { slug } = await params;
  const [item] = await db.select().from(shopListings).where(eq(shopListings.slug, slug));
  if (!item || !item.published) notFound();
  const account = await getCurrentAccount();
  const entitled =
    account?.role === "owner" || (account ? await hasListingEntitlement(account.id, item.id) : false);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/shop" className="mb-6 inline-block text-sm text-slate-500 hover:text-indigo-600">
        بازگشت به فروشگاه
      </Link>
      <article className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10">
        <h1 className="text-3xl font-bold text-slate-900">{item.titleFa}</h1>
        <p className="mt-2 text-lg font-medium text-indigo-700">{formatMoney(item.amount, item.currency)}</p>
        {item.summaryFa ? <p className="mt-4 text-slate-600">{item.summaryFa}</p> : null}
        <div className="mt-6">
          <MarkdownReadonly source={item.bodyFa} />
        </div>
        <div className="mt-8 border-t border-slate-100 pt-6">
          {entitled ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-emerald-700">دسترسی باز است.</p>
              <MarkdownReadonly source={item.accessBodyFa} emptyLabel="محتوای تحویل ثبت نشده." />
            </div>
          ) : account ? (
            <StartOrderButton slug={item.slug} />
          ) : (
            <Link
              href={`/signin?next=${encodeURIComponent(`/shop/${item.slug}`)}`}
              className="inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
            >
              ورود برای خرید
            </Link>
          )}
        </div>
      </article>
    </main>
  );
}
