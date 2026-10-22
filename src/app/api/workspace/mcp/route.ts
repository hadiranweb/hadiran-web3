import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/guard";
import { loadAnalyzers } from "@/lib/analyzers/catalog";
import {
  getMcpConfig,
  listTopicRules,
  listTopicsForRules,
  saveMcpConfig,
  toAdminConfig,
  type SaveMcpConfigInput,
} from "@/lib/mcp/config";

export const dynamic = "force-dynamic";

/** تنظیمات سراسری موتور گفتگو — فقط owner. کلید خام هرگز برنمی‌گردد. */
export async function GET() {
  const auth = await requireOwner();
  if (auth.error) return auth.error;

  const [config, rules, topics] = await Promise.all([
    getMcpConfig(),
    listTopicRules(),
    listTopicsForRules(),
  ]);

  let analyzers: { slug: string; nameFa: string }[] = [];
  try {
    const all = await loadAnalyzers();
    analyzers = all.filter((a) => a.status === "open").map((a) => ({ slug: a.slug, nameFa: a.nameFa }));
  } catch {
    analyzers = [];
  }

  return NextResponse.json({ config: toAdminConfig(config), rules, topics, analyzers });
}

export async function PUT(request: Request) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const body = (await request.json().catch(() => ({}))) as SaveMcpConfigInput;
  const result = await saveMcpConfig(auth.account.id, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  const config = await getMcpConfig();
  return NextResponse.json({ ok: true, config: toAdminConfig(config) });
}
