"use client";
import { CaptureEditor } from "@/components/knowledge/CaptureEditor";
import type { WorkspaceItem } from "@/lib/workspace/types";
/** Compatibility wrapper. New captures always use /api/workspace/records, never POST /api/knowledge. */
export function NoteEditor({ liveItem }: { initialId?: string; liveItem?: WorkspaceItem }) {
  return <CaptureEditor initial={liveItem ? { id: liveItem.id, titleFa: liveItem.title, titleEn: liveItem.titleEn, intent: liveItem.category, summaryFa: liveItem.detail, bodyFa: liveItem.body, status: liveItem.status } : undefined} />;
}
