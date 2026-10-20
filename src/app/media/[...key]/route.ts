import { NextResponse } from "next/server";
import { readDiskFile } from "@/lib/storage/disk";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ key: string[] }> };

export async function GET(request: Request, context: Ctx) {
  const { key } = await context.params;
  const file = await readDiskFile((key ?? []).join("/"));
  if (!file) return new NextResponse(null, { status: 404 });

  const etag = `"${file.bytes.byteLength}-${Math.trunc(file.mtimeMs)}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }

  return new NextResponse(file.bytes, {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "public, max-age=60, must-revalidate",
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
