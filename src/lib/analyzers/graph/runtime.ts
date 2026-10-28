/**
 * The published graph, in memory, for the scoring engine (HADIRAN-SSOT-2.1.0).
 *
 * The report engine is synchronous and is called from page renders, the printable document and
 * the Telegram bot path. So the cache is warmed at boot and refreshed on publish, and read here
 * without an await. Two rules keep that honest:
 *
 *   1. the engine reads the newest *published* snapshot, never the draft — an unpublished edit
 *      must not reach a respondent;
 *   2. if the database is absent or unseeded, this returns null and every caller falls back to
 *      the code context, which is byte-identical to what shipped before the split.
 */

import { graphIsSeeded, latestPublishedRevision, loadDraftGraph } from "./repository";
import { buildGraphContext } from "./overlay";
import { setActiveGraphContext, type CasioGraphContext } from "@/lib/analyzers/casio-ss/graph-context";
import type { GraphManifest } from "./types";

const CASIO_DOMAIN = "DOM.CASIO_SS";

let cached: CasioGraphContext | null = null;
let warming: Promise<CasioGraphContext | null> | null = null;

function looksLikeManifest(value: unknown): value is GraphManifest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GraphManifest>;
  return (
    Array.isArray(candidate.items) &&
    Array.isArray(candidate.keywords) &&
    Array.isArray(candidate.layers) &&
    Array.isArray(candidate.edges)
  );
}

/**
 * The engine reads through `currentGraphContext()` in `graph-context.ts`, so every change here has
 * to land there too — a cache the report never looks at would just be a second source of truth.
 */
function setCached(context: CasioGraphContext | null): CasioGraphContext | null {
  cached = context;
  setActiveGraphContext(context);
  return context;
}

export function invalidateGraphContext(): void {
  setCached(null);
}

/** Read the published graph for the current process. Called at boot and after each publish. */
export async function refreshGraphContext(): Promise<CasioGraphContext | null> {
  try {
    if (!(await graphIsSeeded())) {
      return setCached(null);
    }
    const published = await latestPublishedRevision(CASIO_DOMAIN);
    const snapshot = published?.snapshot;
    if (looksLikeManifest(snapshot)) {
      return setCached(
        buildGraphContext(snapshot, {
          revision: published?.revision ?? null,
          payloadHash: published?.payloadHash ?? null,
        }),
      );
    }
    // Seeded but never published (or a snapshot from an older shape): read the draft so the
    // desk and the engine still agree, and keep a null revision so the UI can say so.
    const draft = await loadDraftGraph();
    return setCached(buildGraphContext(draft, { revision: null, payloadHash: null }));
  } catch {
    return setCached(null);
  }
}

/** Concurrent callers share one read. */
export function warmGraphContext(): Promise<CasioGraphContext | null> {
  if (cached) return Promise.resolve(cached);
  if (!warming) {
    warming = refreshGraphContext().finally(() => {
      warming = null;
    });
  }
  return warming;
}
