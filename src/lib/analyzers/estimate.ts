/**
 * تخمین زمان یک آزمون از روی ساختار خودِ pack — نه متن ثابت.
 * وزن‌ها از تجربهٔ همین فرم می‌آید: مقیاس ۰–۱۰ سریع است، پاسخ متنی کند.
 * این عدد «تخمین» است و در UI هم همین‌طور نوشته می‌شود.
 */

import type { Item, SectionRole } from "./pack";

const SECONDS_PER_KIND: Record<Item["kind"], number> = {
  range: 15,
  choice: 15,
  text: 60,
};

/** ثانیهٔ ثابت برای خواندن معرفی هر بخش. */
const SECTION_INTRO_SECONDS = 12;

export type RoleBreakdown = { role: SectionRole; questionCount: number; sectionCount: number };

export type PackEstimate = {
  questionCount: number;
  sectionCount: number;
  minutes: number;
  /** فقط بخش‌هایی که role دارند؛ اگر هیچ بخشی نقش نداشته باشد خالی است. */
  byRole: RoleBreakdown[];
};

const ROLE_ORDER: SectionRole[] = ["core", "gate", "context"];

export const ROLE_LABEL_FA: Record<SectionRole, string> = {
  core: "پرسش اصلی",
  gate: "گزارهٔ دروازه",
  context: "پرسش زمینه",
};

export function estimatePack(sections: { items: Item[]; role?: SectionRole }[]): PackEstimate {
  let seconds = 0;
  let questionCount = 0;
  const roles = new Map<SectionRole, RoleBreakdown>();
  for (const section of sections) {
    if (section.items.length) seconds += SECTION_INTRO_SECONDS;
    if (section.role) {
      const row = roles.get(section.role) ?? { role: section.role, questionCount: 0, sectionCount: 0 };
      row.questionCount += section.items.length;
      row.sectionCount += 1;
      roles.set(section.role, row);
    }
    for (const item of section.items) {
      seconds += SECONDS_PER_KIND[item.kind] ?? 20;
      questionCount += 1;
    }
  }
  const byRole = ROLE_ORDER.filter((role) => roles.has(role)).map((role) => roles.get(role)!);
  if (!questionCount) return { questionCount: 0, sectionCount: sections.length, minutes: 0, byRole };
  const minutes = Math.max(1, Math.round(seconds / 60));
  return { questionCount, sectionCount: sections.length, minutes, byRole };
}

/** «۲۰ پرسش اصلی · ۱۲ گزارهٔ دروازه · ۶ پرسش زمینه» — خالی اگر تفکیک نباشد. */
export function roleBreakdownFa(byRole: RoleBreakdown[]): string {
  if (!byRole.length) return "";
  return byRole
    .map((row) => `${row.questionCount.toLocaleString("fa-IR")} ${ROLE_LABEL_FA[row.role]}`)
    .join(" · ");
}

export function estimateLabelFa(minutes: number): string {
  if (minutes <= 0) return "زمان نامشخص";
  return `حدود ${minutes.toLocaleString("fa-IR")} دقیقه`;
}
