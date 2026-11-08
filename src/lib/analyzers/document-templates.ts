import type { AnalyzerPack } from "@/lib/analyzers/pack";

/** Layouts are presentation choices, never separate assessment runtimes. */
export const SYSTEM_DOCUMENT_TEMPLATES = [
  { id: "hadiran", titleFa: "هادیران", layoutKey: "hadiran", brandNameFa: "هادیران", requiresLayers: false },
  { id: "casio-ss", titleFa: "کاسیو · ماتریسی", layoutKey: "casio", brandNameFa: "کاسیو", requiresLayers: true },
  { id: "casio-research", titleFa: "کاسیو · پژوهش", layoutKey: "casio-research", brandNameFa: "کاسیو", requiresLayers: true },
  { id: "system-diagnosis", titleFa: "عارضه‌یابی سیستم کسب‌وکار", layoutKey: "hadiran", brandNameFa: "هادیران", requiresLayers: true },
] as const;

export type DocumentTemplateId = (typeof SYSTEM_DOCUMENT_TEMPLATES)[number]["id"];
export type SystemDocumentTemplate = (typeof SYSTEM_DOCUMENT_TEMPLATES)[number];

/** Keep both historical IDs distinct: a research layout is not the matrix layout. */
export function canonicalizeTemplateId(value: string): string {
  return value;
}

export function isDocumentTemplateId(value: string): value is DocumentTemplateId {
  return SYSTEM_DOCUMENT_TEMPLATES.some((row) => row.id === value);
}

export function documentTemplateDefinition(value: string): SystemDocumentTemplate | undefined {
  return SYSTEM_DOCUMENT_TEMPLATES.find((row) => row.id === canonicalizeTemplateId(value));
}

export function documentLayoutKey(templateId: string): SystemDocumentTemplate["layoutKey"] {
  return documentTemplateDefinition(templateId)?.layoutKey ?? "hadiran";
}

export function packHasLayers(pack: AnalyzerPack): boolean {
  return pack.findings.some((finding) => finding.kind === "layer");
}

export function templatesForPack(pack: AnalyzerPack) {
  const layered = packHasLayers(pack);
  return SYSTEM_DOCUMENT_TEMPLATES.filter((template) => {
    if (template.id === "system-diagnosis") return pack.slug === "system-diagnosis";
    return !template.requiresLayers || layered;
  });
}

export function templateAllowedForPack(pack: AnalyzerPack, templateId: string): boolean {
  return templatesForPack(pack).some((template) => template.id === canonicalizeTemplateId(templateId));
}

export function resolveDocumentTemplateId(pack: AnalyzerPack, override?: string | null): DocumentTemplateId {
  const allowed = templatesForPack(pack);
  const pick = (value: string | null | undefined): DocumentTemplateId | null => {
    if (!value) return null;
    const id = canonicalizeTemplateId(value);
    return isDocumentTemplateId(id) && allowed.some((template) => template.id === id) ? id : null;
  };
  return pick(override) ?? pick(pack.report?.documentTemplateId) ?? allowed[0]?.id ?? "hadiran";
}

/** Every template uses the shared analyzer_attempts/report path, including Casio designs. */
export function attemptKindOf(_slug: string): "analyzer" {
  return "analyzer";
}

export function documentHref(id: number) {
  return `/workspace/documents/${id}`;
}

export function templateTitleFa(id: string) {
  return documentTemplateDefinition(id)?.titleFa ?? id;
}

export type DocumentListItem = {
  id: number;
  slug: string;
  packNameFa: string;
  attemptId: number;
  templateId: string;
  templateTitleFa: string;
  personNameFa: string;
  businessNameFa: string | null;
  createdAt: string;
  submittedAt: string | null;
};
