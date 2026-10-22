import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import {
  deleteTopicRule,
  listTopicRules,
  listTopicsForRules,
  saveTopicRule,
  type SaveTopicRuleInput,
} from "@/lib/mcp/config";

export const dynamic = "force-dynamic";

/** قوانین موضوعی موتور گفتگو — فقط owner. */
export async function GET() {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const [rules, topics] = await Promise.all([listTopicRules(), listTopicsForRules()]);
  return NextResponse.json({ rules, topics });
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const body = (await request.json().catch(() => ({}))) as SaveTopicRuleInput;
  const result = await saveTopicRule(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, rule: result.rule });
}

export async function DELETE(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!slug) return NextResponse.json({ error: "slug لازم است." }, { status: 400 });
  const ok = await deleteTopicRule(slug);
  return NextResponse.json({ ok });
}
