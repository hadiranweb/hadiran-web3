import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  assessmentAuthoringPlanOrders,
  assessmentAuthoringPlans,
  assessmentAuthoringSubscriptions,
} from "@/db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function syncAssessmentAuthoringPlan(
  tx: Tx,
  input: {
    listingId: string;
    kind: string;
    quotaPerPeriod: number | null;
    durationDays: number | null;
    renewalPolicy: "immediate" | "after_current" | null;
  },
) {
  if (input.kind !== "assessment_authoring_subscription") {
    await tx
      .update(assessmentAuthoringPlans)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(assessmentAuthoringPlans.listingId, input.listingId));
    return;
  }
  if (
    !Number.isSafeInteger(input.quotaPerPeriod) ||
    (input.quotaPerPeriod ?? 0) <= 0 ||
    !Number.isSafeInteger(input.durationDays) ||
    (input.durationDays ?? 0) <= 0 ||
    (input.renewalPolicy !== "immediate" && input.renewalPolicy !== "after_current")
  ) {
    throw new Error("invalid_assessment_authoring_plan");
  }
  await tx
    .insert(assessmentAuthoringPlans)
    .values({
      listingId: input.listingId,
      quotaPerPeriod: input.quotaPerPeriod!,
      durationDays: input.durationDays!,
      renewalPolicy: input.renewalPolicy!,
      active: true,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: assessmentAuthoringPlans.listingId,
      set: {
        quotaPerPeriod: input.quotaPerPeriod!,
        durationDays: input.durationDays!,
        renewalPolicy: input.renewalPolicy!,
        active: true,
        updatedAt: new Date(),
      },
    });
}

export async function snapshotAssessmentAuthoringPlan(tx: Tx, orderId: string, listingId: string) {
  const [plan] = await tx
    .select({
      quotaPerPeriod: assessmentAuthoringPlans.quotaPerPeriod,
      durationDays: assessmentAuthoringPlans.durationDays,
      renewalPolicy: assessmentAuthoringPlans.renewalPolicy,
      active: assessmentAuthoringPlans.active,
    })
    .from(assessmentAuthoringPlans)
    .where(eq(assessmentAuthoringPlans.listingId, listingId))
    .limit(1)
    .for("share");
  if (
    !plan ||
    !plan.active ||
    !Number.isSafeInteger(plan.quotaPerPeriod) ||
    plan.quotaPerPeriod <= 0 ||
    !Number.isSafeInteger(plan.durationDays) ||
    plan.durationDays <= 0 ||
    (plan.renewalPolicy !== "immediate" && plan.renewalPolicy !== "after_current")
  ) {
    throw new Error("assessment_authoring_plan_unavailable");
  }
  await tx.insert(assessmentAuthoringPlanOrders).values({
    orderId,
    listingId,
    quotaSnapshot: plan.quotaPerPeriod,
    durationDaysSnapshot: plan.durationDays,
    renewalPolicySnapshot: plan.renewalPolicy,
  });
}

export async function provisionAssessmentAuthoringSubscription(
  tx: Tx,
  input: { orderId: string; listingId: string; accountId: number },
) {
  const [snapshot] = await tx
    .select()
    .from(assessmentAuthoringPlanOrders)
    .where(eq(assessmentAuthoringPlanOrders.orderId, input.orderId))
    .limit(1)
    .for("share");
  if (!snapshot || snapshot.listingId !== input.listingId) return false;

  if (snapshot.renewalPolicySnapshot !== "immediate" && snapshot.renewalPolicySnapshot !== "after_current") return false;

  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext('hadiran:authoring-subscription'), hashtext(${String(input.accountId)}))`,
  );
  const now = new Date();
  let startsAt = now;
  if (snapshot.renewalPolicySnapshot === "after_current") {
    const [latest] = await tx
      .select({ endsAt: assessmentAuthoringSubscriptions.endsAt })
      .from(assessmentAuthoringSubscriptions)
      .where(and(eq(assessmentAuthoringSubscriptions.accountId, input.accountId), gt(assessmentAuthoringSubscriptions.endsAt, now)))
      .orderBy(desc(assessmentAuthoringSubscriptions.endsAt))
      .limit(1)
      .for("share");
    if (latest && latest.endsAt > now) startsAt = latest.endsAt;
  }
  const endsAt = new Date(startsAt.getTime() + snapshot.durationDaysSnapshot * 24 * 60 * 60 * 1000);
  const inserted = await tx
    .insert(assessmentAuthoringSubscriptions)
    .values({
      accountId: input.accountId,
      listingId: snapshot.listingId,
      orderId: input.orderId,
      quotaTotal: snapshot.quotaSnapshot,
      quotaUsed: 0,
      startsAt,
      endsAt,
    })
    .onConflictDoNothing()
    .returning({ id: assessmentAuthoringSubscriptions.id });
  if (inserted.length) return true;
  const [existing] = await tx
    .select({ id: assessmentAuthoringSubscriptions.id })
    .from(assessmentAuthoringSubscriptions)
    .where(eq(assessmentAuthoringSubscriptions.orderId, input.orderId))
    .limit(1);
  return Boolean(existing);
}
