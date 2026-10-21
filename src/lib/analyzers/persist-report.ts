import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  accounts,
  analyzerAttempts,
  analyzerReportActions,
  analyzerReportLayers,
  analyzerReports,
  casioAttempts,
} from "@/db/schema";
import {
  buildInterpretationDocument,
  faNum,
  faScore,
  type DocumentKeyword,
  type InterpretationDocument,
} from "@/lib/analyzers/document-model";
import {
  attemptKindOf,
  documentHref,
  resolveDocumentTemplateId,
  templateAllowedForPack,
  templateTitleFa,
  type DocumentListItem,
} from "@/lib/analyzers/document-templates";
import type { AnalyzerPack } from "@/lib/analyzers/pack";
import type { WorkspaceAttemptRow } from "@/lib/analyzers/workspace-attempt-types";
import { clipDocumentChrome, readDocumentChrome } from "@/lib/analyzers/document-templates-store";
import { ensureInterpretationDocumentsSchema } from "@/lib/auth/schema-guard";

type StoredKeyword = { id: string; titleFa: string; children: { id: string; titleFa: string }[] };

export type ConvertedDocumentRef = {
  id: number;
  attemptId: number;
  templateId: string;
  href: string;
};

function actionTitles(text: string): string[] {
  return text
    .split(/\n|؛/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function keywordPayload(keywords: DocumentKeyword[]): StoredKeyword[] {
  return keywords.map((keyword) => ({
    id: keyword.id,
    titleFa: keyword.titleFa,
    children: keyword.children.map((child, index) => ({
      id: `${keyword.id}-c${index}`,
      titleFa: child,
    })),
  }));
}

function keywordsFromStored(value: unknown): DocumentKeyword[] {
  if (!Array.isArray(value)) return [];
  const list: DocumentKeyword[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const row = entry as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id : "";
    const titleFa = typeof row.titleFa === "string" ? row.titleFa : "";
    if (!id || !titleFa) continue;
    const children: string[] = [];
    if (Array.isArray(row.children)) {
      for (const child of row.children) {
        if (typeof child === "string" && child.trim()) children.push(child.trim());
        else if (child && typeof child === "object" && !Array.isArray(child)) {
          const title = (child as Record<string, unknown>).titleFa;
          if (typeof title === "string" && title.trim()) children.push(title.trim());
        }
      }
    }
    list.push({ id, titleFa, children });
  }
  return list;
}

export async function personNameOf(accountId: number): Promise<string> {
  const [row] = await db
    .select({
      givenName: accounts.givenName,
      familyName: accounts.familyName,
      displayName: accounts.displayName,
    })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);
  const parts = [row?.givenName, row?.familyName].filter((part): part is string => Boolean(part?.trim()));
  if (parts.length) return parts.join(" ");
  const display = row?.displayName?.trim();
  return display || "عضو";
}

function documentFromStored(
  report: typeof analyzerReports.$inferSelect,
  layers: (typeof analyzerReportLayers.$inferSelect)[],
  actions: (typeof analyzerReportActions.$inferSelect)[],
): InterpretationDocument {
  const actionsByLayer = new Map<string, string[]>();
  for (const action of actions) {
    const list = actionsByLayer.get(action.layerId) ?? [];
    list.push(action.actionTitle);
    actionsByLayer.set(action.layerId, list);
  }
  return {
    packNameFa: report.coverTitle,
    packSlug: report.slug,
    version: report.instrumentVersion || report.schemaVersion,
    templateId: report.templateId,
    personNameFa: report.personNameSnapshot || "عضو",
    businessNameFa: report.businessNameSnapshot,
    publicCode: null,
    submittedAt: report.reportDate ? report.reportDate.toISOString() : null,
    context: report.context ?? [],
    totalScore: report.totalScore,
    totalScoreMax: report.totalScoreMax,
    totalFa: report.totalScore != null ? faScore(report.totalScore) : null,
    maturityFa: report.maturityLabel,
    bottleneckId: report.bottleneckId,
    bottleneckFa: report.bottleneckName,
    bottleneckScore: report.bottleneckScore,
    bottleneckScoreFa: report.bottleneckScore != null ? faScore(report.bottleneckScore) : null,
    layers: layers.map((layer) => {
      const joined = actionsByLayer.get(layer.layerId)?.join("؛ ") ?? "";
      return {
        id: layer.layerId,
        titleFa: layer.layerName,
        constructFa: layer.constructFa ?? "",
        score: layer.score,
        scoreMax: layer.scoreMax ?? 20,
        scoreFa: layer.score != null ? faScore(layer.score) : "—",
        scoreMaxFa: faNum(layer.scoreMax ?? 20),
        statusFa: layer.status ?? "",
        asIsFa: layer.asIsText ?? "",
        toBeFa: layer.toBeText ?? "",
        actionsFa: joined,
        isBottleneck: layer.isBottleneck,
        keywords: keywordsFromStored(layer.keywords),
      };
    }),
    scores: [],
    patterns: report.patterns ?? [],
    closingFa: report.closingFa ?? "",
    chromeSnapshot: report.chromeSnapshot ?? null,
  };
}

async function hydrate(report: typeof analyzerReports.$inferSelect): Promise<InterpretationDocument> {
  const layers = await db
    .select()
    .from(analyzerReportLayers)
    .where(eq(analyzerReportLayers.reportId, report.id))
    .orderBy(asc(analyzerReportLayers.displayOrder));
  const actions = await db
    .select()
    .from(analyzerReportActions)
    .where(eq(analyzerReportActions.reportId, report.id))
    .orderBy(asc(analyzerReportActions.sortOrder));
  return documentFromStored(report, layers, actions);
}

export async function readStoredInterpretation(
  attemptKind: "casio" | "analyzer",
  attemptId: number,
): Promise<InterpretationDocument | null> {
  await ensureInterpretationDocumentsSchema();
  const [report] = await db
    .select()
    .from(analyzerReports)
    .where(and(eq(analyzerReports.attemptKind, attemptKind), eq(analyzerReports.attemptId, attemptId)))
    .limit(1);
  if (!report) return null;
  return hydrate(report);
}

export async function readConvertedDocument(id: number): Promise<{
  id: number;
  slug: string;
  accountId: number;
  attemptId: number;
  attemptKind: string;
  templateId: string;
  doc: InterpretationDocument;
} | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  await ensureInterpretationDocumentsSchema();
  const [report] = await db.select().from(analyzerReports).where(eq(analyzerReports.id, id)).limit(1);
  if (!report) return null;
  return {
    id: report.id,
    slug: report.slug,
    accountId: report.accountId,
    attemptId: report.attemptId,
    attemptKind: report.attemptKind,
    templateId: report.templateId,
    doc: await hydrate(report),
  };
}

