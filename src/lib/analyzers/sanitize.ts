/** Pack ورودی مالک: فیلدهای شناخته‌شده، بدون eval/تابع. */

import {
  assertPack,
  edgesFromScoredSections,
  itemsOf,
  type AnalyzerPack,
  type AnalyzerPackStatus,
  type Band,
  type ChoiceItem,
  type Consent,
  type Edge,
  type Finding,
  type Formula,
  type FormulaOp,
  type Item,
  type Keyword,
  type LayerBand,
  type PackReport,
  type RangeItem,
  type ScaleAnchors,
  type Section,
  type TextItem,
} from "@/lib/analyzers/pack";

/** فقط بخش‌های مسیر، نه شناسهٔ آزمون. casio-ss قابل تألیف است. */
export const RESERVED_SLUGS = new Set(["new", "report"]);

export const DEFAULT_ANCHORS: ScaleAnchors = {
  0: "اصلاً / هرگز",
  5: "گاهی / تا حدی",
  10: "کاملاً / همیشه",
};

const ID_RE = /^[A-Za-z][A-Za-z0-9._-]{0,63}$/;
const SLUG_RE = /^[a-z][a-z0-9-]{1,62}$/;
const OPS = new Set<FormulaOp>([
  "reverse",
  "mean",
  "sum",
  "sum_div",
  "weighted_sum",
  "argmin",
  "band",
  "cap_if",
  "matmul",
]);
const STATUSES = new Set<AnalyzerPackStatus>(["draft", "open", "archived"]);
const FINDING_KINDS = new Set(["group", "dimension", "layer", "symptom"]);
const ITEM_KINDS = new Set(["range", "text", "choice"]);

export type SanitizeOk = { ok: true; pack: AnalyzerPack };
export type SanitizeErr = { ok: false; error: string };
export type SanitizeResult = SanitizeOk | SanitizeErr;

export function isPackSlug(value: string): boolean {
  return SLUG_RE.test(value) && !RESERVED_SLUGS.has(value);
}

export function isNodeId(value: string): boolean {
  return ID_RE.test(value);
}

function asTrimmed(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  if (!text || text.length > max) return null;
  return text;
}

function asMultiline(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\r\n/g, "\n").replace(/[^\S\n]+/g, " ").trim();
  if (!text || text.length > max) return null;
  return text;
}

function asId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return isNodeId(id) ? id : null;
}

function asStringList(value: unknown, maxEach: number, maxCount: number): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const entry of value.slice(0, maxCount)) {
    const text = asTrimmed(entry, maxEach);
    if (text) out.push(text);
  }
  return out;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value;
}

function anchorsOf(raw: unknown): ScaleAnchors {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_ANCHORS;
  const row = raw as Record<string, unknown>;
  return {
    0: asTrimmed(row["0"], 240) ?? DEFAULT_ANCHORS[0],
    5: asTrimmed(row["5"], 240) ?? DEFAULT_ANCHORS[5],
    10: asTrimmed(row["10"], 240) ?? DEFAULT_ANCHORS[10],
  };
}

function sanitizeRange(raw: Record<string, unknown>, id: string): RangeItem | null {
  const text = asTrimmed(raw.text, 500);
  if (!text) return null;
  return {
    kind: "range",
    id,
    text,
    reverse: raw.reverse === true,
    anchors: anchorsOf(raw.anchors),
  };
}

function sanitizeText(raw: Record<string, unknown>, id: string): TextItem | null {
  const text = asTrimmed(raw.text, 500);
  if (!text) return null;
  const maxLength = Math.min(Math.max(Math.floor(asNumber(raw.maxLength) ?? 128), 8), 500);
  return { kind: "text", id, text, maxLength };
}

function sanitizeChoice(raw: Record<string, unknown>, id: string): ChoiceItem | null {
  const text = asTrimmed(raw.text, 500);
  if (!text) return null;
  const optionsRaw = Array.isArray(raw.options) ? raw.options : [];
  const options: { value: string; label: string }[] = [];
  for (const option of optionsRaw.slice(0, 20)) {
    if (!option || typeof option !== "object" || Array.isArray(option)) continue;
    const row = option as Record<string, unknown>;
    const value = asId(row.value) ?? asTrimmed(row.value, 64);
    const label = asTrimmed(row.label, 120);
    if (!value || !label) continue;
    if (options.some((entry) => entry.value === value)) continue;
    options.push({ value, label });
  }
  if (options.length < 2) return null;
  return { kind: "choice", id, text, options };
}

