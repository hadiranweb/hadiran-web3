import { NextResponse } from "next/server";
import { jwtConfigured } from "@/lib/auth/jwt";
import { ownerPasswordConfigured, smsIrConfig } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const sms = smsIrConfig();
  return NextResponse.json(
    {
      ok: true,
      jwt: jwtConfigured(),
      sms: sms.configured,
      owner_password: ownerPasswordConfigured(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
