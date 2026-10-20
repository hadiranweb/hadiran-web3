import assert from "node:assert/strict";
import { test } from "node:test";
import { canDeleteDraft, gardenPhase } from "./garden-phase";

test("draft has no projection and is deletable", () => {
  const row = { status: "captured", promotedMemoryId: null };
  assert.equal(gardenPhase(row), "draft");
  assert.equal(canDeleteDraft(row), true);
});

test("review is not a separate garden", () => {
  assert.equal(gardenPhase({ status: "pending_review", promotedMemoryId: null }), "review");
  assert.equal(canDeleteDraft({ status: "pending_review", promotedMemoryId: null }), false);
});

test("promoted content is published even if status lags", () => {
  assert.equal(gardenPhase({ status: "approved", promotedMemoryId: "MEMORY1" }), "published");
  assert.equal(canDeleteDraft({ status: "approved", promotedMemoryId: "MEMORY1" }), false);
});

test("archive is distinct from unpublish", () => {
  assert.equal(gardenPhase({ status: "archived", promotedMemoryId: "MEMORY1" }), "archived");
  assert.equal(canDeleteDraft({ status: "archived", promotedMemoryId: "MEMORY1" }), false);
});
