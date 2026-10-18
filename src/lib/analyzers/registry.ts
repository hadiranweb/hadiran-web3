import { casioSsPack } from "@/lib/analyzers/casio-ss/pack";
import { listAuthoredPacks, resolveLivePack } from "@/lib/analyzers/authored";
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
  const bySlug = new Map<string, AnalyzerPack>();
  for (const pack of codePacksList) bySlug.set(pack.slug, pack);
  for (const pack of authored) {
    const clean = sanitizePack(pack, pack.slug);
    if (clean.ok) bySlug.set(pack.slug, clean.pack);
  }
  return [...bySlug.values()];
}

export async function loadPack(slug: string): Promise<AnalyzerPack | undefined> {
  try {
    const live = await resolveLivePack(slug);
    if (live) return live;
  } catch {
    // fall through to code
  }
  return getCodePack(slug);
}

/** Packهای کد به‌عنوان بذر. فهرست زنده: loadPacks. */
export function analyzerPacks(): AnalyzerPack[] {
  return codePacksList;
}

export function getPack(slug: string): AnalyzerPack | undefined {
  return getCodePack(slug);
}
