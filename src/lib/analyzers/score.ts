import { findItem, itemsOf, type AnalyzerPack, type Band, type Formula } from "@/lib/analyzers/pack";

export type PackScore = {
  version: string;
  effective: Record<string, number>;
  scores: Record<string, number | string>;
};

function asNumber(value: number | string, ref: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`score ${ref} is not numeric`);
  }
  return value;
}

function bandMatch(value: number, band: Band): boolean {
  if (band.gte != null && value < band.gte) return false;
  if (band.lt != null && value >= band.lt) return false;
  if (band.lte != null && value > band.lte) return false;
  return true;
}

function effectiveOf(pack: AnalyzerPack, answers: Record<string, number | string>, id: string): number {
  const item = findItem(pack, id);
  if (!item || item.kind !== "range") {
    throw new Error(`not a range item: ${id}`);
  }
  const raw = answers[id];
  if (typeof raw !== "number") throw new Error(`missing answer ${id}`);
  return item.reverse ? 10 - raw : raw;
}

function resolve(
  pack: AnalyzerPack,
  answers: Record<string, number | string>,
  scores: Record<string, number | string>,
  ref: string,
): number {
  if (Object.prototype.hasOwnProperty.call(scores, ref)) {
    return asNumber(scores[ref]!, ref);
  }
  return effectiveOf(pack, answers, ref);
}

function runFormula(
  pack: AnalyzerPack,
  answers: Record<string, number | string>,
  scores: Record<string, number | string>,
  formula: Formula,
): number | string {
  const refs = formula.of ?? [];

  if (formula.op === "reverse") {
    if (refs.length !== 1) throw new Error(`${formula.id}: reverse needs one ref`);
    return 10 - resolve(pack, answers, scores, refs[0]!);
  }

  if (formula.op === "mean") {
    if (!refs.length) throw new Error(`${formula.id}: mean needs refs`);
    const total = refs.reduce((sum, ref) => sum + resolve(pack, answers, scores, ref), 0);
    return total / refs.length;
  }

  if (formula.op === "sum") {
    return refs.reduce((sum, ref) => sum + resolve(pack, answers, scores, ref), 0);
  }

  if (formula.op === "sum_div") {
    if (!formula.divisor) throw new Error(`${formula.id}: sum_div needs divisor`);
    const total = refs.reduce((sum, ref) => sum + resolve(pack, answers, scores, ref), 0);
    return total / formula.divisor;
  }

  if (formula.op === "weighted_sum") {
    const weights = formula.weights ?? [];
    if (!weights.length) throw new Error(`${formula.id}: weighted_sum needs weights`);
    return weights.reduce((sum, row) => sum + resolve(pack, answers, scores, row.item) * row.weight, 0);
  }

  if (formula.op === "argmin") {
    if (!refs.length) throw new Error(`${formula.id}: argmin needs refs`);
    let best = refs[0]!;
    let bestValue = resolve(pack, answers, scores, best);
    for (const ref of refs.slice(1)) {
      const value = resolve(pack, answers, scores, ref);
      if (value < bestValue) {
        best = ref;
        bestValue = value;
      }
    }
    return best;
  }

  if (formula.op === "band") {
    if (refs.length !== 1) throw new Error(`${formula.id}: band needs one ref`);
    const value = resolve(pack, answers, scores, refs[0]!);
    const hit = (formula.bands ?? []).find((band) => bandMatch(value, band));
    if (!hit) throw new Error(`${formula.id}: no band for ${value}`);
    return hit.id;
  }

  if (formula.op === "cap_if") {
    if (refs.length !== 1) throw new Error(`${formula.id}: cap_if needs one ref`);
    let current = scores[refs[0]!] ?? resolve(pack, answers, scores, refs[0]!);
    if (typeof current !== "string") throw new Error(`${formula.id}: cap_if needs a band id`);
    const watched = formula.watch ?? [];
    if (!watched.length) return current;
    const worst = Math.min(...watched.map((id) => effectiveOf(pack, answers, id)));
    for (const cap of formula.capAt ?? []) {
      if (worst <= cap.lte) return cap.set;
    }
    for (const rule of formula.demote ?? []) {
      if (worst <= rule.lte && current === rule.from) current = rule.to;
    }
    return current;
  }

  if (formula.op === "matmul") {
    const weights = formula.weights ?? [];
    if (!weights.length) throw new Error(`${formula.id}: matmul needs weights`);
    const dims = new Map<string, number>();
    for (const row of weights) {
      const dim = row.dimension ?? formula.id;
      dims.set(dim, (dims.get(dim) ?? 0) + resolve(pack, answers, scores, row.item) * row.weight);
    }
    for (const [dim, value] of dims) {
      scores[`${formula.id}:${dim}`] = value;
    }
    const first = dims.values().next().value;
    if (first == null) throw new Error(`${formula.id}: matmul empty`);
    return first;
  }

  throw new Error(`unknown op ${formula.op}`);
}

export function scorePack(pack: AnalyzerPack, answers: Record<string, number | string>): PackScore {
  const effective: Record<string, number> = {};
  for (const item of itemsOf(pack)) {
    if (item.kind !== "range") continue;
    effective[item.id] = effectiveOf(pack, answers, item.id);
  }

  const scores: Record<string, number | string> = {};
  for (const formula of pack.formulas) {
    scores[formula.id] = runFormula(pack, answers, scores, formula);
  }

  return { version: pack.version, effective, scores };
}
