import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ASSESSMENT_ADDON_SERVICES,
  ASSESSMENT_EXECUTION_SERVICE,
  assessmentTariffServices,
  isAssessmentService,
} from "./assessment-policy";

test("execution is a priced service only for non-Casio authored analyzers", () => {
  assert.equal(ASSESSMENT_EXECUTION_SERVICE, "execution");
  assert.deepEqual(assessmentTariffServices("mindset-gate"), ["execution", ...ASSESSMENT_ADDON_SERVICES]);
  assert.deepEqual(assessmentTariffServices("casio-ss"), ["interpretation", "document"]);
  assert.equal(isAssessmentService("execution"), true);
});
