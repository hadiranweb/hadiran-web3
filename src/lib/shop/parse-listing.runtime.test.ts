import assert from "node:assert/strict";
import { test } from "node:test";
import { parseListingBody } from "./parse-listing";

const base = {
  titleFa: "اشتراک آزمون‌ساز",
  slug: "authoring-plan",
  amount: "100000",
  kind: "assessment_authoring_subscription",
};

test("authoring subscription listings require explicit positive quota and duration", () => {
  assert.equal(parseListingBody(base), null);
  assert.equal(parseListingBody({ ...base, authoringQuota: "0", authoringDurationDays: "30" }), null);
  assert.equal(parseListingBody({ ...base, authoringQuota: "5", authoringDurationDays: "0" }), null);
  assert.equal(parseListingBody({ ...base, authoringQuota: "5", authoringDurationDays: "30" }), null);
  const parsed = parseListingBody({
    ...base,
    authoringQuota: "5",
    authoringDurationDays: "30",
    authoringRenewalPolicy: "after_current",
  });
  assert.equal(parsed?.authoringQuota, 5);
  assert.equal(parsed?.authoringDurationDays, 30);
  assert.equal(parsed?.authoringRenewalPolicy, "after_current");
});

test("ordinary shop listings do not acquire implicit authoring quota", () => {
  const parsed = parseListingBody({ ...base, kind: "digital_entitlement" });
  assert.equal(parsed?.authoringQuota, null);
  assert.equal(parsed?.authoringDurationDays, null);
  assert.equal(parsed?.authoringRenewalPolicy, null);
});
