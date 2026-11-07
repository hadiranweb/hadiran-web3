import assert from "node:assert/strict";
import { test } from "node:test";
import { selectAuthoringQuotaWindow, summarizeAuthoringQuota } from "./authoring-quota-policy";

const later = new Date("2026-12-01T00:00:00.000Z");
const sooner = new Date("2026-11-15T00:00:00.000Z");

test("selects the earliest-expiring active quota with remaining capacity", () => {
  const selection = selectAuthoringQuotaWindow([
    { quotaTotal: 4, quotaUsed: 0, endsAt: later },
    { quotaTotal: 3, quotaUsed: 1, endsAt: sooner },
  ]);
  assert.equal(selection.ok, true);
  if (selection.ok) assert.equal(selection.window.endsAt, sooner);
});

test("distinguishes missing subscriptions from exhausted active subscriptions", () => {
  assert.deepEqual(selectAuthoringQuotaWindow([]), { ok: false, error: "subscription_required" });
  assert.deepEqual(
    selectAuthoringQuotaWindow([{ quotaTotal: 1, quotaUsed: 1, endsAt: sooner }]),
    { ok: false, error: "quota_exhausted" },
  );
});

test("quota summary reports only remaining units and the earliest usable expiry", () => {
  assert.deepEqual(
    summarizeAuthoringQuota([
      { quotaTotal: 2, quotaUsed: 2, endsAt: sooner },
      { quotaTotal: 5, quotaUsed: 3, endsAt: later },
    ]),
    { remaining: 2, activeSubscriptions: 2, nextExpiry: later.toISOString() },
  );
});
