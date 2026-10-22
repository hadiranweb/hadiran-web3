/**
 * تایپ‌های لایهٔ سرویس MCP (رجیستری سرورها و ابزارها) + سیاست مقادیر خالص.
 * این فایل بدون DB است تا سیاست پیش‌فرض/سقف/تحمیل در تست پوشش داشته باشد.
 */

export type McpServerKind = "builtin" | "remote";
export type McpServerStatus = "draft" | "in_review" | "active" | "disabled";
export type McpVisibility = "internal" | "external";
export type McpReviewStatus = "unreviewed" | "approved" | "rejected";
export type McpRiskLevel = "low" | "medium" | "high";

export interface McpServerRecord {
  slug: string;
  name: string;
  titleFa: string | null;
  descriptionFa: string | null;
  kind: McpServerKind;
  transport: string;
  baseUrl: string | null;
  protocolVersion: string;
  instructionsFa: string | null;
  visibility: McpVisibility;
  status: McpServerStatus;
  capabilities: { tools: boolean; resources: boolean; prompts: boolean };
  authType: string;
  hasAuthToken: boolean;
  authTokenHint: string | null;
  healthStatus: string | null;
  healthError: string | null;
  healthAt: string | null;
}

export interface McpToolRecord {
  id: number;
  serverSlug: string;
  name: string;
  titleFa: string | null;
  descriptionFa: string | null;
  enabled: boolean;
  origin: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown> | null;
  defaults: Record<string, unknown>;
  caps: Record<string, unknown>;
  annotations: Record<string, unknown>;
  riskLevel: McpRiskLevel;
  reviewStatus: McpReviewStatus;
  requiresConfirmation: boolean;
  timeoutMs: number;
  sortOrder: number;
}

export interface McpResourceRecord {
  id: number;
  serverSlug: string;
  uriTemplate: string;
  nameFa: string | null;
  descriptionFa: string | null;
  mimeType: string;
  enabled: boolean;
}

export interface McpPromptRecord {
  id: number;
  serverSlug: string;
  name: string;
  titleFa: string | null;
  descriptionFa: string | null;
  templateFa: string | null;
  arguments: unknown[];
  enabled: boolean;
}

export interface McpBindingRecord {
  consumer: string;
  labelFa: string;
  enabled: boolean;
  hasToken: boolean;
  tokenHint: string | null;
}

export interface EffectiveTool {
  server: McpServerRecord;
  tool: McpToolRecord;
  paramOverrides: Record<string, unknown>;
}

const SERVER_STATUSES: McpServerStatus[] = ["draft", "in_review", "active", "disabled"];
const REVIEW_STATUSES: McpReviewStatus[] = ["unreviewed", "approved", "rejected"];
const RISK_LEVELS: McpRiskLevel[] = ["low", "medium", "high"];

export function parseServerStatus(value: unknown): McpServerStatus {
  return typeof value === "string" && (SERVER_STATUSES as string[]).includes(value)
    ? (value as McpServerStatus)
    : "draft";
}

export function parseVisibility(value: unknown): McpVisibility {
  return value === "external" ? "external" : "internal";
}

export function parseReviewStatus(value: unknown): McpReviewStatus {
  return typeof value === "string" && (REVIEW_STATUSES as string[]).includes(value)
    ? (value as McpReviewStatus)
    : "unreviewed";
}

export function parseRiskLevel(value: unknown): McpRiskLevel {
  return typeof value === "string" && (RISK_LEVELS as string[]).includes(value)
    ? (value as McpRiskLevel)
    : "medium";
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function parseJsonRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return asRecord(parsed);
    } catch {
      return null;
    }
  }
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return null;
}

/** نام معتبر ابزار/سرور طبق مشخصات MCP (حروف، عدد، _ . -). */
export function isValidMcpName(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_\-.]{0,127}$/.test(value);
}

export function isValidSlug(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,63}$/.test(value);
}

/**
 * سیاست مقادیر یک فراخوانی — ترتیب قدرت:
 * سقف (caps) > تحمیلِ بستن (paramOverrides) > ورودی مدل > پیش‌فرض ابزار (defaults).
 * سقف عددی یعنی مقدار هرگز از آن بالاتر نمی‌رود؛ سقف رشته‌ای/بولی یعنی دقیقاً همان مقدار تحمیل می‌شود.
 */
