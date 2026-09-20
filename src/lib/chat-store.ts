import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import type { ChatReferences } from "@/lib/ai";

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  references?: ChatReferences | null;
}

export async function persistTurn(input: {
  conversationId?: number | null;
  userMessage: string;
  assistantAnswer: string;
  references: ChatReferences;
}): Promise<number | null> {
  try {
    let conversationId = input.conversationId ?? null;

    if (conversationId) {
      const [existing] = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);
      if (!existing) conversationId = null;
    }

    if (!conversationId) {
      const title = input.userMessage.replace(/\s+/g, " ").trim().slice(0, 80);
      const [created] = await db
        .insert(conversations)
        .values({ title: title || "گفتگو" })
        .returning({ id: conversations.id });
      conversationId = created.id;
    } else {
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
    }

    await db.insert(messages).values([
      {
        conversationId,
        role: "user",
        content: input.userMessage,
      },
      {
        conversationId,
        role: "assistant",
        content: input.assistantAnswer,
        citations: input.references,
      },
    ]);

    return conversationId;
  } catch (error) {
    console.error("Failed to persist conversation:", error);
    return input.conversationId ?? null;
  }
}

export async function loadConversation(
  conversationId: number
): Promise<{ conversationId: number; title: string | null; messages: StoredMessage[] } | null> {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);
  if (!conversation) return null;

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  return {
    conversationId: conversation.id,
    title: conversation.title,
    messages: rows.map((row) => ({
      role: row.role === "assistant" ? "assistant" : "user",
      content: row.content,
      references: row.citations ?? null,
    })),
  };
}
