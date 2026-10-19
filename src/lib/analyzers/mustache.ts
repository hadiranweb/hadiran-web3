/** منطق‌کم Mustache بدون eval / new Function. بخش، وارون، مسیر نقطه‌دار. */

const BLOCKED = new Set(["__proto__", "prototype", "constructor"]);
const MAX_LEN = 400_000;
const MAX_NODES = 8_000;

export type MustacheContext = Record<string, unknown>;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function asString(value: unknown): string {
  if (value == null || value === false) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "";
  return "";
}

function lookup(stack: unknown[], path: string): unknown {
  const trimmed = path.trim();
  if (!trimmed || trimmed === ".") return stack[stack.length - 1];
  const parts = trimmed.split(".");
  for (let frame = stack.length - 1; frame >= 0; frame -= 1) {
    let current: unknown = stack[frame];
    let ok = true;
    for (const part of parts) {
      if (BLOCKED.has(part)) return undefined;
      if (current == null || typeof current !== "object") {
        ok = false;
        break;
      }
      current = (current as Record<string, unknown>)[part];
    }
    if (ok && current !== undefined) return current;
  }
  return undefined;
}

function truthy(value: unknown): boolean {
  if (value == null || value === false || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function findClose(template: string, name: string, from: number): number {
  let depth = 1;
  let i = from;
  const open = `{{#${name}`;
  const openInv = `{{^${name}`;
  const close = `{{/${name}`;
  while (i < template.length) {
    const next = template.indexOf("{{", i);
    if (next < 0) return -1;
    const rest = template.slice(next);
    if (rest.startsWith(close) && (rest[close.length] === "}" || rest[close.length] === " " || rest[close.length] === "\t")) {
      depth -= 1;
      if (depth === 0) return next;
    } else if (rest.startsWith(open) || rest.startsWith(openInv)) {
      depth += 1;
    }
    i = next + 2;
  }
  return -1;
}

function skipTagEnd(template: string, close: number, triple: boolean) {
  return close + (triple ? 3 : 2);
}

export function renderMustache(template: string, data: unknown): string {
  if (!template) return "";
  if (template.length > MAX_LEN) return template.slice(0, MAX_LEN);
  let nodes = 0;

  const walk = (source: string, stack: unknown[]): string => {
    let out = "";
    let i = 0;
    while (i < source.length) {
      nodes += 1;
      if (nodes > MAX_NODES || out.length > MAX_LEN) break;
      const open = source.indexOf("{{", i);
      if (open < 0) {
        out += source.slice(i);
        break;
      }
      out += source.slice(i, open);
      const triple = source[open + 2] === "{";
      const start = open + (triple ? 3 : 2);
      const close = source.indexOf("}}", start);
      if (close < 0) {
        out += source.slice(open);
        break;
      }
      let tag = source.slice(start, close).trim();
      if (triple && tag.endsWith("}")) tag = tag.slice(0, -1).trim();
      const after = skipTagEnd(source, close, triple);

      if (tag.startsWith("!")) {
        i = after;
        continue;
      }
      if (tag.startsWith("#") || tag.startsWith("^")) {
        const inverted = tag.startsWith("^");
        const name = tag.slice(1).trim();
        const blockStart = after;
        const blockOpen = source.lastIndexOf("{{", close);
        const endOpen = findClose(source, name, blockStart);
        if (endOpen < 0) {
          i = after;
          continue;
        }
        const endClose = source.indexOf("}}", endOpen + 2);
        const inner = source.slice(blockStart, endOpen);
        i = endClose < 0 ? source.length : endClose + 2;
        void blockOpen;
        const value = lookup(stack, name);
        const show = inverted ? !truthy(value) : truthy(value);
        if (!show) continue;
        if (!inverted && Array.isArray(value)) {
          for (const item of value) out += walk(inner, [...stack, item]);
        } else if (!inverted && value && typeof value === "object") {
          out += walk(inner, [...stack, value]);
        } else {
          out += walk(inner, stack);
        }
        continue;
      }
      if (tag.startsWith("/")) {
        i = after;
        continue;
      }
      if (tag.startsWith(">")) {
        const partial = asString(lookup(stack, tag.slice(1).trim()));
        out += partial;
        i = after;
        continue;
      }
      const raw = asString(lookup(stack, tag));
      out += triple ? raw : escapeHtml(raw);
      i = after;
    }
    return out;
  };

  return walk(template, [data]);
}

export function stripUnsafeHtml(html: string) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/\son[a-z]+\s*=/gi, " data-dropped=")
    .replace(/javascript:/gi, "");
}
