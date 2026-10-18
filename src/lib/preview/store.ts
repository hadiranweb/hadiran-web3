import "server-only";
import { createHash } from "node:crypto";
import type { SessionAccount } from "@/lib/auth/session";
import { getCurrentAccount } from "@/lib/auth/session";
import { developmentTestLogin } from "@/lib/auth/config";
import { validPreviewTicket } from "@/lib/auth/preview-ticket";
import type { semanticRecords } from "@/db/schema";
import type { AttemptView } from "@/lib/analyzers/casio-ss/answers";
import { demoKnowledge } from "@/lib/workspace/demo";
export type PreviewRecord = typeof semanticRecords.$inferSelect;
type Store = { expires: number; records: PreviewRecord[]; attempt: AttemptView | null; profile: { givenName: string; familyName: string } };
const shared = globalThis as typeof globalThis & { __hadiranPreviewData?: Map<string, Store> };
/** Separate data per verified one-hour grant; never substitutes for a real DB. */
export async function previewStore(account?: SessionAccount): Promise<Store | null> {
  if (process.env.DATABASE_URL || !developmentTestLogin()) return null;
  const identity = account || await getCurrentAccount();
  if (identity?.id !== 0 || !identity.previewTicket || !validPreviewTicket(identity.previewTicket)) return null;
  const stores = shared.__hadiranPreviewData ||= new Map();
  const now = Date.now();
  for (const [key, value] of stores) if (value.expires <= now) stores.delete(key);
  const key = createHash("sha256").update(identity.previewTicket).digest("hex");
  if (!stores.has(key)) {
    if (stores.size >= 100) stores.delete(stores.keys().next().value!);
    stores.set(key, { expires: now + 3600000, attempt: null, profile: { givenName: "مالک", familyName: "آزمایشی" }, records: demoKnowledge.map((item) => ({ id: `SR_DEMO_${item.id}`, recordType: "semantic_record", kind: "observation", titleFa: item.title, titleEn: item.titleEn || null, slug: null, status: "captured", visibility: "private", intent: item.category, summaryFa: item.detail, bodyFa: item.body || "", language: "fa", ownerId: 0, promotedMemoryId: null, schemaVersion: "0.1", createdAt: new Date(item.updated), updatedAt: new Date(item.updated) })) });
  }
  return stores.get(key)!;
}
