import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePageOwner } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "نوشتن مطلب",
  robots: { index: false, follow: false },
};

export default async function NewKnowledgePage() {
  await requirePageOwner("/workspace/capture");
  redirect("/workspace/capture");
}
