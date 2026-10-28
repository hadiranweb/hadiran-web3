/**
 * Server-side reads for the workspace graph editor (HADIRAN-SSOT-2.1.0).
 *
 * Kept separate from repository.ts so the page can render without importing write paths,
 * and so every mutation goes through the same validate → integrity → publish gate.
 */

import {
  graphDrift,
  latestPublishedRevision,
  listGraphAudit,
  loadDraftGraph,
  publishGraphDraft,
  reseedGraphFromCode,
  writeDraftGraph,
} from "./repository";
import { countManifest, type GraphManifest, type SsotDomainCode } from "./types";
import { errorsOnly, validateGraphManifest } from "./integrity";
import { manifestDigest } from "./hash";
import { buildGraphManifest } from "./manifest";

export type GraphEditorView = {
  manifest: GraphManifest;
  counts: ReturnType<typeof countManifest>;
  draftHash: string;
  drift: Awaited<ReturnType<typeof graphDrift>>;
  revision: {
    revision: number;
    payloadHash: string;
    publishedAt: Date | null;
    noteFa: string | null;
    ssotVersion: string;
    codingVersion: string;
  } | null;
  issues: ReturnType<typeof validateGraphManifest>;
  blocking: number;
  seedHash: string;
  audit: Awaited<ReturnType<typeof listGraphAudit>>;
};

export async function loadGraphForEditor(domainCode: SsotDomainCode): Promise<GraphEditorView> {
  const manifest = await loadDraftGraph();
  const drift = await graphDrift(domainCode);
  const published = await latestPublishedRevision(domainCode);
  const issues = validateGraphManifest(manifest);
  const audit = await listGraphAudit(domainCode, 20);
  return {
    manifest,
    counts: countManifest(manifest),
    draftHash: drift.draftHash,
    drift,
    revision: published
      ? {
          revision: published.revision,
          payloadHash: published.payloadHash,
          publishedAt: published.publishedAt,
          noteFa: published.noteFa ?? null,
          ssotVersion: published.ssotVersion,
          codingVersion: published.codingVersion,
        }
      : null,
    issues,
    blocking: errorsOnly(issues).length,
    seedHash: manifestDigest(buildGraphManifest()).hash,
    audit,
  };
}

export type GraphSaveResult =
  | { ok: true; counts: ReturnType<typeof countManifest>; hash: string }
  | { ok: false; error: "integrity_failed"; issues: ReturnType<typeof validateGraphManifest> };

export async function saveGraphDraft(
  manifest: GraphManifest,
  actor: { id: number; role: string },
): Promise<GraphSaveResult> {
  const result = await writeDraftGraph(manifest, { actorId: actor.id, actorRole: actor.role });
  if (!result.ok) return { ok: false, error: "integrity_failed", issues: result.issues };
  return { ok: true, counts: result.counts, hash: result.hash };
}

export { publishGraphDraft, reseedGraphFromCode };
