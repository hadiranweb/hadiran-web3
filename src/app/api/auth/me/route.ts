import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/auth/session";
import { ensureAccountProfileSchema } from "@/lib/auth/schema-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.DATABASE_URL) await ensureAccountProfileSchema();
  const account = await getCurrentAccount();
  return NextResponse.json({ account }, { headers: { "Cache-Control": "private, no-store" } });
}
