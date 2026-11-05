import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { listFinancePlans, saveFinancePlan } from "@/lib/finance/plan-store";
import { TariffError } from "@/lib/finance/tariffs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
function failure(error: unknown) {
  if (error instanceof TariffError) return NextResponse.json({ error: error.message }, { status: error.status, headers });
  // Financial configuration and database details must never be written to browser responses/logs.
  return NextResponse.json({ error: "finance_configuration_unavailable" }, { status: 503, headers });
}
export async function GET() {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  if (auth.account.id === 0) return NextResponse.json({ error: "preview_is_not_persistent" }, { status: 503, headers });
  try { return NextResponse.json({ plans: await listFinancePlans(auth.account.id) }, { headers }); }
  catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  if (auth.account.id === 0) return NextResponse.json({ error: "preview_is_not_persistent" }, { status: 503, headers });
  const origin = request.headers.get("origin"), type = request.headers.get("content-type")?.split(";")[0];
  // Strict same-origin JSON writes; no wildcard origin or trusted client-supplied actor.
  if (!origin || origin !== new URL(request.url).origin) return NextResponse.json({ error: "invalid_origin" }, { status: 403, headers });
  if (type !== "application/json") return NextResponse.json({ error: "json_required" }, { status: 415, headers });
  try {
    const declared = request.headers.get("content-length");
    if (declared && (!/^\d+$/.test(declared) || Number(declared) > 100000)) throw new TariffError("configuration_too_large", 413);
    // Bound actual bytes even when a Content-Length header is absent.
    const reader = request.body?.getReader();
    if (!reader) throw new TariffError("invalid_request");
    const chunks: Uint8Array[] = []; let total = 0;
    try {
      while (true) {
        const part = await reader.read(); if (part.done) break;
        total += part.value.byteLength;
        if (total > 100000) { await reader.cancel(); throw new TariffError("configuration_too_large", 413); }
        chunks.push(part.value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    let body;
    try { body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
    catch { throw new TariffError("invalid_json"); }
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some(key => !["expectedVersion","config"].includes(key))) throw new TariffError("invalid_request");
    const plan = await saveFinancePlan(auth.account.id, body.expectedVersion, body.config);
    return NextResponse.json({ plan }, { status: 201, headers });
  } catch (error) { return failure(error); }
}
