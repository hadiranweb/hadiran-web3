/**
 * Graph integrity gate.
 *
 * A published instrument must be structurally sound before respondents are scored by it.
 * These checks run on the seed, on every draft save from the workspace editor, and again
 * before a revision can be published — so a half-edited weight vector never reaches a user.
 */

import type { GraphManifest, IntegrityIssue, SsotDomainCode } from "./types";

const LAYER_COUNT = 5;

function push(issues: IntegrityIssue[], level: IntegrityIssue["level"], code: string, entity: string, messageFa: string) {
  issues.push({ level, code, entity, messageFa });
}

export function validateGraphManifest(manifest: GraphManifest): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const itemCodes = new Set<string>();
  const keywordCodes = new Set<string>();
  const subKeywordCodes = new Set<string>();
  const layerCodes = new Set<string>();

  for (const item of manifest.items) {
    if (itemCodes.has(item.canonicalCode)) {
      push(issues, "error", "duplicate_item", item.canonicalCode, "کد استاندارد گویه تکراری است.");
    }
    itemCodes.add(item.canonicalCode);
    if (item.kind === "range" && item.scaleMax <= item.scaleMin) {
      push(issues, "error", "bad_scale", item.canonicalCode, "بازهٔ نمره‌دهی نامعتبر است.");
    }
    if (item.kind === "choice" && (!item.options || item.options.length < 2)) {
      push(issues, "error", "choice_options", item.canonicalCode, "گویهٔ انتخابی حداقل دو گزینه نیاز دارد.");
    }
  }

  for (const keyword of manifest.keywords) {
    if (keywordCodes.has(keyword.canonicalCode)) {
      push(issues, "error", "duplicate_keyword", keyword.canonicalCode, "کلیدواژهٔ تکراری است.");
    }
    keywordCodes.add(keyword.canonicalCode);
  }

  for (const sub of manifest.subKeywords) {
    if (subKeywordCodes.has(sub.canonicalCode)) {
      push(issues, "error", "duplicate_sub_keyword", sub.canonicalCode, "زیرکلیدواژهٔ تکراری است.");
    }
    subKeywordCodes.add(sub.canonicalCode);
    if (!keywordCodes.has(sub.keywordCode)) {
      push(issues, "error", "orphan_sub_keyword", sub.canonicalCode, "زیرکلیدواژه به کلیدواژهٔ والد متصل نیست.");
    }
  }

  for (const layer of manifest.layers) {
    layerCodes.add(layer.canonicalCode);
  }

  // Every edge must resolve on both ends, or the score silently drops a contribution.
  for (const edge of manifest.edges) {
    const sourceOk =
      edge.sourceKind === "ITM"
        ? itemCodes.has(edge.sourceCode)
        : edge.sourceKind === "DIM"
          ? true
          : keywordCodes.has(edge.sourceCode) || subKeywordCodes.has(edge.sourceCode);
    const targetOk =
      edge.targetKind === "ITM"
        ? itemCodes.has(edge.targetCode)
        : edge.targetKind === "LAYER"
          ? layerCodes.has(edge.targetCode)
          : keywordCodes.has(edge.targetCode) || subKeywordCodes.has(edge.targetCode);
    if (!sourceOk) {
      push(issues, "error", "dangling_source", `${edge.edgeKind}:${edge.sourceCode}`, "منبع یال در گراف وجود ندارد.");
    }
    if (!targetOk) {
      push(issues, "error", "dangling_target", `${edge.edgeKind}:${edge.targetCode}`, "مقصد یال در گراف وجود ندارد.");
    }
  }

  // Causal edges must not point at a keyword that the instrument does not measure.
  for (const causal of manifest.causalEdges) {
    if (!keywordCodes.has(causal.fromCode) || !keywordCodes.has(causal.toCode)) {
      push(issues, "error", "dangling_causal", causal.edgeKey, "یال علّی به کلیدواژه‌ای متصل نیست که در گراف هست.");
    }
    if (causal.weight <= 0 || causal.weight > 1) {
      push(issues, "error", "causal_weight", causal.edgeKey, "شدت یال علّی باید در بازهٔ ۰ تا ۱ باشد.");
    }
  }

  // Structural coverage: an item that loads on nothing contributes to no keyword.
  const loadedItems = new Set(
    manifest.edges.filter((edge) => edge.edgeKind === "item_keyword").map((edge) => edge.sourceCode),
  );
  for (const item of manifest.items) {
    if (item.tier === "FL" && !loadedItems.has(item.canonicalCode)) {
      push(issues, "error", "unloaded_item", item.canonicalCode, "این گویه بر هیچ کلیدواژه‌ای بار نمی‌گذارد و در نمرهٔ کلیدواژه بی‌اثر است.");
    }
    if ((item.tier === "SCR" || item.tier === "DIAG") && !loadedItems.has(item.canonicalCode)) {
      push(issues, "warning", "unlinked_bank_item", item.canonicalCode, "گویهٔ بانک به کلیدواژه‌ای متصل نیست؛ مسیریابی آن انجام نمی‌شود.");
    }
  }

  // A keyword with no incoming loading cannot be scored at all.
  const scoredKeywords = new Set(
    manifest.edges.filter((edge) => edge.edgeKind === "item_keyword").map((edge) => edge.targetCode),
  );
  for (const keyword of manifest.keywords) {
    if (!scoredKeywords.has(keyword.canonicalCode)) {
      push(issues, "error", "unmeasured_keyword", keyword.canonicalCode, "این کلیدواژه هیچ یال اندازه‌گیری ورودی ندارد.");
    }
  }

  const sourceCodes = new Set(manifest.sources.map((source) => source.canonicalCode));
  const conceptKeys = new Set(manifest.concepts.map((concept) => concept.legacyId));

  // Ontology assertions reference the same code space; a dangling one silently drops the cell.
  const ontologySeen = new Set<string>();
  for (const entry of manifest.keywordOntology) {
    if (ontologySeen.has(entry.keywordCode)) {
      push(issues, "error", "duplicate_ontology", entry.keywordCode, "برای این کلیدواژه دو رکورد هستی‌شناسی وجود دارد.");
    }
    ontologySeen.add(entry.keywordCode);
    if (!keywordCodes.has(entry.keywordCode)) {
      push(issues, "error", "orphan_ontology", entry.keywordCode, "رکورد هستی‌شناسی به کلیدواژه‌ای متصل نیست که در گراف هست.");
    }
    for (const code of entry.sourceCodes) {
      if (!sourceCodes.has(code)) {
        push(issues, "error", "undeclared_source", `${entry.keywordCode} → ${code}`, "منبع ارجاع‌داده‌شده در رجیستری منابع تعریف نشده است.");
      }
    }
  }
  // Concept refs are authored as labels; one that matches no concept silently loses its cell.
  for (const keyword of manifest.keywords) {
    for (const ref of keyword.vaultRefs) {
      if (!conceptKeys.has(ref)) {
        push(issues, "warning", "unresolved_concept", `${keyword.canonicalCode} → ${ref}`, "این ارجاع مفهومی به گرهٔ شناخته‌شده‌ای در گراف پژوهش نمی‌رسد.");
      }
    }
  }
  for (const entry of manifest.keywordOntology) {
    for (const ref of entry.vaultRefs) {
      if (!conceptKeys.has(ref)) {
        push(issues, "warning", "unresolved_concept", `${entry.keywordCode} → ${ref}`, "این ارجاع مفهومیِ هستی‌شناسی به گرهٔ شناخته‌شده‌ای نمی‌رسد.");
      }
    }
  }

  for (const keyword of manifest.keywords) {
    if (keyword.domainCode === "DOM.CASIO_SS" && !ontologySeen.has(keyword.canonicalCode)) {
      push(issues, "warning", "missing_ontology", keyword.canonicalCode, "این کلیدواژه رکورد هستی‌شناسی ندارد؛ خانهٔ Rummler آن در تشخیص خالی می‌ماند.");
    }
  }

  // Each keyword must sit under exactly one layer, and each layer must be reachable.
  const layersWithKeywords = new Set(manifest.keywords.map((keyword) => keyword.layerCode));
  for (const layer of manifest.layers) {
    if (!layersWithKeywords.has(layer.canonicalCode)) {
      push(issues, "warning", "empty_layer", layer.canonicalCode, "این لایه هیچ کلیدواژه‌ای ندارد.");
    }
  }
  const casioLayers = manifest.layers.filter((layer) => layer.domainCode === "DOM.CASIO_SS").length;
  if (casioLayers && casioLayers !== LAYER_COUNT) {
    push(issues, "error", "layer_count", "DOM.CASIO_SS", `ساختار پنج‌لایه انتظار ${LAYER_COUNT} لایه دارد.`);
  }

  // Declared research sources: the whole point of the SSOT is that nothing cites a ghost.
  for (const keyword of manifest.keywords) {
    for (const code of keyword.sourceCodes) {
      if (!sourceCodes.has(code)) {
        push(issues, "error", "undeclared_source", `${keyword.canonicalCode} → ${code}`, "منبع ارجاع‌داده‌شده در رجیستری منابع تعریف نشده است.");
      }
    }
  }
  for (const causal of manifest.causalEdges) {
    for (const code of causal.sourceCodes) {
      if (!sourceCodes.has(code)) {
        push(issues, "error", "undeclared_source", `${causal.edgeKey} → ${code}`, "منبع یال علّی در رجیستری منابع تعریف نشده است.");
      }
    }
  }

  return issues;
}

export function errorsOnly(issues: IntegrityIssue[]): IntegrityIssue[] {
  return issues.filter((issue) => issue.level === "error");
}

export function canPublish(issues: IntegrityIssue[]): boolean {
  return errorsOnly(issues).length === 0;
}

/** Weight vectors that do not sum to a sane total are almost always a copy-paste error. */
export function warnOnUnbalancedWeights(manifest: GraphManifest, domainCode: SsotDomainCode): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const byTarget = new Map<string, number>();
  for (const edge of manifest.edges) {
    if (edge.edgeKind !== "item_keyword" || edge.domainCode !== domainCode) continue;
    if (!edge.sourceCode.startsWith("ITM.FL.")) continue;
    byTarget.set(edge.targetCode, (byTarget.get(edge.targetCode) ?? 0) + edge.weight);
  }
  for (const [keywordCode, total] of byTarget) {
    if (total <= 0) {
      push(issues, "error", "zero_mass", keywordCode, "مجموع وزن‌های ورودی کلیدواژه صفر است.");
    }
  }
  return issues;
}
