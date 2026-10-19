import { readFileSync } from "node:fs";
import { join } from "node:path";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { analyzerDocumentTemplates } from "@/db/schema";
import {
  CASIO_TEMPLATE_CSS,
  CASIO_TEMPLATE_HTML,
  HADIRAN_TEMPLATE_CSS,
  HADIRAN_TEMPLATE_HTML,
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

export function mergeChrome(templateId: string, raw: unknown): DocumentChrome {
  const fallback = defaultChrome(templateId);
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

export type StoredDocumentTemplate = {
  id: string;
  titleFa: string;
  layoutKey: string;
  brandNameFa: string;
  system: boolean;
  chrome: DocumentChrome;
};

export async function listDocumentTemplates(): Promise<StoredDocumentTemplate[]> {
  await ensureInterpretationDocumentsSchema();
  const rows = await db.select().from(analyzerDocumentTemplates).orderBy(asc(analyzerDocumentTemplates.id));
  return rows
    .filter((row) => row.id === "hadiran" || row.id === "casio-ss")
    .map((row) => ({
      id: row.id,
      titleFa: row.titleFa,
      layoutKey: row.layoutKey,
      brandNameFa: row.brandNameFa,
      system: row.system,
      chrome: mergeChrome(row.id, row.chrome),
    }));
}

export async function readDocumentChrome(templateId: string): Promise<DocumentChrome> {
  await ensureInterpretationDocumentsSchema();
  const id = canonicalizeTemplateId(templateId);
  const [row] = await db
    .select()
    .from(analyzerDocumentTemplates)
    .where(eq(analyzerDocumentTemplates.id, id))
    .limit(1);
  if (row) return mergeChrome(row.id, row.chrome);
  const [legacy] = await db
    .select()
    .from(analyzerDocumentTemplates)
    .where(eq(analyzerDocumentTemplates.id, templateId))
    .limit(1);
  return mergeChrome(templateId, legacy?.chrome);
}

export async function updateDocumentTemplateChrome(id: string, chrome: DocumentChrome): Promise<StoredDocumentTemplate | null> {
  await ensureInterpretationDocumentsSchema();
  const allowed = id === "hadiran" || id === "casio-ss";
  if (!allowed) return null;
  const next: DocumentChrome = {
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
  const [row] = await db
    .update(analyzerDocumentTemplates)
    .set({ chrome: next, updatedAt: new Date() })
    .where(eq(analyzerDocumentTemplates.id, id))
    .returning();
  if (!row) return null;
  return {
    id: row.id,
    titleFa: row.titleFa,
    layoutKey: row.layoutKey,
    brandNameFa: row.brandNameFa,
    system: row.system,
    chrome: mergeChrome(row.id, row.chrome),
  };
}
