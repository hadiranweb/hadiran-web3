import { readFileSync } from "node:fs";
import { join } from "node:path";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { analyzerDocumentTemplates, analyzerDocumentTemplateOverrides } from "@/db/schema";
import { CASIO_TEMPLATE_CSS, CASIO_TEMPLATE_HTML, HADIRAN_TEMPLATE_CSS, HADIRAN_TEMPLATE_HTML, } from "@/lib/analyzers/document-defaults";
import { parseChrome, type DocumentChrome, } from "@/lib/analyzers/document-chrome";
import { canonicalizeTemplateId } from "@/lib/analyzers/document-templates";
import { ensureInterpretationDocumentsSchema } from "@/lib/auth/schema-guard";
function readPublicSvg(rel: string): string {
    try {
        return readFileSync(join(process.cwd(), "public", rel), "utf8").replace(/<\?xml[^?]*\?>\s*/i, "");
    }
    catch {
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
export function mergeChrome(templateId: string, raw: unknown): DocumentChrome {
    const fallback = defaultChrome(templateId);
    const parsed = parseChrome(raw);
    return {
        html: parsed.html.trim() ? parsed.html : fallback.html,
        css: parsed.css.trim() ? parsed.css : fallback.css,
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
export async function listDocumentTemplates(accountId: number): Promise<StoredDocumentTemplate[]> {
    await ensureInterpretationDocumentsSchema();
    const rows = await db.select().from(analyzerDocumentTemplates).orderBy(asc(analyzerDocumentTemplates.id));
    const overrides = await db.select().from(analyzerDocumentTemplateOverrides).where(eq(analyzerDocumentTemplateOverrides.accountId, accountId));
    return rows
        .filter((row) => row.id === "hadiran" || row.id === "casio-ss")
        .map((row) => ({
        id: row.id,
        titleFa: row.titleFa,
        layoutKey: row.layoutKey,
        brandNameFa: row.brandNameFa,
        system: row.system,
        chrome: mergeChrome(row.id, overrides.find(value => value.templateId === row.id)?.chrome ?? row.chrome),
    }));
}
export async function readDocumentChrome(templateId: string, accountId?: number): Promise<DocumentChrome> {
    await ensureInterpretationDocumentsSchema();
    const id = canonicalizeTemplateId(templateId);
    if (accountId !== undefined) {
        const [own] = await db.select().from(analyzerDocumentTemplateOverrides).where(and(eq(analyzerDocumentTemplateOverrides.accountId, accountId), eq(analyzerDocumentTemplateOverrides.templateId, id))).limit(1);
        if (own)
            return mergeChrome(id, own.chrome);
    }
    const [row] = await db
        .select()
        .from(analyzerDocumentTemplates)
        .where(eq(analyzerDocumentTemplates.id, id))
        .limit(1);
    if (row)
        return mergeChrome(row.id, row.chrome);
    const [legacy] = await db
        .select()
        .from(analyzerDocumentTemplates)
        .where(eq(analyzerDocumentTemplates.id, templateId))
        .limit(1);
    return mergeChrome(templateId, legacy?.chrome);
}
export async function updateDocumentTemplateChrome(id: string, chrome: DocumentChrome, accountId: number): Promise<StoredDocumentTemplate | null> {
    await ensureInterpretationDocumentsSchema();
    const allowed = id === "hadiran" || id === "casio-ss";
    if (!allowed)
        return null;
    const next: DocumentChrome = {
        html: chrome.html.slice(0, 200000),
        css: chrome.css.slice(0, 80000),
        logos: {
            light: chrome.logos.light.slice(0, 40000),
            dark: chrome.logos.dark.slice(0, 40000),
            seal: chrome.logos.seal.slice(0, 40000),
        },
        pageSize: chrome.pageSize,
        pageMargin: chrome.pageMargin.slice(0, 32),
    };
    await db.insert(analyzerDocumentTemplateOverrides).values({ accountId, templateId: id, chrome: next }).onConflictDoUpdate({ target: [analyzerDocumentTemplateOverrides.accountId, analyzerDocumentTemplateOverrides.templateId], set: { chrome: next, updatedAt: new Date() } });
    const [row] = await db.select().from(analyzerDocumentTemplates).where(eq(analyzerDocumentTemplates.id, id)).limit(1);
    if (!row)
        return null;
    return {
        id: row.id,
        titleFa: row.titleFa,
        layoutKey: row.layoutKey,
        brandNameFa: row.brandNameFa,
        system: row.system,
        chrome: mergeChrome(row.id, next),
    };
}
