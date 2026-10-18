import { NextResponse } from "next/server";
import { markWebhookHit, openWebhookSecret, readBotRowById } from "@/lib/bots/store";
import { secretsMatch } from "@/lib/bots/secret";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function updateKind(body: unknown): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const row = body as Record<string, unknown>;
  if (row.message) return "message";
  if (row.callback_query) return "callback_query";
  if (row.edited_message) return "edited_message";
  return "other";
}

export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const row = await readBotRowById(id);
  const expected = row ? openWebhookSecret(row) : null;
  const given = request.headers.get("x-telegram-bot-api-secret-token");
  if (!row || row.status === "disconnected" || !expected || !secretsMatch(given, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let kind: string | null = null;
  try {
    kind = updateKind(await request.json());
  } catch {
    kind = null;
  }

  await markWebhookHit(id, kind);
  // Analyzer conversation is not this cut — ACK only so Telegram does not retry.
  return NextResponse.json({ ok: true });
}
