import assert from "node:assert/strict";
import test from "node:test";
import { shouldBlockDestructiveRebuild } from "./migration-policy.mjs";

test("production blocks 0037 even when legacy flags and explicit confirmation are passed", () => {
  assert.equal(
    shouldBlockDestructiveRebuild({
      isProduction: true,
      markerApplied: false,
      explicitlyConfirmed: true,
      allowDestructiveReset: true,
    }),
    true,
  );
});

test("the legacy reset flag alone cannot authorize 0037 outside production", () => {
  assert.equal(
    shouldBlockDestructiveRebuild({
      isProduction: false,
      markerApplied: false,
      explicitlyConfirmed: false,
      allowDestructiveReset: true,
    }),
    true,
  );
});

test("non-production recovery requires explicit confirmation", () => {
  assert.equal(
    shouldBlockDestructiveRebuild({ isProduction: false, markerApplied: false, explicitlyConfirmed: true }),
    false,
  );
});

test("an applied marker makes the destructive rebuild unnecessary", () => {
  assert.equal(
    shouldBlockDestructiveRebuild({ isProduction: true, markerApplied: true, explicitlyConfirmed: false }),
    false,
  );
});
