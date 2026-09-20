import { NextResponse } from "next/server";
import { retrieveForQuery } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { query?: string; message?: string };
    const query = (body.query ?? body.message)?.trim();
    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const response = await retrieveForQuery(query);
    return NextResponse.json(response);
  } catch (error) {
    console.error("AI route error:", error);
    return NextResponse.json({ error: "Failed to retrieve answer" }, { status: 500 });
  }
}
