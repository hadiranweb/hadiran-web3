import { readFileSync } from "node:fs";
import { join } from "node:path";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { analyzerDocumentTemplateOverrides, analyzerDocumentTemplates } from "@/db/schema";
import {
  CASIO_TEMPLATE_CSS,
  CASIO_TEMPLATE_HTML,
  HADIRAN_TEMPLATE_CSS,
  HADIRAN_TEMPLATE_HTML,
  SYSTEM_DIAGNOSIS_TEMPLATE_CSS,
  SYSTEM_DIAGNOSIS_TEMPLATE_HTML,
} from "@/lib/analyzers/document-defaults";
import {
  parseChrome,
  type DocumentChrome,
} from "@/lib/analyzers/document-chrome";
import { canonicalizeTemplateId } from "@/lib/analyzers/document-templates";
import { ensureInterpretationDocumentsSchema } from "@/lib/auth/schema-guard";

function readPublicSvg(rel: string): string {
  try {
    return readFileSync(join(process.cwd(), "public", rel), "utf8").replace(/<\?xml[^?]*\?>\s*/i, "");
  } catch {
    return "";
  }
}

export function defaultChrome(templateId: string): DocumentChrome {
  const id = canonicalizeTemplateId(templateId);
  if (id === "casio-ss") {
    return {
      html: CASIO_TEMPLATE_HTML,
      css: CASIO_TEMPLATE_CSS,
      logos: {
        light: readPublicSvg("casio-ss/logos/casio_logo_light.svg"),
        dark: readPublicSvg("casio-ss/logos/casio_logo_dark.svg"),
        seal: readPublicSvg("casio-ss/logos/casio_seal_red.svg"),
      },
      pageSize: "A4",
      pageMargin: "0",
    };
  }
  if (id === "system-diagnosis") {
    return {
      html: SYSTEM_DIAGNOSIS_TEMPLATE_HTML,
      css: HADIRAN_TEMPLATE_CSS + SYSTEM_DIAGNOSIS_TEMPLATE_CSS,
      logos: {
        light: readPublicSvg("brand/hadiran-mark.svg"),
        dark: readPublicSvg("brand/hadiran-mark.svg"),
        seal: readPublicSvg("brand/hadiran-mark.svg"),
      },
      pageSize: "A4",
      pageMargin: "0",
    };
  }
  return {
    html: HADIRAN_TEMPLATE_HTML,
    css: HADIRAN_TEMPLATE_CSS,
    logos: {
      light: readPublicSvg("brand/hadiran-mark.svg"),
      dark: readPublicSvg("brand/hadiran-mark.svg"),
      seal: readPublicSvg("brand/hadiran-mark.svg"),
    },
    pageSize: "A4",
    pageMargin: "0",
  };
}

function staleCasioChrome(html: string, css: string) {
  return !html.includes("{{{overallChartSvg}}}") || !html.includes("keywordGraphGroups") || !css.includes("keyword-graph");
}

export function mergeChrome(templateId: string, raw: unknown, baseRaw?: unknown): DocumentChrome {
  const fallback = baseRaw !== undefined ? mergeChrome(templateId, baseRaw) : defaultChrome(templateId);
  const parsed = parseChrome(raw);
  const id = canonicalizeTemplateId(templateId);
  let html = parsed.html.trim() ? parsed.html : fallback.html;
  let css = parsed.css.trim() ? parsed.css : fallback.css;
  if (id === "casio-ss" && staleCasioChrome(html, css)) {
    html = fallback.html;
    css = fallback.css;
  }
  return {
    html,
    css,
    logos: {
      light: parsed.logos.light.trim() ? parsed.logos.light : fallback.logos.light,
      dark: parsed.logos.dark.trim() ? parsed.logos.dark : fallback.logos.dark,
      seal: parsed.logos.seal.trim() ? parsed.logos.seal : fallback.logos.seal,
    },
    pageSize: parsed.pageSize || fallback.pageSize,
    pageMargin: parsed.pageMargin || fallback.pageMargin,
  };
}

export function clipDocumentChrome(chrome: DocumentChrome): DocumentChrome {
  return {
    html: chrome.html.slice(0, 200_000),
    css: chrome.css.slice(0, 80_000),
    logos: {
      light: chrome.logos.light.slice(0, 40_000),
      dark: chrome.logos.dark.slice(0, 40_000),
      seal: chrome.logos.seal.slice(0, 40_000),
    },
    pageSize: chrome.pageSize,
    pageMargin: chrome.pageMargin.slice(0, 32),
  };
}

