import { and, count, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { knowledge, memoryItems, semanticRecords } from "@/db/schema";
import { gardenPhase } from "@/lib/knowledge/lifecycle";

export type PulseCounts = {
  draft: number | null;
  review: number | null;
  publicPublished: number | null;
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
  draft: null,
  review: null,
  publicPublished: null,
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

    const draft = records.filter((row) => gardenPhase(row) === "draft").length;
    const review = records.filter((row) => gardenPhase(row) === "review").length;
    const openWork = records.filter((row) => {
      const phase = gardenPhase(row);
      return phase === "draft" || phase === "review";
    }).map(asOpen);

    const [publicPublished] = await db
      .select({ value: count() })
      .from(semanticRecords)
      .innerJoin(memoryItems, eq(semanticRecords.promotedMemoryId, memoryItems.id))
      .innerJoin(knowledge, eq(knowledge.memoryItemId, memoryItems.id))
      .where(
        and(
          eq(semanticRecords.ownerId, ownerId),
          isNotNull(knowledge.memoryItemId),
          eq(memoryItems.lifecycle, "approved"),
          eq(memoryItems.visibility, "public"),
        ),
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
          eq(memoryItems.visibility, "public"),
        ),
      )
      .orderBy(desc(memoryItems.updatedAt))
      .limit(10);

    return {
      ok: true,
      pulse: {
        draft,
        review,
        publicPublished: Number(publicPublished?.value ?? 0),
      },
      openWork,
      published: publishedRows,
      allRecords: records.filter((row) => gardenPhase(row) !== "archived").map(asOpen),
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
    captured: "پیش‌نویس",
    pending_review: "در بازبینی",
    approved: "تأییدشده",
    rejected: "ردشده",
    corrected: "اصلاح‌شده",
    superseded: "جایگزین",
    published: "منتشرشده",
    archived: "بایگانی",
    draft: "پیش‌نویس",
    review: "در بازبینی",
  };
  return map[status] || status;
}
