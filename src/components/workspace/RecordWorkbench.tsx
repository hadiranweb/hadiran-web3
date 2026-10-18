"use client";
import { useState } from "react";
import Link from "./WorkspaceLink";
import { useWorkspace } from "./WorkspaceContext";
import { ModuleHeading } from "./ModuleHeading";
import { CaptureEditor, type CaptureDraft } from "@/components/knowledge/CaptureEditor";
import { PromoteButton } from "@/components/knowledge/PromoteButton";
export function RecordWorkbench({ initial, visibility }: { initial: CaptureDraft & { id: string }; visibility: string }) {
  const { t } = useWorkspace();
  const [dirty, setDirty] = useState(false);
  const statuses: Record<string,string> = { captured: t("ثبت خام", "Captured"), published: t("منتشر", "Published"), approved: t("تأییدشده", "Approved"), pending_review: t("در بازبینی", "Pending review") };
  return <main className="ws-page repo-module space-y-6">
    <Link className="ws-text-link" href="/workspace/knowledge">{t("بازگشت به ثبت‌ها و دانش", "Back to captures & knowledge")}</Link>
    <ModuleHeading title={initial.titleFa} en={initial.titleEn || initial.titleFa} lede={`${statuses[initial.status || ""] || initial.status} · ${visibility === "public" ? t("عمومی", "Public") : t("خصوصی", "Private")}`} />
    <section className="ws-panel p-5 sm:p-7"><CaptureEditor initial={initial} onDirtyChange={setDirty} /></section>
    <section className="ws-panel p-5 sm:p-7"><h2 className="font-bold mb-4">{t("بازبینی و ارتقا", "Review & promote")}</h2><PromoteButton recordId={initial.id} disabled={dirty} initialVisibility={visibility === "public" ? "public" : "private"} /></section>
  </main>;
}