export async function listConvertedDocuments(slugs: string[]): Promise<DocumentListItem[]> {
  await ensureInterpretationDocumentsSchema();
  if (!slugs.length) return [];
  const rows = await db
    .select()
    .from(analyzerReports)
    .where(inArray(analyzerReports.slug, slugs))
    .orderBy(desc(analyzerReports.createdAt))
    .limit(400);
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    packNameFa: row.coverTitle,
    attemptId: row.attemptId,
    templateId: row.templateId,
    templateTitleFa: templateTitleFa(row.templateId),
    personNameFa: row.personNameSnapshot || "عضو",
    businessNameFa: row.businessNameSnapshot,
    createdAt: row.createdAt.toISOString(),
    submittedAt: row.reportDate ? row.reportDate.toISOString() : null,
  }));
}

export async function documentIdByAttempt(
  slug: string,
  attemptIds: number[],
): Promise<Map<number, number>> {
  await ensureInterpretationDocumentsSchema();
  const map = new Map<number, number>();
  if (!attemptIds.length) return map;
  const kind = attemptKindOf(slug);
  const rows = await db
    .select({ id: analyzerReports.id, attemptId: analyzerReports.attemptId })
    .from(analyzerReports)
    .where(
      and(
        eq(analyzerReports.slug, slug),
        eq(analyzerReports.attemptKind, kind),
        inArray(analyzerReports.attemptId, attemptIds),
      ),
    );
  for (const row of rows) map.set(row.attemptId, row.id);
  return map;
}

async function attemptOwnerId(attemptKind: "casio" | "analyzer", attemptId: number): Promise<number | null> {
  if (attemptKind === "casio") {
    const [row] = await db
      .select({ accountId: casioAttempts.accountId })
      .from(casioAttempts)
      .where(eq(casioAttempts.id, attemptId))
      .limit(1);
    return row?.accountId ?? null;
  }
  const [row] = await db
    .select({ accountId: analyzerAttempts.accountId })
    .from(analyzerAttempts)
    .where(eq(analyzerAttempts.id, attemptId))
    .limit(1);
  return row?.accountId ?? null;
}

async function writeChildren(reportId: number, doc: InterpretationDocument) {
  await db.delete(analyzerReportActions).where(eq(analyzerReportActions.reportId, reportId));
  await db.delete(analyzerReportLayers).where(eq(analyzerReportLayers.reportId, reportId));
  if (doc.layers.length) {
    await db.insert(analyzerReportLayers).values(
      doc.layers.map((layer, index) => ({
        reportId,
        layerId: layer.id,
        layerName: layer.titleFa,
        displayOrder: index,
        score: layer.score,
        scoreMax: layer.scoreMax,
        status: layer.statusFa || null,
        constructFa: layer.constructFa || null,
        asIsText: layer.asIsFa || null,
        toBeText: layer.toBeFa || null,
        isBottleneck: layer.isBottleneck,
        keywords: keywordPayload(layer.keywords),
      })),
    );
  }
  const actionRows: { reportId: number; layerId: string; sortOrder: number; actionTitle: string }[] = [];
  for (const layer of doc.layers) {
    for (const title of actionTitles(layer.actionsFa)) {
      actionRows.push({
        reportId,
        layerId: layer.id,
        sortOrder: actionRows.length,
        actionTitle: title.slice(0, 4000),
      });
    }
  }
  if (actionRows.length) await db.insert(analyzerReportActions).values(actionRows);
}

