import type { ChatReferences, RetrievedEntity } from "@/lib/ai";
import type {
  AudienceContext,
  EcosystemHits,
  KnowledgeHit,
  McpConfig,
  McpTopicRule,
  ResponseStyle,
  TopicHit,
} from "./types";

/**
 * موتور پاسخ‌ساز لوکال (بدون LLM). خالص و قطعی: فقط از خروجی ابزارهای MCP
 * (دانش عمومی تاییدشده، لایه‌های مقاله، قانون موضوع و زمینهٔ مجاز مخاطب) می‌سازد.
 */

export interface LocalComposition {
  answer: string;
  references: ChatReferences;
  related: RetrievedEntity[];
  topicSlugs: string[];
  suggestedAnalyzer: { slug: string; nameFa: string } | null;
  followUpQuestions: string[];
}

export const DB_DOWN_ANSWER =
  "خانه روشن است؛ اتصال دانش هنوز برقرار نیست. مسئله‌ات را بگو، به‌محض وصل شدن دیتابیس بازیابی فعال می‌شود.";
export const EMPTY_ANSWER =
  "سؤال جالبی است. فعلاً در دانش موجود من مطلب مستقیمی پیدا نکردم، ولی می‌توانی در باغ دانش یا کارگاه بگردی یا سؤال را جور دیگری بپرسی.";
export const GREETING_ANSWER =
  "سلام. مسئله‌ات را بگو تا با هم شفافش کنیم — از گلوگاه روزمره تا معماری سیستم. اول می‌بینیم، بعد می‌سازیم.";

function buildReferences(
  topics: TopicHit[],
  knowledge: KnowledgeHit[],
  ecosystem: EcosystemHits,
): ChatReferences {
  return {
    knowledge: knowledge.slice(0, 4).map((k) => ({ slug: k.slug, title: k.title, summary: k.summary })),
    projects: ecosystem.projects.slice(0, 3).map((p) => ({ slug: p.slug, name: p.name, summary: p.summary })),
    courses: ecosystem.courses.slice(0, 3).map((c) => ({ slug: c.slug, title: c.title, summary: c.summary })),
    topics: topics.slice(0, 4).map((t) => ({ slug: t.slug, name: t.name, summary: t.summary })),
  };
}

function buildRelated(
  topics: TopicHit[],
  knowledge: KnowledgeHit[],
  ecosystem: EcosystemHits,
): RetrievedEntity[] {
  const all: RetrievedEntity[] = [
    ...topics.map((t) => ({ type: "topic" as const, slug: t.slug, title: t.name, summary: t.summary, relevance: t.relevance })),
    ...knowledge.map((k) => ({ type: "knowledge" as const, slug: k.slug, title: k.title, summary: k.summary, relevance: k.relevance })),
    ...ecosystem.projects.map((p) => ({ type: "project" as const, slug: p.slug, title: p.name, summary: p.summary, relevance: p.relevance })),
    ...ecosystem.courses.map((c) => ({ type: "course" as const, slug: c.slug, title: c.title, summary: c.summary, relevance: c.relevance })),
  ];
  return all.sort((a, b) => b.relevance - a.relevance).slice(0, 8);
}

export function bottleneckHint(audience: AudienceContext, style: ResponseStyle): string {
  const mirror = audience.mirror;
  if (!mirror?.bottleneckName) return "";
  let hint = `با توجه به اینکه در گزارش آینه‌ات گلوگاه اصلی «${mirror.bottleneckName}» تشخیص داده شده، پیشنهاد می‌شود از این زاویه به مسئله نگاه کنید.`;
  if (style === "deep_reference" && mirror.layerToBe) {
    hint += ` مسیر بهترِ ثبت‌شده در همان گزارش: ${mirror.layerToBe}`;
  }
  return hint;
}

