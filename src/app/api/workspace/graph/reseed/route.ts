import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { reseedGraphFromCode } from "@/lib/analyzers/graph/editor-service";

export const dynamic = "force-dynamic";

/**
 * Promote the repository seed over the live graph, then publish it as a new revision.
 * Owner-only and explicitly requested: a deploy never does this by itself, so workspace
 * tuning cannot be silently rolled back by a code change.
 */
export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  let confirm = false;
  try {
    const body = (await request.json()) as { confirm?: unknown };
    confirm = body.confirm === true;
  } catch {
    confirm = false;
  }
  if (!confirm) {
    return NextResponse.json(
      { error: "تأیید لازم است: بازنویسی پیش‌نویس با بذر مخزن، ویرایش‌های جاری میز کار را جایگزین می‌کند." },
      { status: 400 },
    );
  }
  try {
    const result = await reseedGraphFromCode({
      actorId: auth.account.id,
      actorRole: auth.account.role,
      noteFa: "بازنشر بذر مخزن از میز کار",
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.skippedReason ?? "reseed_failed" }, { status: 409 });
    }
    return NextResponse.json({ ok: true, published: result.published });
  } catch (error) {
    return NextResponse.json({ error: "reseed_failed", detail: String(error) }, { status: 500 });
  }
}
