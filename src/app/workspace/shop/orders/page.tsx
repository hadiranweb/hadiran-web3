import type { Metadata } from "next";
import { FinancePage } from "@/components/finance/FinancePage";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "مرکز سفارش", robots: { index: false, follow: false } };
export default function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  return <FinancePage searchParams={searchParams} mode="orders"/>;
}
