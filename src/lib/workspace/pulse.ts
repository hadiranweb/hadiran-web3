import { and, count, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { knowledge, memoryItems, semanticRecords } from "@/db/schema";

export type PulseCounts = {
  captured: number | null;
  readyToPromote: number | null;
  publicMemory: number | null;
  knowledgeProjections: number | null;
};

export type OpenRecord = {
  id: string;
  titleFa: string;
  status: string;
  visibility: string;
  updatedAt: Date | null;
};

export type PublishedRow = {
  recordId: string;
  titleFa: string;
  slug: string | null;
  updatedAt: Date | null;
};

export type WorkspaceDesk = {
  ok: boolean;
  pulse: PulseCounts;
  openWork: OpenRecord[];
  published: PublishedRow[];
  allRecords: OpenRecord[];
};

const emptyPulse: PulseCounts = {
  captured: null,
  readyToPromote: null,
  publicMemory: null,
  knowledgeProjections: null,
};

function asOpen(row: typeof semanticRecords.$inferSelect): OpenRecord {
  return {
    id: row.id,
    titleFa: row.titleFa,
    status: row.status,
    visibility: row.visibility,
    updatedAt: row.updatedAt,
  };
}

export async function loadWorkspaceDesk(ownerId: number): Promise<WorkspaceDesk> {
  try {
    const records = await db
      .select()
      .from(semanticRecords)
      .where(eq(semanticRecords.ownerId, ownerId))
      .orderBy(desc(semanticRecords.updatedAt));

    const captured = records.filter((row) => row.status === "captured").length;
    const readyToPromote = records.filter(
      (row) => row.status !== "captured" && !row.promotedMemoryId
    ).length;
    const openWork = records
      .filter(
        (row) => !row.promotedMemoryId || row.status === "captured" || row.status === "pending_review"
      )
      .map(asOpen);

    const [publicMemory] = await db
      .select({ value: count() })
      .from(memoryItems)
      .where(and(eq(memoryItems.lifecycle, "approved"), eq(memoryItems.visibility, "public")));

    const [knowledgeProjections] = await db
      .select({ value: count() })
      .from(knowledge)
      .innerJoin(memoryItems, eq(knowledge.memoryItemId, memoryItems.id))
      .where(
        and(
          isNotNull(knowledge.memoryItemId),
          eq(memoryItems.lifecycle, "approved"),
          eq(memoryItems.visibility, "public")
        )
      );

    const publishedRows = await db
      .select({
        recordId: semanticRecords.id,
        titleFa: memoryItems.titleFa,
        slug: knowledge.slug,
        updatedAt: memoryItems.updatedAt,
      })
      .from(semanticRecords)
      .innerJoin(memoryItems, eq(semanticRecords.promotedMemoryId, memoryItems.id))
      .leftJoin(knowledge, eq(knowledge.memoryItemId, memoryItems.id))
      .where(
        and(
          eq(semanticRecords.ownerId, ownerId),
          eq(memoryItems.lifecycle, "approved"),
          eq(memoryItems.visibility, "public")
        )
      )
      .orderBy(desc(memoryItems.updatedAt))
      .limit(10);

    return {
      ok: true,
      pulse: {
        captured,
        readyToPromote,
        publicMemory: Number(publicMemory?.value ?? 0),
        knowledgeProjections: Number(knowledgeProjections?.value ?? 0),
      },
      openWork,
      published: publishedRows,
      allRecords: records.map(asOpen),
    };
  } catch (error) {
    console.error("[hadiran] workspace desk", error);
    return {
      ok: false,
      pulse: emptyPulse,
      openWork: [],
      published: [],
      allRecords: [],
    };
  }
}

export function recordStatusFa(status: string): string {
  const map: Record<string, string> = {
    captured: "ثبت خام",
    pending_review: "در انتظار بازبینی",
    approved: "تأییدشده",
    rejected: "ردشده",
    corrected: "اصلاح‌شده",
    superseded: "جایگزین",
    published: "منتشر",
  };
  return map[status] || status;
}
