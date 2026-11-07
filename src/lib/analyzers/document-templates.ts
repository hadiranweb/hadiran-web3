import type { AnalyzerPack } from "@/lib/analyzers/pack";

export const SYSTEM_DOCUMENT_TEMPLATES = [
  { id: "hadiran", titleFa: "هادیران", layoutKey: "hadiran" },
  { id: "system-diagnosis", titleFa: "عارضه‌یابی سیستم کسب‌وکار", layoutKey: "hadiran" },
] as const;

export type DocumentTemplateId = (typeof SYSTEM_DOCUMENT_TEMPLATES)[number]["id"];

export function canonicalizeTemplateId(value: string): string {
  return value;
}

export function documentLayoutKey(_templateId: string): "hadiran" {
  return "hadiran";
}

export function isDocumentTemplateId(value: string): value is DocumentTemplateId {
  return SYSTEM_DOCUMENT_TEMPLATES.some((row) => row.id === value);
}

export function packHasLayers(pack: AnalyzerPack): boolean {
  return pack.findings.some((finding) => finding.kind === "layer");
}

export function templatesForPack(pack: AnalyzerPack) {
  return SYSTEM_DOCUMENT_TEMPLATES.filter((template) => {
    if (template.id === "hadiran") return true;
    if (template.id === "system-diagnosis") return pack.slug === "system-diagnosis";
    return false;
  });
}

export function templateAllowedForPack(pack: AnalyzerPack, templateId: string): boolean {
  return templatesForPack(pack).some((template) => template.id === templateId);
}

export function resolveDocumentTemplateId(pack: AnalyzerPack, override?: string | null): DocumentTemplateId {
  const allowed = templatesForPack(pack);
  const pick = (value: string | null | undefined): DocumentTemplateId | null => {
    if (!value) return null;
    return isDocumentTemplateId(value) && allowed.some((template) => template.id === value) ? value : null;
  };
  return pick(override) ?? pick(pack.report?.documentTemplateId) ?? allowed[0]?.id ?? "hadiran";
}

/** تمام packهای اجراشده از مسیر analyzer_attempts استفاده می‌کنند. */
export function attemptKindOf(_slug: string): "analyzer" {
  return "analyzer";
}

export function documentHref(id: number) {
  return `/workspace/documents/${id}`;
}

export function templateTitleFa(id: string) {
  return SYSTEM_DOCUMENT_TEMPLATES.find((template) => template.id === id)?.titleFa ?? id;
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