function sanitizeItem(raw: unknown, used: Set<string>): Item | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const id = asId(row.id);
  if (!id || used.has(id)) return null;
  const kind = typeof row.kind === "string" && ITEM_KINDS.has(row.kind) ? row.kind : null;
  if (!kind) return null;
  let item: Item | null = null;
  if (kind === "range") item = sanitizeRange(row, id);
  else if (kind === "text") item = sanitizeText(row, id);
  else item = sanitizeChoice(row, id);
  if (!item) return null;
  used.add(id);
  return item;
}

function sanitizeSection(raw: unknown, usedItems: Set<string>, usedSections: Set<string>): Section | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const id = asId(row.id);
  const titleFa = asTrimmed(row.titleFa, 120);
  if (!id || !titleFa || usedSections.has(id)) return null;
  usedSections.add(id);
  const itemsRaw = Array.isArray(row.items) ? row.items : [];
  const items: Item[] = [];
  for (const entry of itemsRaw.slice(0, 80)) {
    const item = sanitizeItem(entry, usedItems);
    if (item) items.push(item);
  }
  const introFa = asTrimmed(row.introFa, 500) ?? undefined;
  return introFa ? { id, titleFa, introFa, items } : { id, titleFa, items };
}

function sanitizeFinding(raw: unknown, used: Set<string>): Finding | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const id = asId(row.id);
  const titleFa = asTrimmed(row.titleFa, 120);
  const kind = typeof row.kind === "string" && FINDING_KINDS.has(row.kind) ? row.kind : null;
  if (!id || !titleFa || !kind || used.has(id)) return null;
  used.add(id);
  const finding: Finding = { id, titleFa, kind: kind as Finding["kind"] };
  const parentId = asId(row.parentId) ?? undefined;
  if (parentId) finding.parentId = parentId;
  const constructFa = asTrimmed(row.constructFa, 400);
  const asIsFa = asTrimmed(row.asIsFa, 400);
  const toBeFa = asTrimmed(row.toBeFa, 400);
  const actionsFa = asTrimmed(row.actionsFa, 400);
  if (constructFa) finding.constructFa = constructFa;
  if (asIsFa) finding.asIsFa = asIsFa;
  if (toBeFa) finding.toBeFa = toBeFa;
  if (actionsFa) finding.actionsFa = actionsFa;
  return finding;
}

function sanitizeKeyword(raw: unknown, used: Set<string>): Keyword | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const id = asId(row.id);
  const labelFa = asTrimmed(row.labelFa, 160);
  if (!id || !labelFa || used.has(id)) return null;
  used.add(id);
  const children = asStringList(row.children, 160, 12);
  return children.length ? { id, labelFa, children } : { id, labelFa };
}

function sanitizeLayerBand(raw: unknown): LayerBand | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const id = asId(row.id);
  const labelFa = asTrimmed(row.labelFa, 80);
  if (!id || !labelFa) return null;
  const min = asNumber(row.min);
  const max = asNumber(row.max);
  if (min == null || max == null) return null;
  return {
    id,
    labelFa,
    meaningFa: asTrimmed(row.meaningFa, 400) ?? "",
    min,
    max,
    maxInclusive: row.maxInclusive === true,
  };
}

function sanitizeReport(raw: unknown): PackReport | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const row = raw as Record<string, unknown>;
  const report: PackReport = {};
  if (row.hideGateScores === true) report.hideGateScores = true;
  if (row.hideGateScores === false) report.hideGateScores = false;
  const interpretationVersion = asTrimmed(row.interpretationVersion, 64);
  if (interpretationVersion) report.interpretationVersion = interpretationVersion;
  const closingFa = asTrimmed(row.closingFa, 400);
  if (closingFa) report.closingFa = closingFa;
  const userSummaryTemplateFa = asMultiline(row.userSummaryTemplateFa, 2000);
  if (userSummaryTemplateFa) report.userSummaryTemplateFa = userSummaryTemplateFa;
  const businessNameItemId = asId(row.businessNameItemId);
  if (businessNameItemId) report.businessNameItemId = businessNameItemId;
  if (Array.isArray(row.contextFields)) {
    const contextFields: NonNullable<PackReport["contextFields"]> = [];
    for (const entry of row.contextFields.slice(0, 12)) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const field = entry as Record<string, unknown>;
      const id = asId(field.id);
      const labelFa = asTrimmed(field.labelFa, 80);
      if (!id || !labelFa) continue;
      contextFields.push({ id, labelFa });
    }
    if (contextFields.length) report.contextFields = contextFields;
  }
  if (Array.isArray(row.layerBands)) {
    const layerBands = row.layerBands.map(sanitizeLayerBand).filter((entry): entry is LayerBand => Boolean(entry)).slice(0, 8);
    if (layerBands.length) report.layerBands = layerBands;
  }
  if (Array.isArray(row.crossPatterns)) {
    const crossPatterns: NonNullable<PackReport["crossPatterns"]> = [];
    for (const entry of row.crossPatterns.slice(0, 12)) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const p = entry as Record<string, unknown>;
      const id = asId(p.id);
      const meaningFa = asTrimmed(p.meaningFa, 400);
      const actionFa = asTrimmed(p.actionFa, 400);
      if (!id || !meaningFa) continue;
      const whenRaw = p.when && typeof p.when === "object" && !Array.isArray(p.when) ? (p.when as Record<string, unknown>) : {};
      const weakAny = Array.isArray(whenRaw.weakAny)
        ? whenRaw.weakAny.map((item) => asId(item)).filter((item): item is string => Boolean(item))
        : [];
      crossPatterns.push({
        id,
        meaningFa,
        actionFa: actionFa ?? "",
        when: {
          strong: asId(whenRaw.strong),
          weak: asId(whenRaw.weak),
          alsoWeak: asId(whenRaw.alsoWeak),
          weakAny,
        },
      });
    }
    if (crossPatterns.length) report.crossPatterns = crossPatterns;
  }
  return Object.keys(report).length ? report : undefined;
}