function fillTemplate(
  template: string,
  values: Record<string, string>,
): string {
  let out = template;
  for (const [key, value] of Object.entries(values)) {
    out = out.split(`{{${key}}}`).join(value);
  }
  return out.replace(/\{\{[^}]+\}\}/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function composeLocalAnswer(input: {
  knowledge: KnowledgeHit[];
  ecosystem: EcosystemHits;
  topics: TopicHit[];
  rule: McpTopicRule | null;
  audience: AudienceContext;
  config: McpConfig;
  databaseReady: boolean;
}): LocalComposition {
  const { knowledge, ecosystem, topics, rule, audience, config } = input;
  const references = buildReferences(topics, knowledge, ecosystem);
  const related = buildRelated(topics, knowledge, ecosystem);
  const topicSlugs = topics.map((t) => t.slug);

  const preferred = rule?.preferredAnalyzerSlug
    ? ecosystem.analyzers.find((a) => a.slug === rule.preferredAnalyzerSlug) ?? null
    : null;
  const topAnalyzer = preferred ?? ecosystem.analyzers[0] ?? null;
  // بدون دیتابیس پاسخ «اتصال برقرار نیست» است؛ پیشنهاد آینه کنار آن ناهماهنگ است.
  const suggestedAnalyzer =
    input.databaseReady && topAnalyzer ? { slug: topAnalyzer.slug, nameFa: topAnalyzer.nameFa } : null;

  const topTopic = topics[0] ?? null;
  const topKnowledge = knowledge[0] ?? null;
  const style: ResponseStyle = rule?.responseStyle ?? "clarify_first";

  const closingQuestion =
    rule?.closingQuestionOverrideFa ?? topKnowledge?.closingQuestionFa ?? topKnowledge?.questionFa ?? null;
  const followUpQuestions = topKnowledge?.closingOptions?.length
    ? topKnowledge.closingOptions
    : closingQuestion
      ? [closingQuestion]
      : [];

  const finish = (answer: string): LocalComposition => ({
    answer,
    references,
    related,
    topicSlugs,
    suggestedAnalyzer,
    followUpQuestions,
  });

  if (!input.databaseReady) return finish(DB_DOWN_ANSWER);
  if (!topTopic && !topKnowledge && ecosystem.projects.length === 0 && ecosystem.courses.length === 0) {
    return finish(EMPTY_ANSWER);
  }

  const topicIntro = topTopic
    ? topTopic.summary?.trim()
      ? `بر اساس دانش هادیران، موضوع «${topTopic.name}» یکی از محورهای اصلی است. ${topTopic.summary.trim()}`
      : `بر اساس دانش هادیران، موضوع «${topTopic.name}» یکی از محورهای اصلی است.`
    : "";
  const knowledgeLine = topKnowledge
    ? (topKnowledge.lineFa?.trim() ??
      topKnowledge.summary?.trim() ??
      `در باغ دانش، مطلب «${topKnowledge.title}» می‌تواند پاسخت را تکمیل کند.`)
    : "";
  const knowledgeRoot = topKnowledge?.rootFa?.trim() ?? "";
  const firstStep = topKnowledge?.firstStepFa?.trim() ?? "";
  const audienceBottleneckHint = bottleneckHint(audience, style);

  // قالب سفارشی ادمین: همان متغیرهای دوحالته.
  if (config.defaultLocalTemplateFa) {
    const filled = fillTemplate(config.defaultLocalTemplateFa, {
      topicIntro,
      knowledgeLine,
      knowledgeRoot,
      firstStep,
      audienceBottleneckHint,
      closingQuestion: closingQuestion ?? "",
    });
    if (filled) return finish(filled);
  }

  const parts: string[] = [];
  if (audience.displayName && audience.history.length === 0) {
    parts.push(`سلام ${audience.displayName}.`);
  }
  parts.push(rule?.customLocalLeadFa?.trim() || topicIntro || "مسئله‌ات را گرفتم؛ این‌طور می‌توانیم شفافش کنیم.");

  if (topKnowledge) {
    if (style === "action_first") {
      if (firstStep) parts.push(`گام اول: ${firstStep}`);
      if (knowledgeLine && knowledgeLine !== firstStep) parts.push(knowledgeLine);
      if (knowledgeRoot) parts.push(knowledgeRoot);
    } else if (style === "deep_reference") {
      if (knowledgeLine) parts.push(knowledgeLine);
      if (knowledgeRoot) parts.push(knowledgeRoot);
      if (firstStep) parts.push(`گام اول عملی: ${firstStep}`);
    } else {
      // clarify_first: اول شفاف‌سازی ریشه‌ای، بعد گام اول.
      if (knowledgeLine) parts.push(knowledgeLine);
      if (knowledgeRoot) parts.push(knowledgeRoot);
      if (firstStep) parts.push(`گام اول: ${firstStep}`);
    }
  }

  const topProject = ecosystem.projects[0];
  if (topProject) {
    parts.push(`پروژهٔ «${topProject.name}» هم مرتبط است و می‌توانی وایت‌پیپر و بلوپرینت آن را ببینی.`);
  }
  const topCourse = ecosystem.courses[0];
  if (topCourse) {
    parts.push(`اگر دنبال یادگیری عمیق‌تری هستی، دورهٔ «${topCourse.title}» پیشنهاد می‌شود.`);
  }
  if (audienceBottleneckHint) parts.push(audienceBottleneckHint);
  if (topAnalyzer) {
    parts.push(`آینهٔ «${topAnalyzer.nameFa}» هم می‌تواند مسئله‌ات را عینی‌تر کند.`);
  }
  if (closingQuestion) parts.push(closingQuestion);

  return finish(parts.filter(Boolean).join(" "));
}

export { buildReferences, buildRelated, fillTemplate };
