import { NextResponse } from "next/server";
import { loadPublicGarden } from "@/lib/garden/public";
export const dynamic = "force-dynamic";
export async function GET() {
  const snapshot = await loadPublicGarden();
  return NextResponse.json(snapshot, {status: snapshot.source === "live" ? 200 : 503, headers: {"Cache-Control":"no-store"}});
}
