import { NextResponse } from "next/server";
import { db } from "@/db";
import { knowledge, memoryItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { publicKnowledgeFilter } from "@/lib/knowledge/public";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select({ item: knowledge })
      .from(knowledge)
      .innerJoin(memoryItems, eq(knowledge.memoryItemId, memoryItems.id))
      .where(publicKnowledgeFilter);
    return NextResponse.json({ items: rows.map((row) => row.item) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  }
}

export async function POST() {
  return NextResponse.json(
    { error: "ثبت از /workspace است؛ این endpoint دیگر منبع دانش نیست." },
    { status: 409 }
  );
}
