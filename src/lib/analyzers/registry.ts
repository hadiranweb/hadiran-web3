import { casioSsPack } from "@/lib/analyzers/casio-ss/pack";
import { listAuthoredPacks, readAuthoredPack } from "@/lib/analyzers/authored";
import { assertPack, type AnalyzerPack } from "@/lib/analyzers/pack";
import { sanitizePack } from "@/lib/analyzers/sanitize";

const codePacksList: AnalyzerPack[] = [casioSsPack];

for (const pack of codePacksList) assertPack(pack);

export function codePacks(): AnalyzerPack[] {
  return codePacksList;
}

export function getCodePack(slug: string): AnalyzerPack | undefined {
  return codePacksList.find((pack) => pack.slug === slug);
}

export async function loadPacks(): Promise<AnalyzerPack[]> {
  let authored: AnalyzerPack[] = [];
  try {
    authored = await listAuthoredPacks();
  } catch {
    authored = [];
  }
  const seen = new Set(codePacksList.map((pack) => pack.slug));
  const extra: AnalyzerPack[] = [];
  for (const pack of authored) {
    if (seen.has(pack.slug)) continue;
    const clean = sanitizePack(pack, pack.slug);
    if (clean.ok) extra.push(clean.pack);
  }
  return [...codePacksList, ...extra];
}

export async function loadPack(slug: string): Promise<AnalyzerPack | undefined> {
  const code = getCodePack(slug);
  if (code) return code;
  try {
    const raw = await readAuthoredPack(slug);
    if (!raw) return undefined;
    const clean = sanitizePack(raw, slug);
    return clean.ok ? clean.pack : undefined;
  } catch {
    return undefined;
  }
}

/** Packهای کد. برای casio-ss. فهرست کامل: loadPacks. */
export function analyzerPacks(): AnalyzerPack[] {
  return codePacksList;
}

export function getPack(slug: string): AnalyzerPack | undefined {
  return getCodePack(slug);
}
