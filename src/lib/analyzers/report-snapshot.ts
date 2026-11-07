import type { AnalyzerPack, PackReport } from "@/lib/analyzers/pack";
import type { InterpretationDocument } from "@/lib/analyzers/document-model";

export const REPORT_CONFIG_SNAPSHOT_FORMAT = "hadiran.report-config.v1" as const;

export type ReportConfigSnapshot = {
  format: typeof REPORT_CONFIG_SNAPSHOT_FORMAT;
  packSlug: string;
  packVersionId: number | null;
  instrumentVersion: string;
  templateId: string;
  reportConfig: PackReport | null;
};

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Freeze the report rules, selected template, and exact instrument identity used for a conversion. */
export function createReportConfigSnapshot(
  pack: AnalyzerPack,
  templateId: string,
  packVersionId: number | null,
): ReportConfigSnapshot {
  return cloneJson({
    format: REPORT_CONFIG_SNAPSHOT_FORMAT,
    packSlug: pack.slug,
    packVersionId,
    instrumentVersion: pack.version,
    templateId,
    reportConfig: pack.report ?? null,
  });
}

/** Persist the complete rendered-data model so later pack/template edits cannot change a saved report. */
export function serializeInterpretationDocument(
  doc: InterpretationDocument,
): Record<string, unknown> {
  return cloneJson(doc) as unknown as Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTextOrNull(value: unknown): boolean {
  return value == null || typeof value === "string";
}

function isNumberOrNull(value: unknown): boolean {
  return value == null || (typeof value === "number" && Number.isFinite(value));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isContextField(value: unknown): boolean {
  return isRecord(value) && typeof value.labelFa === "string" && typeof value.valueFa === "string";
}

function isDocumentKeyword(value: unknown): boolean {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.titleFa !== "string" || !isStringArray(value.children)) {
    return false;
  }
  if (value.score !== undefined && !(typeof value.score === "number" && Number.isFinite(value.score))) return false;
  for (const key of ["scoreFa", "bandLabelFa", "whyFa", "horizonFa", "ownerRoleFa", "micmacLabelFa"]) {
    if (value[key] !== undefined && typeof value[key] !== "string") return false;
  }
  if (value.bandId !== undefined && !["weak", "growing", "strong"].includes(String(value.bandId))) return false;
  return (value.influencersFa === undefined || isStringArray(value.influencersFa))
    && (value.influencedFa === undefined || isStringArray(value.influencedFa));
}

function isDocumentLayer(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.titleFa === "string"
    && typeof value.constructFa === "string"
    && isNumberOrNull(value.score)
    && typeof value.scoreMax === "number"
    && Number.isFinite(value.scoreMax)
    && typeof value.scoreFa === "string"
    && typeof value.scoreMaxFa === "string"
    && typeof value.statusFa === "string"
    && typeof value.asIsFa === "string"
    && typeof value.toBeFa === "string"
    && typeof value.actionsFa === "string"
    && typeof value.isBottleneck === "boolean"
    && Array.isArray(value.keywords)
    && value.keywords.every(isDocumentKeyword);
}

function isScoreRow(value: unknown): boolean {
  return isRecord(value) && typeof value.titleFa === "string" && typeof value.valueFa === "string";
}

function isPattern(value: unknown): boolean {
  return isRecord(value) && typeof value.meaningFa === "string" && typeof value.actionFa === "string";
}

/** Invalid/new-column data falls back to the normalized legacy report representation. */
export function parseInterpretationDocumentSnapshot(value: unknown): InterpretationDocument | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.packNameFa !== "string" ||
    typeof value.packSlug !== "string" ||
    typeof value.version !== "string" ||
    typeof value.templateId !== "string" ||
    typeof value.personNameFa !== "string" ||
    typeof value.closingFa !== "string" ||
    !isTextOrNull(value.businessNameFa) ||
    !isTextOrNull(value.publicCode) ||
    !isTextOrNull(value.submittedAt) ||
    !isTextOrNull(value.totalFa) ||
    !isTextOrNull(value.maturityFa) ||
    !isTextOrNull(value.bottleneckId) ||
    !isTextOrNull(value.bottleneckFa) ||
    !isTextOrNull(value.bottleneckScoreFa) ||
    !isNumberOrNull(value.totalScore) ||
    !isNumberOrNull(value.totalScoreMax) ||
    !isNumberOrNull(value.bottleneckScore) ||
    !Array.isArray(value.context) ||
    !value.context.every(isContextField) ||
    !Array.isArray(value.layers) ||
    !value.layers.every(isDocumentLayer) ||
    !Array.isArray(value.scores) ||
    !value.scores.every(isScoreRow) ||
    !Array.isArray(value.patterns) ||
    !value.patterns.every(isPattern) ||
    (value.causalGraph !== undefined && !isRecord(value.causalGraph)) ||
    (value.deepDive !== undefined && !isRecord(value.deepDive)) ||
    (value.chromeSnapshot !== undefined && value.chromeSnapshot !== null && !isRecord(value.chromeSnapshot))
  ) {
    return null;
  }
  return cloneJson(value) as unknown as InterpretationDocument;
}
