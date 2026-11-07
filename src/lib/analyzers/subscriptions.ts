import { and, asc, eq, gt, lte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { analyzerPacks, assessmentAuthoringSubscriptions, assessmentAuthoringUsage } from "@/db/schema";
import { ensureAnalyzerAuthoringSchema } from "@/lib/auth/schema-guard";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import { selectAuthoringQuotaWindow, summarizeAuthoringQuota } from "@/lib/analyzers/authoring-quota-policy";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class AssessmentAuthoringQuotaError extends Error {
  constructor(public code: "subscription_required" | "quota_exhausted") {
    super(code);
  }
}

async function activeAuthoringSubscriptions(tx: Tx, accountId: number, now: Date) {
  return tx
    .select()
    .from(assessmentAuthoringSubscriptions)
    .where(
      and(
        eq(assessmentAuthoringSubscriptions.accountId, accountId),
        lte(assessmentAuthoringSubscriptions.startsAt, now),
        gt(assessmentAuthoringSubscriptions.endsAt, now),
      ),
    )
    .orderBy(asc(assessmentAuthoringSubscriptions.endsAt), asc(assessmentAuthoringSubscriptions.id))
    .for("update");
}

export async function createAuthoredPackWithQuota(input: {
  pack: AnalyzerPack;
  accountId: number;
  isOwner: boolean;
}): Promise<AnalyzerPack> {
  await ensureAnalyzerAuthoringSchema();
  return db.transaction(async (tx) => {
    const now = new Date();
    let subscription: (typeof assessmentAuthoringSubscriptions.$inferSelect) | null = null;
    if (!input.isOwner) {
      const active = await activeAuthoringSubscriptions(tx, input.accountId, now);
      const selection = selectAuthoringQuotaWindow(active);
      if (!selection.ok) throw new AssessmentAuthoringQuotaError(selection.error);
      subscription = selection.window;
    }

    await tx.insert(analyzerPacks).values({
      slug: input.pack.slug,
      status: input.pack.status,
      pack: input.pack,
      createdBy: input.accountId,
      updatedAt: now,
    });

    if (subscription) {
      const [updated] = await tx
        .update(assessmentAuthoringSubscriptions)
        .set({ quotaUsed: sql`${assessmentAuthoringSubscriptions.quotaUsed} + 1` })
        .where(
          and(
            eq(assessmentAuthoringSubscriptions.id, subscription.id),
            lt(assessmentAuthoringSubscriptions.quotaUsed, assessmentAuthoringSubscriptions.quotaTotal),
            lte(assessmentAuthoringSubscriptions.startsAt, now),
            gt(assessmentAuthoringSubscriptions.endsAt, now),
          ),
        )
        .returning({ quotaUsed: assessmentAuthoringSubscriptions.quotaUsed });
      if (!updated) throw new AssessmentAuthoringQuotaError("quota_exhausted");
      await tx.insert(assessmentAuthoringUsage).values({
        subscriptionId: subscription.id,
        accountId: input.accountId,
        packSlug: input.pack.slug,
        eventKey: `assessment-authoring:${subscription.id}:${input.pack.slug}`,
        createdAt: now,
      });
    }
    return input.pack;
  });
}

export async function getAssessmentAuthoringQuota(accountId: number, isOwner = false) {
  if (isOwner) return { isOwner: true, remaining: null, activeSubscriptions: 0, nextExpiry: null };
  const now = new Date();
  const active = await db
    .select({
      quotaTotal: assessmentAuthoringSubscriptions.quotaTotal,
      quotaUsed: assessmentAuthoringSubscriptions.quotaUsed,
      endsAt: assessmentAuthoringSubscriptions.endsAt,
    })
    .from(assessmentAuthoringSubscriptions)
    .where(
      and(
        eq(assessmentAuthoringSubscriptions.accountId, accountId),
        lte(assessmentAuthoringSubscriptions.startsAt, now),
        gt(assessmentAuthoringSubscriptions.endsAt, now),
      ),
    )
    .orderBy(asc(assessmentAuthoringSubscriptions.endsAt));
  return { isOwner: false, ...summarizeAuthoringQuota(active) };
}