export function applyValuePolicy(
  tool: Pick<McpToolRecord, "defaults" | "caps">,
  overrides: Record<string, unknown>,
  args: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...tool.defaults, ...args, ...overrides };
  for (const [key, cap] of Object.entries(tool.caps)) {
    if (typeof cap === "number") {
      const current = out[key];
      if (typeof current === "number") out[key] = Math.min(current, cap);
      else if (current === undefined) out[key] = cap;
    } else if (cap !== undefined) {
      out[key] = cap;
    }
  }
  return out;
}

/** آیا این ابزار با این وضعیت‌ها حق اجرا/نمایش دارد؟ (قلب اعمال حکمرانی) */
export function isToolEffective(input: {
  serverStatus: McpServerStatus;
  serverVisibility: McpVisibility;
  toolEnabled: boolean;
  reviewStatus: McpReviewStatus;
  bindingEnabled: boolean | null;
  consumer: string;
}): boolean {
  if (input.serverStatus !== "active") return false;
  if (!input.toolEnabled) return false;
  if (input.reviewStatus !== "approved") return false;
  if (input.bindingEnabled === false) return false;
  // دیده‌شدن: مخاطب هرگز بیرونی نیست — حتی اگر اشتباهاً در بستن بیرونی نشسته باشد.
  if (input.consumer === "external_api" && input.serverVisibility !== "external") return false;
  return true;
}

/** نام عمومی ابزار در اندپوینت تجمیعی: ساده، مگر برخورد نامی که پیشوند سرور می‌گیرد. */
export function publicToolName(serverSlug: string, toolName: string, allNames: Map<string, number>): string {
  return (allNames.get(toolName) ?? 0) > 1 ? `${serverSlug}__${toolName}` : toolName;
}

// ---------- ویرایشگر ساختاری پارامترها (بدون JSON خام) ----------

export interface ParamRow {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultText: string;
  capText: string;
  enumText: string;
}

function scalarToText(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function textToScalar(text: string, type: string): unknown {
  const trimmed = text.trim();
  if (type === "number" || type === "integer") {
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : trimmed;
  }
  if (type === "boolean") return trimmed === "true";
  if (type === "object" || type === "array") {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

export function paramsFromSchema(
  schema: Record<string, unknown>,
  defaults: Record<string, unknown>,
  caps: Record<string, unknown>,
): ParamRow[] {
  const properties = asRecord(schema.properties);
  const required = Array.isArray(schema.required) ? (schema.required as string[]) : [];
  return Object.entries(properties).map(([name, raw]) => {
    const prop = asRecord(raw);
    const enumValues = Array.isArray(prop.enum) ? (prop.enum as unknown[]) : [];
    return {
      name,
      type: typeof prop.type === "string" ? prop.type : "string",
      description: typeof prop.description === "string" ? prop.description : "",
      required: required.includes(name),
      defaultText: scalarToText(defaults[name]),
      capText: scalarToText(caps[name]),
      enumText: enumValues.map((v) => scalarToText(v)).join(", "),
    };
  });
}

export function schemaFromParams(
  rows: ParamRow[],
  baseSchema: Record<string, unknown>,
  baseDefaults: Record<string, unknown>,
  baseCaps: Record<string, unknown>,
): { inputSchema: Record<string, unknown>; defaults: Record<string, unknown>; caps: Record<string, unknown> } {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  const defaults: Record<string, unknown> = { ...baseDefaults };
  const caps: Record<string, unknown> = { ...baseCaps };

  for (const row of rows) {
    const name = row.name.trim();
    if (!name) continue;
    const prop: Record<string, unknown> = { type: row.type };
    if (row.description.trim()) prop.description = row.description.trim();
    if (row.enumText.trim()) {
      prop.enum = row.enumText
        .split(",")
        .map((v) => textToScalar(v.trim(), row.type))
        .filter((v) => v !== "");
    }
    properties[name] = prop;
    if (row.required) required.push(name);
    if (row.defaultText.trim()) defaults[name] = textToScalar(row.defaultText, row.type);
    else delete defaults[name];
    if (row.capText.trim()) caps[name] = textToScalar(row.capText, row.type);
    else delete caps[name];
  }

  return {
    inputSchema: { ...baseSchema, type: "object", properties, required },
    defaults,
    caps,
  };
}
