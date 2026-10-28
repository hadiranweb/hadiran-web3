/**
 * Deterministic content hash for graph manifests and revisions.
 *
 * Canonicalisation is what makes seeding idempotent and publishing auditable: the same
 * graph always hashes to the same value, regardless of the key order it was authored in.
 */

import { createHash } from "node:crypto";
import type { GraphManifest, ManifestCounts } from "./types";
import { countManifest } from "./types";

/** Recursively sorts object keys and drops undefined/`null`-only noise. */
export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((row) => canonicalize(row));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const nested = (value as Record<string, unknown>)[key];
      if (nested === undefined) continue;
      out[key] = canonicalize(nested);
    }
    return out;
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function hashManifest(manifest: GraphManifest): string {
  return sha256(canonicalJson(manifest));
}

/**
 * The hash that belongs on a revision row. `counts` is derived, not authored, so it is
 * folded in to make a tampered snapshot with edited counts impossible.
 */
export function revisionFingerprint(manifest: GraphManifest, counts: ManifestCounts): string {
  return sha256(canonicalJson({ manifest: canonicalize(manifest), counts }));
}

export function manifestDigest(manifest: GraphManifest): { hash: string; counts: ManifestCounts } {
  const counts = countManifest(manifest);
  return { hash: revisionFingerprint(manifest, counts), counts };
}
