import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ASSESSMENT_EXECUTION_SERVICE,
  assessmentTariffServices,
  isAssessmentService,
} from "./assessment-policy";

test("every authored pack, including a recreated legacy slug, uses the shared service policy", () => {
  assert.equal(ASSESSMENT_EXECUTION_SERVICE, "execution");
  assert.deepEqual(assessmentTariffServices("mindset-gate"), ["execution", "interpretation", "document"]);
  assert.deepEqual(assessmentTariffServices("casio-ss"), ["execution", "interpretation", "document"]);
  assert.equal(isAssessmentService("execution"), true);
});