function chromeJson(chrome: DocumentChrome): Record<string, unknown> {
  return chrome as unknown as Record<string, unknown>;
}

export type StoredDocumentTemplate = {
  id: string;
  titleFa: string;
  layoutKey: string;
  brandNameFa: string;
  system: boolean;
  source: "base" | "override";
  chrome: DocumentChrome;
};

const ALLOWED_TEMPLATE_IDS = new Set(["hadiran", "casio-ss", "system-diagnosis"]);

function toStored(
  row: typeof analyzerDocumentTemplates.$inferSelect,
  overlay: unknown | undefined,
): StoredDocumentTemplate {
  return {
    id: row.id,
    titleFa: row.titleFa,
    layoutKey: row.layoutKey,
    brandNameFa: row.brandNameFa,
    system: row.system,
    source: overlay !== undefined ? "override" : "base",
    chrome: overlay !== undefined ? mergeChrome(row.id, overlay, row.chrome) : mergeChrome(row.id, row.chrome),
  };
}

export async function listDocumentTemplates(accountId: number): Promise<StoredDocumentTemplate[]> {
  await ensureInterpretationDocumentsSchema();
  const rows = await db.select().from(analyzerDocumentTemplates).orderBy(asc(analyzerDocumentTemplates.id));
  const overrides = await db
    .select()
    .from(analyzerDocumentTemplateOverrides)
    .where(eq(analyzerDocumentTemplateOverrides.accountId, accountId));
  const overlayByTemplate = new Map(overrides.map((row) => [row.templateId, row.chrome]));
  return rows.filter((row) => ALLOWED_TEMPLATE_IDS.has(row.id)).map((row) => toStored(row, overlayByTemplate.get(row.id)));
}

export async function readDocumentChrome(templateId: string, accountId?: number): Promise<DocumentChrome> {
  await ensureInterpretationDocumentsSchema();
  const id = canonicalizeTemplateId(templateId);
  const [row] = await db
    .select()
    .from(analyzerDocumentTemplates)
    .where(eq(analyzerDocumentTemplates.id, id))
    .limit(1);
  let overlay: unknown | undefined;
  if (accountId != null) {
    const [over] = await db
      .select()
      .from(analyzerDocumentTemplateOverrides)
      .where(
        and(
          eq(analyzerDocumentTemplateOverrides.accountId, accountId),
          eq(analyzerDocumentTemplateOverrides.templateId, id),
        ),
      )
      .limit(1);
    overlay = over?.chrome;
  }
  if (row) {
    return overlay !== undefined ? mergeChrome(row.id, overlay, row.chrome) : mergeChrome(row.id, row.chrome);
  }
  const [legacy] = await db
    .select()
    .from(analyzerDocumentTemplates)
    .where(eq(analyzerDocumentTemplates.id, templateId))
    .limit(1);
  if (legacy) {
    return overlay !== undefined ? mergeChrome(legacy.id, overlay, legacy.chrome) : mergeChrome(templateId, legacy.chrome);
  }
  return overlay !== undefined ? mergeChrome(templateId, overlay) : mergeChrome(templateId, undefined);
}

export async function saveDocumentTemplateChrome(input: {
  id: string;
  chrome: DocumentChrome;
  accountId: number;
  applyBase: boolean;
}): Promise<StoredDocumentTemplate | null> {
  await ensureInterpretationDocumentsSchema();
  if (!ALLOWED_TEMPLATE_IDS.has(input.id)) return null;
  const next = clipDocumentChrome(input.chrome);
  if (input.applyBase) {
    await db
      .delete(analyzerDocumentTemplateOverrides)
      .where(
        and(
          eq(analyzerDocumentTemplateOverrides.accountId, input.accountId),
          eq(analyzerDocumentTemplateOverrides.templateId, input.id),
        ),
      );
    const [row] = await db
      .update(analyzerDocumentTemplates)
      .set({ chrome: chromeJson(next), updatedAt: new Date() })
      .where(eq(analyzerDocumentTemplates.id, input.id))
      .returning();
    if (!row) return null;
    return toStored(row, undefined);
  }
  await db
    .insert(analyzerDocumentTemplateOverrides)
    .values({
      accountId: input.accountId,
      templateId: input.id,
      chrome: chromeJson(next),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [analyzerDocumentTemplateOverrides.accountId, analyzerDocumentTemplateOverrides.templateId],
      set: { chrome: chromeJson(next), updatedAt: new Date() },
    });
  const [row] = await db
    .select()
    .from(analyzerDocumentTemplates)
    .where(eq(analyzerDocumentTemplates.id, input.id))
    .limit(1);
  if (!row) return null;
  return toStored(row, next);
}
