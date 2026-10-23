/** بذر اولیهٔ «عارضه‌یابی سیستم کسب‌وکار» برای تألیف مدیر؛ بعد از اولین ذخیره، DB منبع است و کد فقط بذر می‌ماند. */

import type { AnalyzerPack } from "@/lib/analyzers/pack";
import { systemDiagnosisPack } from "./instrument";

export function buildSystemDiagnosisAuthoredPack(): AnalyzerPack {
  return JSON.parse(JSON.stringify(systemDiagnosisPack)) as AnalyzerPack;
}
