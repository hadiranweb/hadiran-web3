import { NextResponse } from "next/server";
import { handleTelegramUpdate } from "@/lib/bots/chat";
import { openSecret, secretsMatch } from "@/lib/bots/secret";
import { markBotLastError, markWebhookHit, openWebhookSecret, readBotRowById } from "@/lib/bots/store";

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
  if (!row || row.status === "disconnected") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const expected = openWebhookSecret(row);
  const given = request.headers.get("x-telegram-bot-api-secret-token");
  if (!expected || !secretsMatch(given, expected)) {
    await markBotLastError(
      row.id,
      given
        ? "وب‌هوک رسید؛ رمز هدر با مقدار ذخیره‌شده یکی نیست. دوباره «اتصال» بزنید."
        : "وب‌هوک رسید؛ هدر Secret-Token خالی است — لیارا یا لایهٔ جلو هدر را رد نکرده.",
    );
    await markWebhookHit(id, null, 401);
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  await markWebhookHit(id, updateKind(body), 200);
  if (row.status === "paused" || !row.tokenCipher) {
    return NextResponse.json({ ok: true });
  }

  try {
    const token = openSecret(row.tokenCipher);
    await handleTelegramUpdate({
      botId: row.id,
      analyzerSlug: row.analyzerSlug,
      token,
      update: body,
    });
  } catch {
    // ACK anyway so Telegram does not retry. Token is never logged.
  }

  return NextResponse.json({ ok: true });
}
