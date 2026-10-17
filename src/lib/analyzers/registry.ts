import { casioSsPack } from "@/lib/analyzers/casio-ss/pack";
import { assertPack, type AnalyzerPack } from "@/lib/analyzers/pack";

const packs: AnalyzerPack[] = [casioSsPack];

for (const pack of packs) assertPack(pack);

export function analyzerPacks(): AnalyzerPack[] {
  return packs;
}

export function getPack(slug: string): AnalyzerPack | undefined {
  return packs.find((pack) => pack.slug === slug);
}
