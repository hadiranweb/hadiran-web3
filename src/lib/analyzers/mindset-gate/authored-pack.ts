/** بذر اولیهٔ «ارزیابی الگوی ذهنی» برای تألیف مدیر؛ بعد از اولین ذخیره، DB منبع است و کد فقط بذر می‌ماند. */

import type { AnalyzerPack } from "@/lib/analyzers/pack";
import { mindsetGatePack } from "./instrument";

export function buildMindsetAuthoredPack(): AnalyzerPack {
  return JSON.parse(JSON.stringify(mindsetGatePack)) as AnalyzerPack;
}
