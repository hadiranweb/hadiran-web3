import { requirePageOwner } from "@/lib/auth/guard";
import { CaptureEditor } from "@/components/knowledge/CaptureEditor";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ثبت دانش",
  robots: { index: false, follow: false },
};

export default async function WorkspaceCapturePage() {
  await requirePageOwner("/workspace/capture");
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">ثبت جدید</h1>
      <p className="mb-8 text-sm text-slate-500">ذخیره فقط captured است؛ برای دانشنامه باید ارتقا بدهید.</p>
      <CaptureEditor />
    </main>
  );
}
