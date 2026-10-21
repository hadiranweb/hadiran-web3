import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireOwner } from "@/lib/auth/guard";
import {
  loadCopyGroup,
  loadCopyHistory,
  publishCopy,
  restoreCopyVersion,
  revertCopy,
  saveCopyDrafts,
} from "@/lib/content/desk";
import { isCopyGroup } from "@/lib/content/registry";
import { SITE_COPY_TAG } from "@/lib/content/site-copy";

export const dynamic = "force-dynamic";

/** خواندن یک گروه متن برای ویرایشگر. */
export async function GET(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const url = new URL(request.url);
  const historyKey = url.searchParams.get("history");
  if (historyKey) {
    return NextResponse.json({ items: await loadCopyHistory(historyKey) });
  }
  const group = url.searchParams.get("group") ?? "";
  if (!isCopyGroup(group)) return NextResponse.json({ error: "گروه نامعتبر است." }, { status: 400 });
  const { source, entries } = await loadCopyGroup(group);
  return NextResponse.json({ source, entries });
}

/** ذخیرهٔ پیش‌نویس — هیچ‌چیز عمومی نمی‌شود تا انتشار. */
export async function PUT(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const body = (await request.json().catch(() => ({}))) as {
    values?: Record<string, unknown>;
    note?: unknown;
  };
  const result = await saveCopyDrafts(auth.account.id, {
    values: body.values ?? {},
    note: typeof body.note === "string" ? body.note : null,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, saved: result.saved });
}

/** انتشار / بازگشت به پیش‌فرض / بازگردانی یک نسخه. */
export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const body = (await request.json().catch(() => ({}))) as {
    action?: unknown;
    keys?: unknown;
    revisions?: unknown;
    key?: unknown;
    revision?: unknown;
    note?: unknown;
  };
  const note = typeof body.note === "string" ? body.note : null;

  if (body.action === "publish") {
    const keys = Array.isArray(body.keys) ? body.keys.filter((k): k is string => typeof k === "string") : [];
    const revisions =
      body.revisions && typeof body.revisions === "object"
        ? (body.revisions as Record<string, number>)
        : {};
    const result = await publishCopy(auth.account.id, { keys, revisions, note });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, conflicts: "conflicts" in result ? result.conflicts : undefined },
        { status: result.status },
      );
    }
    revalidateTag(SITE_COPY_TAG, "max");
    return NextResponse.json({ ok: true, published: result.published });
  }

  if (body.action === "revert") {
    const key = typeof body.key === "string" ? body.key : "";
    const result = await revertCopy(auth.account.id, { key, note });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    revalidateTag(SITE_COPY_TAG, "max");
    return NextResponse.json({ ok: true });
  }

  if (body.action === "restore") {
    const key = typeof body.key === "string" ? body.key : "";
    const revision = typeof body.revision === "number" ? body.revision : Number(body.revision);
    if (!Number.isInteger(revision) || revision < 1) {
      return NextResponse.json({ error: "شمارهٔ نسخه نامعتبر است." }, { status: 400 });
    }
    const result = await restoreCopyVersion(auth.account.id, { key, revision, note });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    revalidateTag(SITE_COPY_TAG, "max");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "action نامعتبر است." }, { status: 400 });
}
