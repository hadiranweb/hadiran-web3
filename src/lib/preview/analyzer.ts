import "server-only";
import { previewStore } from "./store";
import { findItem, normalizeAnswer, isComplete } from "@/lib/analyzers/casio-ss/answers";
import { INSTRUMENT_VERSION, casioSsPack } from "@/lib/analyzers/casio-ss/instrument";
import { scorePack } from "@/lib/analyzers/score";
/** Internal preview uses the repository's unchanged validation and scoring engine. */
export async function previewAnalyzerAction(body: { action?: unknown; id?: unknown; value?: unknown }) {
  const store = await previewStore();
  if (!store) return null;
  const fail = (error: string, status = 400) => ({ data: { error }, status });
  if (body.action === "consent") {
    store.attempt ||= { instrumentVersion: INSTRUMENT_VERSION, status: "in_progress", consentAt: new Date().toISOString(), answers: {}, submittedAt: null, results: null };
  } else if (body.action === "answer") {
    if (store.attempt?.status === "submitted") return fail("already_submitted",409);
    if (!store.attempt?.consentAt) return fail("consent_required");
    const item = typeof body.id === "string" ? findItem(body.id) : undefined;
    if (!item) return fail("unknown_item");
    const value = normalizeAnswer(item, body.value);
    if (value == null) return fail("invalid_answer");
    store.attempt.answers[item.id] = value;
  } else if (body.action === "submit") {
    if (!store.attempt?.consentAt) return fail("consent_required");
    if (!isComplete(store.attempt.answers)) return fail("incomplete");
    store.attempt.results = scorePack(casioSsPack, store.attempt.answers);
    store.attempt.status = "submitted";
    store.attempt.submittedAt ||= new Date().toISOString();
  } else return fail("invalid_action");
  return { data: { attempt: store.attempt }, status: 200 };
}
