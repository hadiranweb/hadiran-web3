/** تعریف نسخه‌دار آزمون. منبع اجرا pack ذخیره‌شده است؛ کد فقط بذر اولیه است. */

export type AnalyzerPackStatus = "draft" | "open" | "archived";

export type ScaleAnchors = { 0: string; 5: string; 10: string };

export type RangeItem = {
  kind: "range";
  id: string;
  text: string;
  reverse: boolean;
  anchors: ScaleAnchors;
};

export type TextItem = { kind: "text"; id: string; text: string; maxLength: number };

export type ChoiceItem = {
  kind: "choice";
  id: string;
  text: string;
  options: { value: string; label: string }[];
};

export type Item = RangeItem | TextItem | ChoiceItem;

export type Section = { id: string; titleFa: string; introFa?: string; items: Item[] };

export type FindingKind = "group" | "dimension" | "layer" | "symptom";

export type Finding = {
  id: string;
  titleFa: string;
  kind: FindingKind;
  parentId?: string;
  constructFa?: string;
  asIsFa?: string;
  toBeFa?: string;
  actionsFa?: string;
};

export type Keyword = { id: string; labelFa: string; children?: string[] };

export type LayerBand = {
  id: string;
  labelFa: string;
  meaningFa: string;
  min: number;
  max: number;
  maxInclusive: boolean;
};

export type CrossPattern = {
  id: string;
  meaningFa: string;
  actionFa: string;
  when: { strong: string | null; weak: string | null; alsoWeak: string | null; weakAny: string[] };
};

export type ReportContextFieldDef = { id: string; labelFa: string };

export type PackReport = {
  hideGateScores?: boolean;
  interpretationVersion?: string;
  closingFa?: string;
  /** قالب یک‌پاراگرافی برای عضو. پارامترها داخل {آکولاد}. سند چندصفحه جداست. */
  userSummaryTemplateFa?: string;
  /** قالب HTML سند: hadiran | casio-research (و قالب‌های بعدی در جدول). */
  documentTemplateId?: string;
  businessNameItemId?: string;
  contextFields?: ReportContextFieldDef[];
  layerBands?: LayerBand[];
  crossPatterns?: CrossPattern[];
};

export type EdgeTransform = "identity" | "reverse";

export type Edge = {
  from: string;
  to: string;
  weight: number;
  transform: EdgeTransform;
};

export type FormulaOp =
  | "reverse"
  | "mean"
  | "sum"
  | "sum_div"
  | "weighted_sum"
  | "argmin"
  | "band"
  | "cap_if"
  | "matmul";

export type Band = {
  id: string;
  labelFa: string;
  gte?: number;
  lt?: number;
  lte?: number;
};

export type Formula = {
  id: string;
  op: FormulaOp;
  of?: string[];
  divisor?: number;
  weights?: { item: string; dimension?: string; weight: number }[];
  bands?: Band[];
  watch?: string[];
  capAt?: { lte: number; set: string }[];
  demote?: { lte: number; from: string; to: string }[];
};

export type Consent = {
  titleFa: string;
  bodyFa: string[];
  acceptLabelFa: string;
};

export type AnalyzerScale = {
  kind: "range-0-10";
  min: 0;
  max: 10;
};

export type AnalyzerPack = {
  slug: string;
  version: string;
  status: AnalyzerPackStatus;
  nameFa: string;
  summaryFa: string;
  scale: AnalyzerScale;
  consent: Consent;
  sections: Section[];
  findings: Finding[];
  keywords: Keyword[];
  edges: Edge[];
  formulas: Formula[];
  report?: PackReport;
};

export function itemsOf(pack: AnalyzerPack): Item[] {
  return pack.sections.flatMap((section) => section.items);
}

export function sectionOf(pack: AnalyzerPack, itemId: string): Section | undefined {
  return pack.sections.find((section) => section.items.some((item) => item.id === itemId));
}

export function findItem(pack: AnalyzerPack, id: string): Item | undefined {
  return itemsOf(pack).find((item) => item.id === id);
}

export function edgesFromScoredSections(sections: Section[]): Edge[] {
  const edges: Edge[] = [];
  for (const section of sections) {
    if (section.id === "business") continue;
    for (const item of section.items) {
      edges.push({
        from: item.id,
        to: section.id,
        weight: 1,
        transform: item.kind === "range" && item.reverse ? "reverse" : "identity",
      });
    }
  }
  return edges;
}

export function assertPack(pack: AnalyzerPack) {
  const ids = itemsOf(pack).map((item) => item.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`duplicate item ids in pack ${pack.slug}`);
  }
  const findingIds = new Set(pack.findings.map((finding) => finding.id));
  for (const finding of pack.findings) {
    if (finding.parentId && !findingIds.has(finding.parentId)) {
      throw new Error(`missing parent ${finding.parentId} in pack ${pack.slug}`);
    }
  }
}
