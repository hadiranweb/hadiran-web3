"use client";

import { useEffect, useState } from "react";
import { paramsFromSchema, schemaFromParams, type ParamRow } from "@/lib/mcp/service-types";
import type { ReactNode } from "react";

const SERVICE_TABS = [
  { id: "servers", label: "سرورها" },
  { id: "tools", label: "ابزارها و پارامترها" },
  { id: "library", label: "منابع و پرامپت‌ها" },
  { id: "bindings", label: "بستن‌های مصرف‌کننده" },
  { id: "watch", label: "امنیت و دیده‌بانی" },
] as const;

type ServerRec = {
  slug: string;
  name: string;
  titleFa: string | null;
  descriptionFa: string | null;
  kind: "builtin" | "remote";
  transport: string;
  baseUrl: string | null;
  protocolVersion: string;
  instructionsFa: string | null;
  visibility: "internal" | "external";
  status: string;
  capabilities: { tools: boolean; resources: boolean; prompts: boolean };
  authType: string;
  hasAuthToken: boolean;
  authTokenHint: string | null;
  healthStatus: string | null;
  healthError: string | null;
  healthAt: string | null;
};

type ToolRec = {
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
  riskLevel: string;
  reviewStatus: string;
  requiresConfirmation: boolean;
  timeoutMs: number;
  sortOrder: number;
};

type AssetRec = { id: number; serverSlug: string; enabled: boolean };
type ResourceRec = AssetRec & { uriTemplate: string; nameFa: string | null; descriptionFa: string | null; mimeType: string };
type PromptRec = AssetRec & { name: string; titleFa: string | null; descriptionFa: string | null; templateFa: string | null; arguments: unknown[] };
type BindingRec = { consumer: string; labelFa: string; enabled: boolean; hasToken: boolean; tokenHint: string | null };
type CallRec = { id: number; serverSlug: string | null; toolName: string; consumer: string; ok: boolean; error: string | null; durationMs: number | null; createdAt: string };

const inputCls = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";
const labelCls = "block text-xs text-slate-500 mb-1";
const btnCls = "rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60";
const ghostCls = "rounded-xl border border-slate-200 px-3 py-1.5 text-xs";

const STATUS_FA: Record<string, string> = { draft: "پیش‌نویس", in_review: "در بازبینی", active: "فعال", disabled: "خاموش" };
const REVIEW_FA: Record<string, string> = { unreviewed: "بازبینی‌نشده", approved: "تأییدشده", rejected: "ردشده" };