function sanitizeEdge(raw: unknown): Edge | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const from = asId(row.from);
  const to = asId(row.to);
  if (!from || !to || from === to) return null;
  const weight = asNumber(row.weight) ?? 1;
  if (weight <= 0 || weight > 100) return null;
  const transform = row.transform === "reverse" ? "reverse" : "identity";
  return { from, to, weight, transform };
}

function sanitizeBand(raw: unknown): Band | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const id = asId(row.id);
  const labelFa = asTrimmed(row.labelFa, 80);
  if (!id || !labelFa) return null;
  const band: Band = { id, labelFa };
  const gte = asNumber(row.gte);
  const lt = asNumber(row.lt);
  const lte = asNumber(row.lte);
  if (gte != null) band.gte = gte;
  if (lt != null) band.lt = lt;
  if (lte != null) band.lte = lte;
  return band;
}

function sanitizeFormula(raw: unknown, used: Set<string>): Formula | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const id = asId(row.id);
  const op = typeof row.op === "string" && OPS.has(row.op as FormulaOp) ? (row.op as FormulaOp) : null;
  if (!id || !op || used.has(id)) return null;
  used.add(id);
  const formula: Formula = { id, op };
  const of = Array.isArray(row.of)
    ? row.of.map((entry) => asId(entry)).filter((entry): entry is string => Boolean(entry)).slice(0, 40)
    : [];
  if (of.length) formula.of = of;
  const divisor = asNumber(row.divisor);
  if (divisor != null && divisor !== 0) formula.divisor = divisor;
  if (Array.isArray(row.weights)) {
    const weights: NonNullable<Formula["weights"]> = [];
    for (const entry of row.weights.slice(0, 80)) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const w = entry as Record<string, unknown>;
      const item = asId(w.item);
      const weight = asNumber(w.weight);
      if (!item || weight == null) continue;
      const dimension = asId(w.dimension) ?? undefined;
      weights.push(dimension ? { item, dimension, weight } : { item, weight });
    }
    if (weights.length) formula.weights = weights;
  }
  if (Array.isArray(row.bands)) {
    const bands = row.bands.map(sanitizeBand).filter((entry): entry is Band => Boolean(entry)).slice(0, 12);
    if (bands.length) formula.bands = bands;
  }
  const watch = Array.isArray(row.watch)
    ? row.watch.map((entry) => asId(entry)).filter((entry): entry is string => Boolean(entry)).slice(0, 40)
    : [];
  if (watch.length) formula.watch = watch;
  if (Array.isArray(row.capAt)) {
    const capAt: NonNullable<Formula["capAt"]> = [];
    for (const entry of row.capAt.slice(0, 8)) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const c = entry as Record<string, unknown>;
      const lte = asNumber(c.lte);
      const set = asId(c.set);
      if (lte == null || !set) continue;
      capAt.push({ lte, set });
    }
    if (capAt.length) formula.capAt = capAt;
  }
  if (Array.isArray(row.demote)) {
    const demote: NonNullable<Formula["demote"]> = [];
    for (const entry of row.demote.slice(0, 8)) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const d = entry as Record<string, unknown>;
      const lte = asNumber(d.lte);
      const from = asId(d.from);
      const to = asId(d.to);
      if (lte == null || !from || !to) continue;
      demote.push({ lte, from, to });
    }
    if (demote.length) formula.demote = demote;
  }
  return formula;
}

