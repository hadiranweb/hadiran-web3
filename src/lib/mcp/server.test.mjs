/**
 * اندپوینت استاندارد MCP: هندشیک، فهرست ابزار و فراخوانی Fail-soft بدون دیتابیس.
 * اجرا: npx tsx --test src/lib/mcp/server.test.mjs
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { handleMcpRequest, MCP_PROTOCOL_VERSION } from "./server.ts";

test("initialize نسخهٔ پشتیبانی‌شده را همان برمی‌گرداند و ناشناخته را به نسخهٔ ما مذاکره می‌کند", async () => {
  const known = await handleMcpRequest({
    jsonrpc: "2.0", id: 1, method: "initialize",
    params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } },
  });
  assert.equal(known.body.result.protocolVersion, "2025-06-18");
  assert.equal(known.body.result.serverInfo.name, "hadiran-mcp");

  const unknown = await handleMcpRequest({
    jsonrpc: "2.0", id: 2, method: "initialize", params: { protocolVersion: "1999-01-01" },
  });
  assert.equal(unknown.body.result.protocolVersion, MCP_PROTOCOL_VERSION);
});

test("tools/list هر چهار ابزار را با inputSchema می‌دهد", async () => {
  const out = await handleMcpRequest({ jsonrpc: "2.0", id: 3, method: "tools/list" });
  const names = out.body.result.tools.map((t) => t.name);
  assert.deepEqual(names, ["search_knowledge", "search_ecosystem", "resolve_topic_graph", "get_audience_context"]);
  for (const tool of out.body.result.tools) assert.equal(tool.inputSchema.type, "object");
});

test("بدون دیتابیس، tools/call خطا نمی‌دهد و نتیجهٔ خالی ساختاریافته برمی‌گردد", async () => {
  const out = await handleMcpRequest({
    jsonrpc: "2.0", id: 4, method: "tools/call",
    params: { name: "search_knowledge", arguments: { query: "فروش" } },
  });
  assert.equal(out.status, 200);
  assert.deepEqual(out.body.result.structuredContent, { items: [] });
});

test("get_audience_context در مسیر بیرونی همیشه مهمان است", async () => {
  const out = await handleMcpRequest({
    jsonrpc: "2.0", id: 5, method: "tools/call",
    params: { name: "get_audience_context", arguments: { accountId: 42 } },
  });
  const ctx = out.body.result.structuredContent;
  assert.equal(ctx.isGuest, true);
  assert.equal(ctx.mirror, null);
  assert.deepEqual(ctx.history, []);
});

test("متد ناشناخته -32601 و ابزار ناشناخته -32602 می‌دهد؛ نوتیفیکیشن 202 است", async () => {
  const bad = await handleMcpRequest({ jsonrpc: "2.0", id: 6, method: "nope/nope" });
  assert.equal(bad.body.error.code, -32601);
  const badTool = await handleMcpRequest({
    jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "rm_rf", arguments: {} },
  });
  assert.equal(badTool.body.error.code, -32602);
  const note = await handleMcpRequest({ jsonrpc: "2.0", method: "notifications/initialized" });
  assert.equal(note.status, 202);
  assert.equal(note.body, null);
});

test("resources/list نقشهٔ جهان‌ها را دارد و prompts/list دو پرامپت دوحالته را", async () => {
  const res = await handleMcpRequest({ jsonrpc: "2.0", id: 8, method: "resources/list" });
  assert.ok(res.body.result.resources.some((r) => r.uri === "hadiran://ontology/worlds"));
  const prompts = await handleMcpRequest({ jsonrpc: "2.0", id: 9, method: "prompts/list" });
  assert.deepEqual(
    prompts.body.result.prompts.map((p) => p.name),
    ["local_answer_template", "llm_system_prompt"],
  );
  const read = await handleMcpRequest({
    jsonrpc: "2.0", id: 10, method: "resources/read", params: { uri: "hadiran://ontology/worlds" },
  });
  const worlds = JSON.parse(read.body.result.contents[0].text).worlds;
  assert.ok(worlds.some((w) => w.path === "/knowledge"));
  const missing = await handleMcpRequest({
    jsonrpc: "2.0", id: 11, method: "resources/read", params: { uri: "hadiran://knowledge/nope" },
  });
  assert.equal(missing.body.error.code, -32002);
});
