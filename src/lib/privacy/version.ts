import { createHash } from "node:crypto";
import { privacyDetails, privacySummary, privacyUseTerms } from "./content";

export function privacyPolicyVersion() {
  const payload = [privacySummary, ...privacyUseTerms, ...privacyDetails].join("\n");
  return createHash("sha256").update(payload, "utf8").digest("hex").slice(0, 16);
}
