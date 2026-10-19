/** HTML parse_mode تلگرام: از MarkdownV2 ساده‌تر است و نقل‌قول جمع‌شو دارد. */

export const TELEGRAM_RULE = "────────";

export function escapeTelegramHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function htmlBold(value: string) {
  const text = escapeTelegramHtml(value).trim();
  return text ? `<b>${text}</b>` : "";
}

export function htmlExpandableQuote(value: string) {
  const text = escapeTelegramHtml(value).trim() || "—";
  return `<blockquote expandable>${text}</blockquote>`;
}

export function stripTelegramHtml(value: string) {
  return value.replace(/<[^>]+>/g, "");
}

function inlineMarkdownToHtml(line: string) {
  let text = escapeTelegramHtml(line);
  text = text.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  text = text.replace(/__(.+?)__/g, "<i>$1</i>");
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  return text;
}

function isRuleLine(line: string) {
  return /^(-{3,}|\*{3,}|_{3,}|─{3,})$/.test(line.trim());
}

/** نشانه‌گذاری سبک داخل متن pack: **پررنگ** __کج__ `کد` و خط `---` جداکننده. HTML خام pack وارد تلگرام نمی‌شود. */
export function telegramQuestionHtml(raw: string) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const hasMarkup = lines.some(isRuleLine) || /\*\*|__|`/.test(raw);
  if (!hasMarkup) return htmlBold(raw);
  return lines.map((line) => (isRuleLine(line) ? TELEGRAM_RULE : inlineMarkdownToHtml(line))).join("\n").trim();
}