async function upsertSnapshot(input: {
  pack: AnalyzerPack;
  accountId: number;
  attemptId: number;
  attemptKind: "casio" | "analyzer";
  templateId: string;
  doc: InterpretationDocument;
  chromeSnapshot: Record<string, unknown>;
}): Promise<number> {
  const values = {
    slug: input.pack.slug,
    accountId: input.accountId,
    attemptId: input.attemptId,
    attemptKind: input.attemptKind,
    templateId: input.templateId,
    schemaVersion: "1.0",
    instrumentVersion: input.doc.version,
    coverTitle: input.doc.packNameFa.slice(0, 256),
    totalScore: input.doc.totalScore,
    totalScoreMax: input.doc.totalScoreMax,
    maturityLabel: input.doc.maturityFa,
    bottleneckId: input.doc.bottleneckId,
    bottleneckName: input.doc.bottleneckFa,
    bottleneckScore: input.doc.bottleneckScore,
    personNameSnapshot: input.doc.personNameFa.slice(0, 256),
    businessNameSnapshot: input.doc.businessNameFa?.slice(0, 256) ?? null,
    reportDate: input.doc.submittedAt ? new Date(input.doc.submittedAt) : new Date(),
    closingFa: input.doc.closingFa,
    context: input.doc.context,
    patterns: input.doc.patterns,
    chromeSnapshot: input.chromeSnapshot,
  };
  const [existing] = await db
    .select({ id: analyzerReports.id })
    .from(analyzerReports)
    .where(
      and(eq(analyzerReports.attemptKind, input.attemptKind), eq(analyzerReports.attemptId, input.attemptId)),
    )
    .limit(1);
  if (existing) {
    await db.update(analyzerReports).set(values).where(eq(analyzerReports.id, existing.id));
    await writeChildren(existing.id, input.doc);
    return existing.id;
  }
  const [inserted] = await db.insert(analyzerReports).values(values).returning({ id: analyzerReports.id });
  if (!inserted) throw new Error("insert_failed");
  await writeChildren(inserted.id, input.doc);
  return inserted.id;
}

export async function convertAttemptDocument(input: {
  pack: AnalyzerPack;
  attemptId: number;
  templateId: string;
  row: WorkspaceAttemptRow;
  converterAccountId: number;
}): Promise<ConvertedDocumentRef> {
  await ensureInterpretationDocumentsSchema();
  const templateId = resolveDocumentTemplateId(input.pack, input.templateId);
  if (!templateAllowedForPack(input.pack, templateId)) {
    throw new Error("bad_template");
  }
  const row = input.row;
  if (row.status !== "submitted") throw new Error("not_submitted");
  const attemptKind = attemptKindOf(input.pack.slug);
  const accountId = await attemptOwnerId(attemptKind, input.attemptId);
  if (!accountId) throw new Error("missing_account");
  const doc = buildInterpretationDocument(input.pack, row, templateId);
  const chrome = clipDocumentChrome(await readDocumentChrome(templateId, input.converterAccountId));
  const id = await upsertSnapshot({
    pack: input.pack,
    accountId,
    attemptId: input.attemptId,
    attemptKind,
    templateId,
    doc,
    chromeSnapshot: chrome as unknown as Record<string, unknown>,
  });
  const { tryDeliverCapturedDocument } = await import("@/lib/finance/assessment-orders");
  await tryDeliverCapturedDocument({ attemptKind, attemptId: input.attemptId, accountId });
  return { id, attemptId: input.attemptId, templateId, href: documentHref(id) };
}

export async function readMemberConvertedDocument(
  pack: AnalyzerPack,
  accountId: number,
): Promise<InterpretationDocument | null> {
  await ensureInterpretationDocumentsSchema();
  const attemptKind = attemptKindOf(pack.slug);
  if (pack.slug === "casio-ss") {
    const [row] = await db
      .select({ id: casioAttempts.id })
      .from(casioAttempts)
      .where(and(eq(casioAttempts.accountId, accountId), eq(casioAttempts.status, "submitted")))
      .orderBy(desc(casioAttempts.submittedAt))
      .limit(1);
    if (!row) return null;
    const { canReadPaidAssessmentService } = await import("@/lib/finance/assessment-access");
    if (!(await canReadPaidAssessmentService({ slug: pack.slug, accountId, attemptId: row.id, service: "document" }))) {
      return null;
    }
    return readStoredInterpretation(attemptKind, row.id);
  }
  const [row] = await db
    .select({ id: analyzerAttempts.id })
    .from(analyzerAttempts)
    .where(
      and(
        eq(analyzerAttempts.accountId, accountId),
        eq(analyzerAttempts.slug, pack.slug),
        eq(analyzerAttempts.status, "submitted"),
      ),
    )
    .orderBy(desc(analyzerAttempts.submittedAt))
    .limit(1);
  if (!row) return null;
  const { canReadPaidAssessmentService } = await import("@/lib/finance/assessment-access");
  if (!(await canReadPaidAssessmentService({ slug: pack.slug, accountId, attemptId: row.id, service: "document" }))) {
    return null;
  }
  return readStoredInterpretation(attemptKind, row.id);
}
