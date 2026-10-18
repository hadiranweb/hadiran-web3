import type { AnalyzerPack } from "@/lib/analyzers/pack";

export function botConsent(pack: AnalyzerPack): string {
  const body = [pack.consent.titleFa, "", ...pack.consent.bodyFa].join("\n");
  return body.slice(0, 3500);
}
