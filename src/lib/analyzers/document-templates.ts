import type { AnalyzerPack } from "@/lib/analyzers/pack";

export const SYSTEM_DOCUMENT_TEMPLATES = [
  { id: "hadiran", titleFa: "هادیران", layoutKey: "hadiran" },
  { id: "casio-ss", titleFa: "کاسیو · پنج‌لایه", layoutKey: "casio-ss" },
] as const;

export type DocumentTemplateId = (typeof SYSTEM_DOCUMENT_TEMPLATES)[number]["id"];

const LEGACY_TEMPLATE_IDS: Record<string, DocumentTemplateId> = {
  "casio-research": "casio-ss",
};

export function canonicalizeTemplateId(value: string): string {
  return LEGACY_TEMPLATE_IDS[value] ?? value;
}

export function documentLayoutKey(templateId: string): "hadiran" | "casio-ss" {
  return canonicalizeTemplateId(templateId) === "casio-ss" ? "casio-ss" : "hadiran";
}

export function isDocumentTemplateId(value: string): value is DocumentTemplateId {
  const id = canonicalizeTemplateId(value);
  return SYSTEM_DOCUMENT_TEMPLATES.some((row) => row.id === id);
}

export function packHasLayers(pack: AnalyzerPack): boolean {
  return pack.findings.some((finding) => finding.kind === "layer");
}

export function templatesForPack(pack: AnalyzerPack) {
  const layered = packHasLayers(pack) || pack.slug === "casio-ss";
  return SYSTEM_DOCUMENT_TEMPLATES.filter((template) => {
    if (template.id === "hadiran") return true;
    if (template.id === "casio-ss") return layered;
    return false;
  });
}

export function templateAllowedForPack(pack: AnalyzerPack, templateId: string): boolean {
  const id = canonicalizeTemplateId(templateId);
  return templatesForPack(pack).some((template) => template.id === id);
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

export function attemptKindOf(slug: string): "casio" | "analyzer" {
  return slug === "casio-ss" ? "casio" : "analyzer";
}

export function documentHref(id: number) {
  return `/workspace/documents/${id}`;
}

export function templateTitleFa(id: string) {
  const canonical = canonicalizeTemplateId(id);
  return SYSTEM_DOCUMENT_TEMPLATES.find((template) => template.id === canonical)?.titleFa ?? id;
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
