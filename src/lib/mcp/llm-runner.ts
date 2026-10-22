import { bottleneckHint } from "./local-composer";
import type { AudienceContext, EcosystemHits, KnowledgeHit, McpConfig, McpTopicRule, TopicHit } from "./types";

/**
 * موتور LLM: فقط اندپوینت سازگار با OpenAI Chat Completions
 * (OpenAI / OpenRouter / Ollama و هر سرویس compatible). SDK نصب نمی‌شود؛ fetch استاندارد + AbortSignal.timeout.
 * هر خطایی به ارکستریتور برمی‌گردد تا همان درخواست با موتور لوکال جواب بگیرد.
 */

export const DEFAULT_LLM_SYSTEM_PROMPT_FA = [
  "تو دستیار خانهٔ هادیران هستی. لحن: «اول می‌بینیم، بعد می‌سازیم»؛ دقیق، کوتاه و بدون کلی‌گویی.",
  "فقط و فقط بر پایهٔ منابعی که در پیام کاربر داده شده پاسخ بده؛ چیزی از خودت به منابع اضافه نکن و اگر منبع کافی نیست صادقانه بگو.",
  "در پایان دقیقاً یک سؤال شفاف‌ساز بپرس. پاسخ فارسی باشد.",
].join("\n");

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function buildLlmMessages(input: {
  config: McpConfig;
  query: string;
  knowledge: KnowledgeHit[];
  ecosystem: EcosystemHits;
  topics: TopicHit[];
  rule: McpTopicRule | null;
  audience: AudienceContext;
}): LlmMessage[] {
  const { config, knowledge, ecosystem, topics, rule, audience } = input;

  const systemParts = [config.defaultSystemPromptFa?.trim() || DEFAULT_LLM_SYSTEM_PROMPT_FA];
  if (rule?.customPromptFa?.trim()) systemParts.push(rule.customPromptFa.trim());
  if (audience.mirror?.bottleneckName) {
    systemParts.push(
      `زمینهٔ مخاطب (فقط برای شخصی‌سازی همین پاسخ): گلوگاه ثبت‌شده در گزارش آینه «${audience.mirror.bottleneckName}» است. تحلیل را روی همین گلوگاه سوار کن.`,
    );
  }

  const sourceLines: string[] = [];
  for (const t of topics) sourceLines.push(`موضوع: ${t.name}${t.summary ? ` — ${t.summary}` : ""}`);
  for (const k of knowledge) {
    const layers = [k.lineFa, k.rootFa, k.firstStepFa, k.closingQuestionFa].filter(Boolean).join(" | ");
    sourceLines.push(`مقاله «${k.title}»: ${k.summary ?? ""}${layers ? ` [لایه‌ها: ${layers}]` : ""}`);
  }
  for (const p of ecosystem.projects) sourceLines.push(`پروژه «${p.name}»: ${p.summary ?? ""}`);
  for (const c of ecosystem.courses) sourceLines.push(`دوره «${c.title}»: ${c.summary ?? ""}`);
  for (const a of ecosystem.analyzers) sourceLines.push(`آینه «${a.nameFa}»: ${a.summaryFa}`);
  const hint = bottleneckHint(audience, rule?.responseStyle ?? "clarify_first");
  if (hint) sourceLines.push(hint);

  const messages: LlmMessage[] = [{ role: "system", content: systemParts.join("\n") }];
  for (const turn of audience.history.slice(-config.maxHistoryTurns * 2)) {
    messages.push({ role: turn.role, content: turn.content });
  }
  messages.push({
    role: "user",
    content: `پرسش: ${input.query}\n\nمنابع تاییدشدهٔ هادیران:\n${sourceLines.length ? sourceLines.join("\n") : "(منبع مستقیمی پیدا نشد)"}`,
  });
  return messages;
}

export async function runLlmChat(input: { config: McpConfig; messages: LlmMessage[] }): Promise<string> {
  const { config } = input;
  if (!config.llmApiKey) throw new Error("llm_not_configured");
  const base = config.llmBaseUrl.replace(/\/+$/, "");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.llmApiKey}`,
    },
    body: JSON.stringify({
      model: config.llmModel,
      temperature: config.llmTemperature,
      max_tokens: config.llmMaxTokens,
      messages: input.messages,
    }),
    signal: AbortSignal.timeout(config.llmTimeoutMs),
  });
  if (!res.ok) throw new Error(`llm_http_${res.status}`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: unknown } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("llm_empty_response");
  return content.trim();
}
