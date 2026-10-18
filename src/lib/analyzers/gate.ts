import type { AnalyzerPack } from "@/lib/analyzers/pack";
import type { PackScore } from "@/lib/analyzers/score";

export type GateBandId = "green" | "yellow" | "red";

export type GateDimension = { id: string; titleFa: string; score: number };

export type GateView = {
  bandId: GateBandId;
  labelFa: string;
  total: number | null;
  dimensions: GateDimension[];
};

const LABELS: Record<GateBandId, string> = {
  green: "سبز",
  yellow: "زرد",
  red: "قرمز",
};

function asNumber(value: number | string | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBand(value: unknown): GateBandId | null {
  if (value === "green" || value === "yellow" || value === "red") return value;
  return null;
}

export function gateOf(
  pack: AnalyzerPack,
  results: PackScore | { scores?: Record<string, number | string> } | null,
): GateView | null {
  const scores = results?.scores;
  if (!scores) return null;
  const bandId = asBand(scores["gate-band"]);
  if (!bandId) return null;
  const formula = pack.formulas.find((row) => row.id === "gate-band");
  const labelFa = formula?.bands?.find((band) => band.id === bandId)?.labelFa ?? LABELS[bandId];
  const dimensions: GateDimension[] = [];
  for (const id of ["gate-control", "gate-agency", "gate-problem"]) {
    const score = asNumber(scores[id]);
    if (score == null) continue;
    const finding = pack.findings.find((row) => row.id === id);
    dimensions.push({ id, titleFa: finding?.titleFa ?? id, score });
  }
  return {
    bandId,
    labelFa,
    total: asNumber(scores["gate-total"]),
    dimensions,
  };
}
