/**
 * تخمین زمان یک آزمون از روی ساختار خودِ pack — نه متن ثابت.
 * وزن‌ها از تجربهٔ همین فرم می‌آید: مقیاس ۰–۱۰ سریع است، پاسخ متنی کند.
 * این عدد «تخمین» است و در UI هم همین‌طور نوشته می‌شود.
 */

import type { Item } from "./pack";

const SECONDS_PER_KIND: Record<Item["kind"], number> = {
  range: 15,
  choice: 15,
  text: 60,
};

/** ثانیهٔ ثابت برای خواندن معرفی هر بخش. */
const SECTION_INTRO_SECONDS = 12;

export type PackEstimate = {
  questionCount: number;
  sectionCount: number;
  minutes: number;
};

export function estimatePack(sections: { items: Item[] }[]): PackEstimate {
  let seconds = 0;
  let questionCount = 0;
  for (const section of sections) {
    if (section.items.length) seconds += SECTION_INTRO_SECONDS;
    for (const item of section.items) {
      seconds += SECONDS_PER_KIND[item.kind] ?? 20;
      questionCount += 1;
    }
  }
  if (!questionCount) return { questionCount: 0, sectionCount: sections.length, minutes: 0 };
  const minutes = Math.max(1, Math.round(seconds / 60));
  return { questionCount, sectionCount: sections.length, minutes };
}

export function estimateLabelFa(minutes: number): string {
  if (minutes <= 0) return "زمان نامشخص";
  return `حدود ${minutes.toLocaleString("fa-IR")} دقیقه`;
}
