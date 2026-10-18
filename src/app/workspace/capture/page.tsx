import { ModuleHeading } from "@/components/workspace/ModuleHeading";
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
    <main className="ws-page repo-module">
      <ModuleHeading title="ثبت جدید" en="New capture" lede="ذخیره فقط ثبت خام و خصوصی است؛ انتشار تنها پس از بازبینی و ارتقا انجام می‌شود." ledeEn="Saving creates a private capture, not a publication. Review and promote it separately." />
      <section className="ws-panel p-5 sm:p-7">
      <CaptureEditor />
      </section>
    </main>
  );
}
