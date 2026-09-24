/** Hadiran vocabulary adapted from knowledge-base-transfer-v0.1. */

export const RECORD_STATUSES = [
  "captured",
  "pending_review",
  "approved",
  "rejected",
  "corrected",
  "superseded",
  "published",
] as const;

export const VISIBILITIES = ["private", "unlisted", "public"] as const;

export const CONFIDENCE = ["unknown", "hypothesis", "plausible", "probable", "validated"] as const;

export const RELATION_PUBLISHED_AS = "published_as";
export const RELATION_SUPPORTS = "supports";
export const RELATION_PROMOTED_AS = "promoted_as";

export const SCHEMA_VERSION = "0.1";
