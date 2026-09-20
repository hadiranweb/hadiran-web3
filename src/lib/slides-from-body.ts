/**
 * Kaghaz «1 idea per slide» — deterministic, no model.
 * Headings start a new idea; long sections split by paragraph / list item.
 * Target: ~60 seconds of reading per slide.
 */

export type GeneratedSlide = {
  titleFa: string;
  bodyFa: string;
};

const MAX_BODY_CHARS = 420;
const MAX_TITLE = 120;

type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "code"; text: string }
  | { type: "list"; items: string[] }
  | { type: "para"; text: string };

function stripInline(value: string) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1")
    .trim();
}

function clipTitle(value: string) {
  const clean = stripInline(value).replace(/\s+/g, " ").trim();
  if (clean.length <= MAX_TITLE) return clean;
  return `${clean.slice(0, MAX_TITLE - 1).trim()}…`;
}

function firstLine(value: string) {
  return clipTitle(value.split("\n").find((line) => line.trim()) || "");
}

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let inCode = false;
  let code: string[] = [];
  let para: string[] = [];
  let listItems: string[] = [];

  const flushPara = () => {
    const text = para.join("\n").trim();
    if (text) blocks.push({ type: "para", text });
    para = [];
  };
  const flushList = () => {
    if (listItems.length) blocks.push({ type: "list", items: [...listItems] });
    listItems = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      flushPara();
      flushList();
      if (inCode) {
        blocks.push({ type: "code", text: code.join("\n") });
        code = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushPara();
      flushList();
      blocks.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2].trim(),
      });
      continue;
    }
    const item = line.match(/^\s*[-*]\s+(.+)$/);
    if (item) {
      flushPara();
      listItems.push(item[1].trim());
      continue;
    }
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  if (inCode && code.length) blocks.push({ type: "code", text: code.join("\n") });
  return blocks;
}

function blockToMarkdown(block: Block): string {
  if (block.type === "para") return block.text;
  if (block.type === "list") return block.items.map((item) => `- ${item}`).join("\n");
  if (block.type === "code") return `\`\`\`\n${block.text}\n\`\`\``;
  return `${"#".repeat(block.level)} ${block.text}`;
}

function blocksToMarkdown(blocks: Block[]): string {
  return blocks
    .map(blockToMarkdown)
    .filter((chunk) => chunk.trim())
    .join("\n\n")
    .trim();
}

type Section = { title: string; blocks: Block[] };

function toSections(blocks: Block[], articleTitle: string): Section[] {
  const sections: Section[] = [];
  let current: Section = { title: "", blocks: [] };

  const push = () => {
    if (current.title || current.blocks.length) sections.push(current);
    current = { title: "", blocks: [] };
  };

  for (const block of blocks) {
    if (block.type !== "heading") {
      current.blocks.push(block);
      continue;
    }
    const headingText = stripInline(block.text);
    if (block.level === 1 && articleTitle && headingText === stripInline(articleTitle)) {
      continue;
    }
    push();
    current = { title: headingText, blocks: [] };
  }
  push();
  return sections.filter((section) => section.title || section.blocks.length);
}

function emitBlocks(title: string, blocks: Block[]): GeneratedSlide[] {
  const body = blocksToMarkdown(blocks);
  if (!body && title) return [{ titleFa: clipTitle(title), bodyFa: "" }];
  if (!body) return [];
  if (body.length <= MAX_BODY_CHARS) {
    return [{ titleFa: clipTitle(title || firstLine(body)), bodyFa: body }];
  }

  const slides: GeneratedSlide[] = [];
  let buffer: Block[] = [];
  let bufferTitle = title;

  const flush = () => {
    const chunk = blocksToMarkdown(buffer);
    buffer = [];
    if (!chunk) return;
    slides.push({
      titleFa: clipTitle(bufferTitle || firstLine(chunk)),
      bodyFa: chunk,
    });
    bufferTitle = "";
  };

  for (const block of blocks) {
    if (block.type === "list" && block.items.length > 1) {
      const listMd = blockToMarkdown(block);
      if (listMd.length > MAX_BODY_CHARS / 2 || blocksToMarkdown([...buffer, block]).length > MAX_BODY_CHARS) {
        flush();
        for (const item of block.items) {
          slides.push({
            titleFa: clipTitle(title || firstLine(item)),
            bodyFa: item,
          });
        }
        continue;
      }
    }
    const next = [...buffer, block];
    if (buffer.length && blocksToMarkdown(next).length > MAX_BODY_CHARS) {
      flush();
    }
    buffer.push(block);
  }
  flush();
  return slides;
}

export function slidesFromBody(input: {
  titleFa?: string | null;
  summaryFa?: string | null;
  bodyFa: string;
}): GeneratedSlide[] {
  const titleFa = (input.titleFa || "").trim();
  const summaryFa = (input.summaryFa || "").trim();
  const bodyFa = input.bodyFa.replace(/\r\n?/g, "\n").trim();
  if (!bodyFa) return [];

  const sections = toSections(parseBlocks(bodyFa), titleFa);
  const slides: GeneratedSlide[] = [];

  if (summaryFa) {
    const summaryAlreadyFirst =
      sections[0] &&
      stripInline(sections[0].title) === stripInline(titleFa) &&
      blocksToMarkdown(sections[0].blocks) === summaryFa;
    if (!summaryAlreadyFirst) {
      slides.push({ titleFa: clipTitle(titleFa || "شروع"), bodyFa: summaryFa });
    }
  }

  for (const section of sections) {
    slides.push(...emitBlocks(section.title, section.blocks));
  }

  const seen = new Set<string>();
  return slides.filter((slide) => {
    const key = `${slide.titleFa}\n${slide.bodyFa}`.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
