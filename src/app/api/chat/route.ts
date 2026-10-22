import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/auth/session";
import { loadConversation, persistTurn } from "@/lib/chat-store";
import { runMcpChatTurn } from "@/lib/mcp/orchestrator";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get("conversationId");
    const conversationId = rawId ? Number(rawId) : NaN;
    if (!Number.isInteger(conversationId) || conversationId < 1) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    const conversation = await loadConversation(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Chat GET error:", error);
    return NextResponse.json({ error: "Failed to load conversation" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: string;
      query?: string;
      conversationId?: number;
    };

    const message = (body.message ?? body.query)?.trim();
    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    // حساب فقط از سشن سرور خوانده می‌شود؛ body کلاینت هیچ‌وقت شناسهٔ حساب نمی‌دهد.
    const account = await getCurrentAccount();
    const result = await runMcpChatTurn({
      message,
      conversationId: typeof body.conversationId === "number" ? body.conversationId : null,
      account,
    });
    const conversationId = await persistTurn({
      conversationId: typeof body.conversationId === "number" ? body.conversationId : null,
      userMessage: message,
      assistantAnswer: result.answer,
      references: result.references,
    });

    return NextResponse.json({
      answer: result.answer,
      references: result.references,
      related: result.related,
      conversationId,
      modeUsed: result.modeUsed,
      suggestedAnalyzer: result.suggestedAnalyzer,
      followUpQuestions: result.followUpQuestions,
    });
  } catch (error) {
    console.error("Chat POST error:", error);
    return NextResponse.json({ error: "Failed to retrieve answer" }, { status: 500 });
  }
}
