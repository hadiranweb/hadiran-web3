"use client";

import { AnalyzerRun } from "@/components/analyzers/AnalyzerRun";
import type { AnalyzerPack } from "@/lib/analyzers/pack";

export function CasioSsRun({ pack }: { pack: AnalyzerPack }) {
  return <AnalyzerRun pack={pack} />;
}