function sanitizeConsent(raw: unknown): Consent {
  const fallback: Consent = {
    titleFa: "قبل از شروع",
    bodyFa: [
      "این ارزیابی چند سؤال ساده است. پاسخ‌ها ذخیره می‌شود تا بتوانید گزارش را بعداً ببینید.",
      "نتیجه راهنمای کلی است، نه حکم قطعی.",
      "شرکت اختیاری است.",
    ],
    acceptLabelFa: "خواندم و موافقم",
  };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;
  const row = raw as Record<string, unknown>;
  return {
    titleFa: asTrimmed(row.titleFa, 120) ?? fallback.titleFa,
    bodyFa: asStringList(row.bodyFa, 600, 8).length ? asStringList(row.bodyFa, 600, 8) : fallback.bodyFa,
    acceptLabelFa: asTrimmed(row.acceptLabelFa, 80) ?? fallback.acceptLabelFa,
  };
}

export function blankPack(slug: string, nameFa: string): AnalyzerPack {
  return {
    slug,
    version: "0.1.0",
    status: "draft",
    nameFa,
    summaryFa: "",
    scale: { kind: "range-0-10", min: 0, max: 10 },
    consent: sanitizeConsent(null),
    sections: [{ id: "section-1", titleFa: "بخش ۱", items: [] }],
    findings: [],
    keywords: [],
    edges: [],
    formulas: [],
  };
}

export function sanitizePack(raw: unknown, slug: string): SanitizeResult {
  if (!isPackSlug(slug)) return { ok: false, error: "شناسهٔ لاتین آزمون نامعتبر است." };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "بستهٔ آزمون نامعتبر است." };
  }
  const row = raw as Record<string, unknown>;
  const nameFa = asTrimmed(row.nameFa, 120);
  if (!nameFa) return { ok: false, error: "نام فارسی لازم است." };
  const version = asTrimmed(row.version, 32) ?? "0.1.0";
  const status = typeof row.status === "string" && STATUSES.has(row.status as AnalyzerPackStatus)
    ? (row.status as AnalyzerPackStatus)
    : "draft";
  const summaryFa = asTrimmed(row.summaryFa, 800) ?? "";

  const usedItems = new Set<string>();
  const usedSections = new Set<string>();
  const sections: Section[] = [];
  const sectionsRaw = Array.isArray(row.sections) ? row.sections : [];
  for (const entry of sectionsRaw.slice(0, 30)) {
    const section = sanitizeSection(entry, usedItems, usedSections);
    if (section) sections.push(section);
  }
  if (!sections.length) return { ok: false, error: "حداقل یک بخش لازم است." };

  const usedFindings = new Set<string>();
  const findings: Finding[] = [];
  const findingsRaw = Array.isArray(row.findings) ? row.findings : [];
  for (const entry of findingsRaw.slice(0, 40)) {
    const finding = sanitizeFinding(entry, usedFindings);
    if (finding) findings.push(finding);
  }

  const usedKeywords = new Set<string>();
  const keywords: Keyword[] = [];
  const keywordsRaw = Array.isArray(row.keywords) ? row.keywords : [];
  for (const entry of keywordsRaw.slice(0, 40)) {
    const keyword = sanitizeKeyword(entry, usedKeywords);
    if (keyword) keywords.push(keyword);
  }

  const usedFormulas = new Set<string>();
  const formulas: Formula[] = [];
  const formulasRaw = Array.isArray(row.formulas) ? row.formulas : [];
  for (const entry of formulasRaw.slice(0, 40)) {
    const formula = sanitizeFormula(entry, usedFormulas);
    if (formula) formulas.push(formula);
  }

  const known = new Set<string>([
    ...usedItems,
    ...usedSections,
    ...usedFindings,
    ...usedKeywords,
    ...usedFormulas,
  ]);
  const extraEdges: Edge[] = [];
  const edgesRaw = Array.isArray(row.edges) ? row.edges : [];
  for (const entry of edgesRaw.slice(0, 200)) {
    const edge = sanitizeEdge(entry);
    if (!edge) continue;
    if (!known.has(edge.from) || !known.has(edge.to)) continue;
    extraEdges.push(edge);
  }

  const auto = edgesFromScoredSections(sections);
  const seen = new Set(auto.map((edge) => `${edge.from}>${edge.to}`));
  const edges = [...auto];
  for (const edge of extraEdges) {
    const key = `${edge.from}>${edge.to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push(edge);
  }

  const pack: AnalyzerPack = {
    slug,
    version,
    status,
    nameFa,
    summaryFa,
    scale: { kind: "range-0-10", min: 0, max: 10 },
    consent: sanitizeConsent(row.consent),
    sections,
    findings,
    keywords,
    edges,
    formulas,
    report: sanitizeReport(row.report),
  };

  try {
    assertPack(pack);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "بسته ناقص است." };
  }

  if (status === "open" && itemsOf(pack).length === 0) {
    return { ok: false, error: "برای باز کردن آزمون حداقل یک سؤال لازم است." };
  }

  return { ok: true, pack };
}
