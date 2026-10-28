import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { loadGraphForEditor, type GraphEditorView } from "@/lib/analyzers/graph/editor-service";
import { SsotGraphEditor } from "@/components/workspace/SsotGraphEditor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "گراف تشخیص",
  robots: { index: false, follow: false },
};

/**
 * The graph control desk. PostgreSQL is the source of truth here: what this page shows is
 * the draft, what it publishes is what respondents are scored against.
 */
export default async function GraphPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const account = await requirePageOwner("/workspace/graph");
  const params = await searchParams;
  const domain = params.domain === "DOM.MINDSET_GATE" ? "DOM.MINDSET_GATE" : "DOM.CASIO_SS";

  let view: GraphEditorView | null = null;
  let failure = "";
  try {
    view = await loadGraphForEditor(domain);
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  }

  if (!view) {
    return (
      <div className="ws-page">
        <h1 className="ws-page-heading">گراف تشخیص</h1>
        <div className="ws-notice">
          دیتابیس در دسترس نیست؛ تا برقراری اتصال، موتور از بذر مخزن امتیاز می‌گیرد.
          {account.role === "owner" && failure ? <p className="ws-muted mt-2">{failure}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="ws-page">
      <h1 className="ws-page-heading">گراف تشخیص</h1>
      <p className="ws-muted">
        {domain === "DOM.CASIO_SS"
          ? "عارضه‌یابی پنج‌لایه — ۱۵ کلیدواژه، ۷۵ زیرکلیدواژه، ماتریس اندازه‌گیری و گراف علّی."
          : "دروازهٔ الگوی ذهنی — مستقل از عارضه‌یابی ارزیابی می‌شود و فقط از طریق پل به آن متصل است."}
      </p>
      <div className="ws-filter mt-3 flex gap-2">
        <a
          className={domain === "DOM.CASIO_SS" ? "ws-button ws-primary" : "ws-button"}
          href="/workspace/graph?domain=DOM.CASIO_SS"
        >
          عارضه‌یابی کسب‌وکار
        </a>
        <a
          className={domain === "DOM.MINDSET_GATE" ? "ws-button ws-primary" : "ws-button"}
          href="/workspace/graph?domain=DOM.MINDSET_GATE"
        >
          الگوی ذهنی
        </a>
      </div>
      <div className="mt-4">
        <SsotGraphEditor view={view} domain={domain} />
      </div>
    </div>
  );
}
