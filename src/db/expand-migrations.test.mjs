import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration38 = await readFile(new URL("./migrations/0038_assessment_relational_authoring.sql", import.meta.url), "utf8");
const migration39 = await readFile(new URL("./migrations/0039_analyzer_report_document_snapshot.sql", import.meta.url), "utf8");
const migration40 = await readFile(new URL("./migrations/0040_assessment_payment_controls.sql", import.meta.url), "utf8");

test("0038 expands relational authoring without dropping legacy tables", () => {
  assert.match(migration38, /CREATE TABLE analyzer_pack_versions/i);
  assert.match(migration38, /CREATE TABLE analyzer_pack_releases/i);
  assert.match(migration38, /ADD COLUMN pack_version_id/i);
  assert.doesNotMatch(migration38, /\bDROP\s+(?:SCHEMA|TABLE|COLUMN)\b/i);
  assert.doesNotMatch(migration38, /\bTRUNCATE\b/i);
  assert.doesNotMatch(migration38, /\bDELETE\s+FROM\b/i);
});

test("0039 adds the report snapshot column without retiring legacy data", () => {
  assert.match(migration39, /ALTER TABLE analyzer_reports ADD COLUMN document_snapshot JSONB/i);
  assert.doesNotMatch(migration39, /\bDROP\s+(?:SCHEMA|TABLE|COLUMN)\b/i);
  assert.doesNotMatch(migration39, /\bTRUNCATE\b/i);
  assert.doesNotMatch(migration39, /\bDELETE\s+FROM\b/i);
});

test("0040 adds payment controls and sponsorship fields without destructive DDL", () => {
  assert.match(migration40, /execution_payment_mode/i);
  assert.match(migration40, /creator_discount_cap_percent/i);
  assert.match(migration40, /discount_over_cap_irr/i);
  assert.match(migration40, /funding_source/i);
  assert.match(migration40, /sponsor_id/i);
  assert.doesNotMatch(migration40, /\bDROP\s+(?:SCHEMA|TABLE|COLUMN)\b/i);
  assert.doesNotMatch(migration40, /\bTRUNCATE\b/i);
  assert.doesNotMatch(migration40, /\bDELETE\s+FROM\b/i);
});
