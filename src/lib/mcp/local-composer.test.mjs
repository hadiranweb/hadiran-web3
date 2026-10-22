/**
 * موتور لوکال MCP: ساخت پاسخ از لایه‌های مقاله، قانون موضوع و گلوگاه مخاطب — بدون DB و بدون LLM.
 * اجرا: npx tsx --test src/lib/mcp/local-composer.test.mjs
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { composeLocalAnswer, DB_DOWN_ANSWER, EMPTY_ANSWER } from "./local-composer.ts";
import { DEFAULT_MCP_CONFIG, parseWeights, parseTimeoutMs } from "./types.ts";

const config = { ...DEFAULT_MCP_CONFIG };
const guest = { level: "none", isGuest: true, displayName: null, history: [], mirror: null };
const hit = {
  slug: "sales-system",
  title: "سیستم فروش",
  summary: "خلاصه",
  lineFa: "فروش از سیستم می‌آید، نه از فشار.",
  questionFa: "کجای قیف می‌ریزد؟",
  rootFa: "ریشه، نبودِ قیف قابل‌اندازه‌گیری است.",
  firstStepFa: "امروز قیف را روی کاغذ بکش.",
  closingQuestionFa: "اولین عددی که فردا اندازه می‌گیری چیست؟",
  closingOptions: ["نرخ تبدیل", "سرنخ روزانه"],
  relevance: 9,
};
const noEco = { projects: [], courses: [], analyzers: [] };

test("بدون دیتابیس همان پاسخ قبلی خانه برمی‌گردد", () => {
  const out = composeLocalAnswer({
    knowledge: [], ecosystem: noEco, topics: [], rule: null, audience: guest, config, databaseReady: false,
  });
  assert.equal(out.answer, DB_DOWN_ANSWER);
});

test("بدون هیچ تطبیقی پاسخ خالیِ قبلی برمی‌گردد", () => {
  const out = composeLocalAnswer({
    knowledge: [], ecosystem: noEco, topics: [], rule: null, audience: guest, config, databaseReady: true,
  });
  assert.equal(out.answer, EMPTY_ANSWER);
});

test("سبک شفاف‌سازی: خط، ریشه، گام اول و سؤال پایانی به ترتیب می‌آیند", () => {
  const out = composeLocalAnswer({
    knowledge: [hit], ecosystem: noEco, topics: [], rule: null, audience: guest, config, databaseReady: true,
  });
  const iLine = out.answer.indexOf("فروش از سیستم می‌آید");
  const iRoot = out.answer.indexOf("ریشه، نبودِ قیف");
  const iStep = out.answer.indexOf("گام اول: امروز قیف");
  const iClose = out.answer.indexOf("اولین عددی که فردا");
  assert.ok(iLine > -1 && iRoot > iLine && iStep > iRoot && iClose > iStep);
  assert.deepEqual(out.followUpQuestions, ["نرخ تبدیل", "سرنخ روزانه"]);
  assert.equal(out.references.knowledge[0].slug, "sales-system");
});

test("سبک گام عملی: firstStep قبل از ریشه می‌آید", () => {
  const rule = {
    topicSlug: "sales", enabled: true, modeOverride: "inherit", responseStyle: "action_first",
    customPromptFa: null, customLocalLeadFa: null, closingQuestionOverrideFa: null,
    preferredAnalyzerSlug: null, priorityBoost: 0,
  };
  const out = composeLocalAnswer({
    knowledge: [hit], ecosystem: noEco, topics: [], rule, audience: guest, config, databaseReady: true,
  });
  assert.ok(out.answer.indexOf("گام اول") < out.answer.indexOf("ریشه، نبودِ قیف"));
});

test("گلوگاه مخاطب فقط وقتی در زمینه هست وارد پاسخ می‌شود", () => {
  const withMirror = {
    ...guest,
    level: "mirror_insights",
    mirror: { coverTitle: "گزارش", maturityLabel: "ابتدایی", bottleneckName: "سیستم فروش", bottleneckScore: 3, layerAsIs: null, layerToBe: null },
  };
  const out = composeLocalAnswer({
    knowledge: [hit], ecosystem: noEco, topics: [], rule: null, audience: withMirror, config, databaseReady: true,
  });
  assert.ok(out.answer.includes("گلوگاه اصلی «سیستم فروش»"));
  const without = composeLocalAnswer({
    knowledge: [hit], ecosystem: noEco, topics: [], rule: null, audience: guest, config, databaseReady: true,
  });
  assert.ok(!without.answer.includes("گلوگاه اصلی"));
});

test("قالب سفارشی ادمین با متغیرها پر می‌شود و متغیر ناشناخته حذف می‌شود", () => {
  const out = composeLocalAnswer({
    knowledge: [hit], ecosystem: noEco, topics: [], rule: null, audience: guest,
    config: { ...config, defaultLocalTemplateFa: "{{knowledgeLine}} | {{firstStep}} | {{unknown}}" },
    databaseReady: true,
  });
  assert.equal(out.answer, "فروش از سیستم می‌آید، نه از فشار. | امروز قیف را روی کاغذ بکش. |");
});

test("پارس وزن‌ها و تایم‌اوت مقادیر نامعتبر را به پیش‌فرض برمی‌گرداند", () => {
  assert.deepEqual(parseWeights({ title: "x" }).title, 3);
  assert.equal(parseWeights({ title: 999 }).title, 50);
  assert.equal(parseTimeoutMs(5), 1000);
  assert.equal(parseTimeoutMs(999999), 60000);
});
