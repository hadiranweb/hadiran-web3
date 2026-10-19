import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { listPeople } from "@/lib/auth/people";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const people = await listPeople();
  return NextResponse.json({ people });
}