function jsonText(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

function parseJson(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}

export function McpServiceDesk({ children }: { children?: ReactNode }) {
  const [tab, setTab] = useState<string>("servers");
  const [servers, setServers] = useState<ServerRec[]>([]);
  const [tools, setTools] = useState<ToolRec[]>([]);
  const [resources, setResources] = useState<ResourceRec[]>([]);
  const [prompts, setPrompts] = useState<PromptRec[]>([]);
  const [bindings, setBindings] = useState<BindingRec[]>([]);
  const [bindingTools, setBindingTools] = useState<Record<string, { toolId: number; enabled: boolean; paramOverrides: Record<string, unknown> }[]>>({});
  const [calls, setCalls] = useState<CallRec[]>([]);
  const [security, setSecurity] = useState({ unreviewed: 0, rejected: 0, highRiskApproved: 0 });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openServer, setOpenServer] = useState<string | null>(null);
  const [openTool, setOpenTool] = useState<number | null>(null);
  const [serverDraft, setServerDraft] = useState<ServerRec | null>(null);
  const [serverToken, setServerToken] = useState("");
  const [newServer, setNewServer] = useState({ slug: "", name: "", kind: "remote", transport: "streamable-http", baseUrl: "" });
  const [toolDraft, setToolDraft] = useState<ToolRec | null>(null);
  const [toolJson, setToolJson] = useState({ inputSchema: "", outputSchema: "", defaults: "", caps: "", annotations: "" });
  const [bindingConsumer, setBindingConsumer] = useState("home_chat");
  const [bindingToken, setBindingToken] = useState("");
  const [paramRows, setParamRows] = useState<ParamRow[]>([]);
  const [overrideText, setOverrideText] = useState<Record<number, string>>({});
  const [testArgs, setTestArgs] = useState("{}");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testToolKey, setTestToolKey] = useState("");

  async function load() {
    const res = await fetch("/api/workspace/mcp/servers", { cache: "no-store" });
    const data = (await res.json()) as {
      servers?: ServerRec[]; tools?: ToolRec[]; resources?: ResourceRec[]; prompts?: PromptRec[];
      bindings?: BindingRec[]; bindingTools?: typeof bindingTools; calls?: CallRec[];
      security?: typeof security; error?: string;
    };
    if (!res.ok) {
      setError(data.error ?? "بارگذاری سرویس ناموفق بود؛ شاید مایگریشن 0033 هنوز اجرا نشده است.");
      return;
    }
    setServers(data.servers ?? []);
    setTools(data.tools ?? []);
    setResources(data.resources ?? []);
    setPrompts(data.prompts ?? []);
    setBindings(data.bindings ?? []);
    setBindingTools(data.bindingTools ?? {});
    setCalls(data.calls ?? []);
    if (data.security) setSecurity(data.security);
  }

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps --
     بارگذاری اولیه بعد از mount؛ load پس از await ست می‌کند و وابستگی لازم نیست. */
  useEffect(() => {
    void load();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  async function saveServer() {
    if (!serverDraft) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/workspace/mcp/servers/${encodeURIComponent(serverDraft.slug)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...serverDraft, authToken: serverToken || undefined }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "ذخیرهٔ سرور ناموفق بود.");
    setServerToken("");
    setNotice("سرور ذخیره شد.");
    await load();
  }

  async function createServer() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/workspace/mcp/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newServer),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "ساخت سرور ناموفق بود.");
    setNewServer({ slug: "", name: "", kind: "remote", transport: "streamable-http", baseUrl: "" });
    setNotice("سرور ساخته شد؛ حالا ابزارهایش را کشف یا تعریف و بازبینی کن.");
    await load();
  }

  async function serverAction(slug: string, action: "health" | "sync") {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/workspace/mcp/servers/${encodeURIComponent(slug)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = (await res.json()) as { error?: string; count?: number };
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "کنش ناموفق بود.");
    setNotice(action === "sync" ? `${(data.count ?? 0).toLocaleString("fa-IR")} ابزار کشف شد؛ تازه‌ها بازبینی‌نشده‌اند.` : "سلامت بررسی شد.");
    await load();
  }

  async function removeServer(slug: string) {
    await fetch(`/api/workspace/mcp/servers/${encodeURIComponent(slug)}`, { method: "DELETE" });
    await load();
  }

  function editTool(tool: ToolRec) {
    setOpenTool(tool.id);
    setToolDraft({ ...tool });
    setParamRows(paramsFromSchema(tool.inputSchema, tool.defaults, tool.caps));
    setToolJson({
      inputSchema: jsonText(tool.inputSchema),
      outputSchema: jsonText(tool.outputSchema ?? {}),
      defaults: jsonText(tool.defaults),
      caps: jsonText(tool.caps),
      annotations: jsonText(tool.annotations),
    });
  }

  async function saveTool() {
    if (!toolDraft) return;
    const inputSchema = parseJson(toolJson.inputSchema);
    const defaults = parseJson(toolJson.defaults);
    const caps = parseJson(toolJson.caps);
    const annotations = parseJson(toolJson.annotations);
    const outputSchema = parseJson(toolJson.outputSchema);
    if (!inputSchema || !defaults || !caps || !annotations) {
      setError("یکی از JSONها نامعتبر است.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/workspace/mcp/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...toolDraft,
        inputSchema,
        defaults,
        caps,
        annotations,
        outputSchema: Object.keys(outputSchema ?? {}).length ? outputSchema : null,
      }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "ذخیرهٔ ابزار ناموفق بود.");
    setNotice("ابزار ذخیره شد.");
    await load();
  }

  async function quickTool(tool: ToolRec, part: Partial<ToolRec>) {
    await fetch("/api/workspace/mcp/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...tool, ...part }),
    });
    await load();
  }

  async function toggleAsset(kind: "resource" | "prompt", id: number, enabled: boolean) {
    await fetch("/api/workspace/mcp/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetKind: kind, assetId: id, assetEnabled: enabled }),
    });
    await load();
  }

  async function saveBinding(part: { enabled?: boolean; token?: string; clearToken?: boolean }) {
    setBusy(true);
    const res = await fetch("/api/workspace/mcp/bindings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consumer: bindingConsumer, ...part }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      return setError(data.error ?? "ذخیرهٔ بستن ناموفق بود.");
    }
    setBindingToken("");
    setNotice("بستن ذخیره شد.");
    await load();
  }

  async function setBindingTool(toolId: number, enabled: boolean, paramOverrides?: Record<string, unknown>) {
    await fetch("/api/workspace/mcp/bindings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consumer: bindingConsumer, toolId, enabled, paramOverrides: paramOverrides ?? {} }),
    });
    await load();
  }

  async function runTest() {
    const [serverSlug, toolName] = testToolKey.split("/");
    if (!serverSlug || !toolName) return;
    const args = parseJson(testArgs);
    if (!args) return setError("JSON آرگومان‌های تست نامعتبر است.");
    setBusy(true);
    setTestResult(null);
    const res = await fetch("/api/workspace/mcp/test-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serverSlug, toolName, args }),
    });
    const data = (await res.json()) as { ok?: boolean; ms?: number; result?: unknown; error?: string };
    setBusy(false);
    setTestResult(
      data.ok
        ? `موفق — ${(data.ms ?? 0).toLocaleString("fa-IR")}ms\n${JSON.stringify(data.result, null, 2)}`
        : `خطا — ${data.error ?? "نامشخص"}`,
    );
    await load();
  }

  const activeServers = servers.filter((s) => s.status === "active").length;
  const binding = bindings.find((b) => b.consumer === bindingConsumer) ?? null;
  const boundIds = new Map((bindingTools[bindingConsumer] ?? []).map((b) => [b.toolId, b]));

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-700">{error}</p>}
      {notice && <p className="text-sm text-emerald-700">{notice}</p>}

      {/* ناوبری زبانه‌ای سرویس MCP؛ زبانهٔ آخر مصرف‌کنندهٔ چت خانه است، جدا از سرویس */}
      <div className="flex flex-wrap items-center gap-2">
        {SERVICE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? "rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                : "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            }
          >
            {t.label}
          </button>
        ))}
        <span className="mx-1 hidden h-6 w-px bg-slate-300 sm:block" aria-hidden />
        <button
          type="button"
          onClick={() => setTab("chat")}
          className={
            tab === "chat"
              ? "rounded-full bg-amber-600 px-4 py-2 text-sm font-bold text-white"
              : "rounded-full border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 hover:bg-amber-100"
          }
        >
          مصرف‌کنندهٔ چت خانه
        </button>
      </div>

      {/* وضعیت سرویس + صف امنیت */}
      {tab === "servers" && (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "سرورها", value: `${servers.length.toLocaleString("fa-IR")} سرور — ${activeServers.toLocaleString("fa-IR")} فعال` },
          { label: "ابزارها", value: `${tools.length.toLocaleString("fa-IR")} ابزار — ${tools.filter((t) => t.reviewStatus === "approved").length.toLocaleString("fa-IR")} تأییدشده` },
          { label: "صف بازبینی امنیتی", value: `${security.unreviewed.toLocaleString("fa-IR")} بازبینی‌نشده — ${security.highRiskApproved.toLocaleString("fa-IR")} پرریسکِ تأییدشده` },
          { label: "بستن‌ها", value: `${bindings.filter((b) => b.enabled).length.toLocaleString("fa-IR")} روشن از ${bindings.length.toLocaleString("fa-IR")}` },
        ].map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">{tile.label}</div>
            <div className="mt-1 text-sm font-bold text-slate-900">{tile.value}</div>
          </div>
        ))}
      </div>
      )}
      {(tab === "servers" || tab === "watch") && (
      <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs leading-6 text-amber-800">
        قاعدهٔ امنیتی: ابزار فقط وقتی جایی اجرا می‌شود که سرورش «فعال»، خودش «روشن و تأییدشده» و در بستن آن
        مصرف‌کننده نشسته باشد. ابزار کشف‌شده از سرور راه‌دور بازبینی‌نشده می‌ماند تا تو تأییدش کنی.
        نشانه‌های رفتاری (annotations) اعلام خود سرورند و نامطمئن شمرده می‌شوند؛ سطح ریسک نهایی را بازبینی تو تعیین می‌کند.
      </p>
      )}

      {/* سرورها */}
      {tab === "servers" && (
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-bold text-slate-900">سرورهای MCP (رجیستری)</h2>
        <ul className="space-y-2">
          {servers.map((server) => (
            <li key={server.slug} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <b>{server.titleFa ?? server.name}</b>{" "}
                  <span dir="ltr" className="text-slate-500">{server.slug}</span> — {STATUS_FA[server.status] ?? server.status} /{" "}
                  {server.visibility === "external" ? "بیرونی" : "داخلی"} / {server.kind === "remote" ? "راه‌دور" : "داخلی"} /{" "}
                  سلامت: {server.healthStatus ?? "نامشخص"}
                  {server.healthError ? <span className="text-red-600"> ({server.healthError})</span> : null}
                </span>
                <span className="flex gap-2">
                  <button type="button" className={ghostCls} disabled={busy} onClick={() => void serverAction(server.slug, "health")}>سلامت</button>
                  {server.kind === "remote" && (
                    <button type="button" className={ghostCls} disabled={busy} onClick={() => void serverAction(server.slug, "sync")}>کشف ابزارها</button>
                  )}
                  <button
                    type="button"
                    className={ghostCls}
                    onClick={() => {
                      setOpenServer(openServer === server.slug ? null : server.slug);
                      setServerDraft({ ...server });
                    }}
                  >
                    {openServer === server.slug ? "بستن" : "تنظیمات"}
                  </button>
                  <button type="button" className={`${ghostCls} text-red-700`} onClick={() => void removeServer(server.slug)}>حذف</button>
                </span>
              </div>
              {openServer === server.slug && serverDraft && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div><label className={labelCls}>نام فنی (name)</label><input dir="ltr" className={inputCls} value={serverDraft.name} onChange={(e) => setServerDraft({ ...serverDraft, name: e.target.value })} /></div>
                  <div><label className={labelCls}>عنوان فارسی</label><input className={inputCls} value={serverDraft.titleFa ?? ""} onChange={(e) => setServerDraft({ ...serverDraft, titleFa: e.target.value || null })} /></div>
                  <div><label className={labelCls}>وضعیت</label>
                    <select className={inputCls} value={serverDraft.status} onChange={(e) => setServerDraft({ ...serverDraft, status: e.target.value })}>
                      <option value="draft">پیش‌نویس</option><option value="in_review">در بازبینی</option><option value="active">فعال</option><option value="disabled">خاموش</option>
                    </select></div>
                  <div><label className={labelCls}>دیده‌شدن</label>
                    <select className={inputCls} value={serverDraft.visibility} onChange={(e) => setServerDraft({ ...serverDraft, visibility: e.target.value as ServerRec["visibility"] })}>
                      <option value="internal">فقط داخلی</option><option value="external">بیرونی هم منتشر شود</option>
                    </select></div>
                  <div><label className={labelCls}>نوع</label>
                    <select className={inputCls} value={serverDraft.kind} onChange={(e) => setServerDraft({ ...serverDraft, kind: e.target.value as ServerRec["kind"] })}>
                      <option value="builtin">داخلی (in-process)</option><option value="remote">راه‌دور</option>
                    </select></div>
                  <div><label className={labelCls}>انتقال و نسخهٔ پروتکل</label>
                    <div className="flex gap-2">
                      <input dir="ltr" className={inputCls} value={serverDraft.transport} onChange={(e) => setServerDraft({ ...serverDraft, transport: e.target.value })} />
                      <input dir="ltr" className={inputCls} value={serverDraft.protocolVersion} onChange={(e) => setServerDraft({ ...serverDraft, protocolVersion: e.target.value })} />
                    </div></div>
                  <div className="sm:col-span-2"><label className={labelCls}>نشانی پایه (سرور راه‌دور)</label><input dir="ltr" className={inputCls} value={serverDraft.baseUrl ?? ""} onChange={(e) => setServerDraft({ ...serverDraft, baseUrl: e.target.value || null })} /></div>
                  <div><label className={labelCls}>احراز</label>
                    <select className={inputCls} value={serverDraft.authType} onChange={(e) => setServerDraft({ ...serverDraft, authType: e.target.value })}>
                      <option value="none">بدون احراز</option><option value="bearer">Bearer توکن</option>
                    </select></div>
                  <div><label className={labelCls}>توکن سرور {serverDraft.hasAuthToken ? `(ذخیره‌شده: ${serverDraft.authTokenHint ?? "••••"})` : ""}</label>
                    <input dir="ltr" type="password" className={inputCls} value={serverToken} placeholder="فقط برای تغییر" onChange={(e) => setServerToken(e.target.value)} /></div>
                  <div className="sm:col-span-2"><label className={labelCls}>توضیح</label><textarea rows={2} className={inputCls} value={serverDraft.descriptionFa ?? ""} onChange={(e) => setServerDraft({ ...serverDraft, descriptionFa: e.target.value || null })} /></div>
                  <div className="sm:col-span-2"><label className={labelCls}>دستور سرور برای هاست (instructions)</label><textarea rows={2} className={inputCls} value={serverDraft.instructionsFa ?? ""} onChange={(e) => setServerDraft({ ...serverDraft, instructionsFa: e.target.value || null })} /></div>
                  <div className="sm:col-span-2">
                    <button type="button" className={btnCls} disabled={busy} onClick={() => void saveServer()}>ذخیرهٔ سرور</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        <div className="grid gap-2 sm:grid-cols-5">
          <input dir="ltr" className={inputCls} placeholder="slug" value={newServer.slug} onChange={(e) => setNewServer({ ...newServer, slug: e.target.value })} />
          <input dir="ltr" className={inputCls} placeholder="name" value={newServer.name} onChange={(e) => setNewServer({ ...newServer, name: e.target.value })} />
          <select className={inputCls} value={newServer.kind} onChange={(e) => setNewServer({ ...newServer, kind: e.target.value })}>
            <option value="remote">راه‌دور</option><option value="builtin">داخلی</option>
          </select>
          <input dir="ltr" className={inputCls} placeholder="https://…/mcp" value={newServer.baseUrl} onChange={(e) => setNewServer({ ...newServer, baseUrl: e.target.value })} />
          <button type="button" className={btnCls} disabled={busy || !newServer.slug} onClick={() => void createServer()}>ساخت سرور</button>
        </div>
      </section>
      )}

      {/* ابزارها */}
      {(tab === "tools" || tab === "library" || tab === "watch") && (
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-bold text-slate-900">{tab === "tools" ? "ابزارها و پارامترها" : tab === "library" ? "منابع و پرامپت‌ها" : "امنیت و تست ابزار"}</h2>
        {tab === "tools" && (<>
        {servers.map((server) => (
          <div key={server.slug} className="space-y-2">
            <h3 className="text-sm font-bold text-slate-700">{server.titleFa ?? server.name} <span dir="ltr" className="text-slate-400">({server.slug})</span></h3>
            {tools.filter((t) => t.serverSlug === server.slug).map((tool) => {
              const props = (tool.inputSchema?.properties as Record<string, { type?: string }> | undefined) ?? {};
              const required = Array.isArray(tool.inputSchema?.required) ? (tool.inputSchema.required as string[]) : [];
              const effective = server.status === "active" && tool.enabled && tool.reviewStatus === "approved";
              return (
                <div key={tool.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <b dir="ltr">{tool.name}</b> — {tool.titleFa ?? ""}{" "}
                      <span className={effective ? "text-emerald-600" : "text-slate-400"}>{effective ? "مؤثر" : "غیرمؤثر"}</span>
                      <span className="text-slate-500"> / {REVIEW_FA[tool.reviewStatus] ?? tool.reviewStatus} / ریسک {tool.riskLevel} / {tool.origin}</span>
                    </span>
                    <span className="flex gap-2">
                      <button type="button" className={ghostCls} onClick={() => void quickTool(tool, { enabled: !tool.enabled })}>{tool.enabled ? "خاموش" : "روشن"}</button>
                      <select className="rounded-xl border border-slate-200 px-2 py-1 text-xs" value={tool.reviewStatus} onChange={(e) => void quickTool(tool, { reviewStatus: e.target.value })}>
                        <option value="unreviewed">بازبینی‌نشده</option><option value="approved">تأیید</option><option value="rejected">رد</option>
                      </select>
                      <button type="button" className={ghostCls} onClick={() => (openTool === tool.id ? setOpenTool(null) : editTool(tool))}>پارامتر و مقدار</button>
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    پارامترها: {Object.entries(props).map(([k, v]) => `${k} (${v.type ?? "?"}${required.includes(k) ? "، اجباری" : ""})`).join(" · ") || "ندارد"}
                  </div>
                  {openTool === tool.id && toolDraft && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div><label className={labelCls}>عنوان</label><input className={inputCls} value={toolDraft.titleFa ?? ""} onChange={(e) => setToolDraft({ ...toolDraft, titleFa: e.target.value || null })} /></div>
                      <div><label className={labelCls}>سطح ریسک (حکمرانی)</label>
                        <select className={inputCls} value={toolDraft.riskLevel} onChange={(e) => setToolDraft({ ...toolDraft, riskLevel: e.target.value })}>
                          <option value="low">کم</option><option value="medium">متوسط</option><option value="high">بالا</option>
                        </select></div>
                      <div className="sm:col-span-2"><label className={labelCls}>توضیح (همان که مدل می‌خواند)</label><textarea rows={2} className={inputCls} value={toolDraft.descriptionFa ?? ""} onChange={(e) => setToolDraft({ ...toolDraft, descriptionFa: e.target.value || null })} /></div>
                      <div className="sm:col-span-2 space-y-2">
                        <label className={labelCls}>پارامترها (ساختاری — بدون JSON): نام، نوع، اجباری، پیش‌فرض، سقف/تحمیل، مقادیر مجاز</label>
                        {paramRows.map((row, idx) => (
                          <div key={idx} className="grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2 sm:grid-cols-8">
                            <input dir="ltr" className={inputCls} placeholder="name" value={row.name} onChange={(e) => setParamRows(paramRows.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r)))} />
                            <select className={inputCls} value={row.type} onChange={(e) => setParamRows(paramRows.map((r, i) => (i === idx ? { ...r, type: e.target.value } : r)))}>
                              <option value="string">string</option><option value="number">number</option><option value="integer">integer</option><option value="boolean">boolean</option><option value="object">object</option><option value="array">array</option>
                            </select>
                            <input className={inputCls + " sm:col-span-2"} placeholder="توضیح برای مدل" value={row.description} onChange={(e) => setParamRows(paramRows.map((r, i) => (i === idx ? { ...r, description: e.target.value } : r)))} />
                            <input dir="ltr" className={inputCls} placeholder="پیش‌فرض" value={row.defaultText} onChange={(e) => setParamRows(paramRows.map((r, i) => (i === idx ? { ...r, defaultText: e.target.value } : r)))} />
                            <input dir="ltr" className={inputCls} placeholder="سقف/تحمیل" value={row.capText} onChange={(e) => setParamRows(paramRows.map((r, i) => (i === idx ? { ...r, capText: e.target.value } : r)))} />
                            <input dir="ltr" className={inputCls} placeholder="enum: a, b" value={row.enumText} onChange={(e) => setParamRows(paramRows.map((r, i) => (i === idx ? { ...r, enumText: e.target.value } : r)))} />
                            <span className="flex items-center gap-2">
                              <label className="flex items-center gap-1 text-xs">
                                <input type="checkbox" checked={row.required} onChange={(e) => setParamRows(paramRows.map((r, i) => (i === idx ? { ...r, required: e.target.checked } : r)))} />
                                اجباری
                              </label>
                              <button type="button" className="text-xs text-red-700" onClick={() => setParamRows(paramRows.filter((_, i) => i !== idx))}>حذف</button>
                            </span>
                          </div>
                        ))}
                        <button
                          type="button"
                          className={ghostCls}
                          onClick={() => setParamRows([...paramRows, { name: "", type: "string", description: "", required: false, defaultText: "", capText: "", enumText: "" }])}
                        >
                          + پارامتر تازه
                        </button>
                      </div>
                      <div><label className={labelCls}>اسکیمای ورودی (JSON پیشرفته — با پارامترهای بالا بازسازی می‌شود)</label><textarea dir="ltr" rows={7} className={inputCls} value={toolJson.inputSchema} onChange={(e) => setToolJson({ ...toolJson, inputSchema: e.target.value })} /></div>
                      <div><label className={labelCls}>اسکیمای خروجی</label><textarea dir="ltr" rows={7} className={inputCls} value={toolJson.outputSchema} onChange={(e) => setToolJson({ ...toolJson, outputSchema: e.target.value })} /></div>
                      <div><label className={labelCls}>مقادیر پیش‌فرض (defaults)</label><textarea dir="ltr" rows={4} className={inputCls} value={toolJson.defaults} onChange={(e) => setToolJson({ ...toolJson, defaults: e.target.value })} /></div>
                      <div><label className={labelCls}>سقف و تحمیل (caps) — عدد یعنی حد بالا، غیرعدد یعنی تحمیلی</label><textarea dir="ltr" rows={4} className={inputCls} value={toolJson.caps} onChange={(e) => setToolJson({ ...toolJson, caps: e.target.value })} /></div>
                      <div className="sm:col-span-2"><label className={labelCls}>نشانه‌ها (annotations) — اعلام سرور، نامطمئن</label><textarea dir="ltr" rows={3} className={inputCls} value={toolJson.annotations} onChange={(e) => setToolJson({ ...toolJson, annotations: e.target.value })} /></div>
                      <div><label className={labelCls}>تایم‌اوت (ms)</label><input dir="ltr" type="number" className={inputCls} value={toolDraft.timeoutMs} onChange={(e) => setToolDraft({ ...toolDraft, timeoutMs: Number(e.target.value) })} /></div>
                      <label className="flex items-end gap-2 pb-2 text-sm">
                        <input type="checkbox" checked={toolDraft.requiresConfirmation} onChange={(e) => setToolDraft({ ...toolDraft, requiresConfirmation: e.target.checked })} />
                        نیازمند تأیید انسانی (مسیر بیرونی رد می‌شود)
                      </label>
                      <div className="sm:col-span-2 flex gap-2">
                        <button type="button" className={btnCls} disabled={busy} onClick={() => void saveTool()}>ذخیرهٔ ابزار</button>
                        <button type="button" className={`${ghostCls} text-red-700`} onClick={() => void fetch(`/api/workspace/mcp/tools?id=${tool.id}`, { method: "DELETE" }).then(() => load())}>حذف ابزار</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        </>)}

        {/* منابع و پرامپت‌ها */}
        {tab === "library" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-bold text-slate-700">منابع</h3>
            {resources.map((r) => (
              <div key={r.id} className="mb-1 flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs">
                <span dir="ltr">{r.uriTemplate}</span>
                <button type="button" className={ghostCls} onClick={() => void toggleAsset("resource", r.id, !r.enabled)}>{r.enabled ? "روشن" : "خاموش"}</button>
              </div>
            ))}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-bold text-slate-700">پرامپت‌ها</h3>
            {prompts.map((p) => (
              <div key={p.id} className="mb-1 flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs">
                <span dir="ltr">{p.name}</span>
                <button type="button" className={ghostCls} onClick={() => void toggleAsset("prompt", p.id, !p.enabled)}>{p.enabled ? "روشن" : "خاموش"}</button>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* تست ابزار */}
        {tab === "watch" && (
        <div className="rounded-xl border border-slate-200 p-3">
          <h3 className="mb-2 text-sm font-bold text-slate-700">تست زندهٔ ابزار (ابزار امنیتی/بازبینی)</h3>
          <div className="flex flex-wrap gap-2">
            <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={testToolKey} onChange={(e) => setTestToolKey(e.target.value)}>
              <option value="">انتخاب ابزار…</option>
              {tools.map((t) => (
                <option key={t.id} value={`${t.serverSlug}/${t.name}`}>{t.serverSlug}/{t.name}</option>
              ))}
            </select>
            <input dir="ltr" className="min-w-52 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" value={testArgs} onChange={(e) => setTestArgs(e.target.value)} />
            <button type="button" className={btnCls} disabled={busy || !testToolKey} onClick={() => void runTest()}>اجرا</button>
          </div>
          {testResult && <pre dir="ltr" className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-left text-xs">{testResult}</pre>}
        </div>
        )}
      </section>
      )}

      {/* بستن‌ها */}
      {tab === "bindings" && (
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-bold text-slate-900">بستن‌های مصرف‌کننده (سرور مجازی هر مصرف‌کننده)</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select className={inputCls + " max-w-64"} value={bindingConsumer} onChange={(e) => setBindingConsumer(e.target.value)}>
            {bindings.map((b) => (
              <option key={b.consumer} value={b.consumer}>{b.labelFa} ({b.consumer})</option>
            ))}
          </select>
          {binding && (
            <>
              <button type="button" className={ghostCls} onClick={() => void saveBinding({ enabled: !binding.enabled })}>
                {binding.enabled ? "بستن روشن است — خاموش کن" : "بستن خاموش است — روشن کن"}
              </button>
              <input dir="ltr" type="password" className="max-w-64 rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder={binding.hasToken ? `توکن ذخیره‌شده: ${binding.tokenHint ?? "••••"}` : "توکن این بستن"} value={bindingToken} onChange={(e) => setBindingToken(e.target.value)} />
              <button type="button" className={ghostCls} disabled={!bindingToken} onClick={() => void saveBinding({ token: bindingToken })}>ذخیرهٔ توکن</button>
              {binding.hasToken && <button type="button" className={ghostCls} onClick={() => void saveBinding({ clearToken: true })}>حذف توکن</button>}
            </>
          )}
        </div>
        <div className="space-y-1">
          {tools.map((tool) => {
            const bound = boundIds.get(tool.id);
            return (
              <div key={tool.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span dir="ltr">{tool.serverSlug}/{tool.name}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(bound?.enabled)}
                    onChange={(e) => void setBindingTool(tool.id, e.target.checked, bound?.paramOverrides ?? {})}
                  />
                </div>
                {bound?.enabled && (
                  <div className="mt-2 flex gap-2">
                    <input
                      dir="ltr"
                      className={inputCls}
                      placeholder='تحمیل مقادیر این بستن (JSON) — مثال: {"limit":2}'
                      value={overrideText[tool.id] ?? jsonText(bound.paramOverrides)}
                      onChange={(e) => setOverrideText({ ...overrideText, [tool.id]: e.target.value })}
                    />
                    <button
                      type="button"
                      className={ghostCls + " shrink-0"}
                      onClick={() => {
                        const parsed = parseJson(overrideText[tool.id] ?? "{}");
                        if (!parsed) return setError("JSON تحمیل مقادیر نامعتبر است.");
                        void setBindingTool(tool.id, true, parsed);
                      }}
                    >
                      ثبت تحمیل
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs leading-6 text-slate-500">
          ابزار فقط وقتی در این بستن است که این‌جا نشسته و روشن باشد؛ بیرونی علاوه بر این، دیده‌شدن «بیرونی» سرور را هم می‌خواهد.
        </p>
      </section>
      )}

      {/* حسابرسی */}
      {tab === "watch" && (
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-bold text-slate-900">دیده‌بانی: آخرین فراخوانی‌ها</h2>
        {calls.length === 0 && <p className="text-sm text-slate-500">هنوز فراخوانی ثبت نشده است.</p>}
        <ul className="space-y-1 text-xs">
          {calls.map((call) => (
            <li key={call.id} className="flex flex-wrap justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2">
              <span dir="ltr">{call.serverSlug ?? "—"}/{call.toolName}</span>
              <span>{call.consumer} — {call.ok ? "موفق" : `خطا: ${call.error ?? ""}`} — {(call.durationMs ?? 0).toLocaleString("fa-IR")}ms — {new Date(call.createdAt).toLocaleString("fa-IR")}</span>
            </li>
          ))}
        </ul>
      </section>
      )}

      {tab === "chat" && children}
    </div>
  );
}
