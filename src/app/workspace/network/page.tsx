import type { Metadata } from "next";
import { requirePageOwner } from "@/lib/auth/guard";
import { loadReferralTree, type NetworkNode } from "@/lib/auth/network";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "درخت معرف",
  robots: { index: false, follow: false },
};

function Tree({ nodes, depth = 0 }: { nodes: NetworkNode[]; depth?: number }) {
  if (!nodes.length) return null;
  return (
    <ul className={depth ? "mr-4 mt-2 space-y-2 border-r border-slate-200 pr-4" : "space-y-2"}>
      {nodes.map((node) => (
        <li key={node.publicCode} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">
          <p className="font-medium text-slate-900">{node.nameFa}</p>
          <p className="text-xs text-slate-500">
            <span dir="ltr">{node.publicCode}</span> · {node.roleFa}
          </p>
          <Tree nodes={node.children} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );
}

export default async function NetworkPage() {
  await requirePageOwner("/workspace/network");
  const tree = await loadReferralTree();
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">درخت روابط معرف</h1>
      <p className="text-sm leading-7 text-slate-500">شناسهٔ داخلی حساب نشان داده نمی‌شود. کد معرف همان شناسهٔ ۸رقمی است.</p>
      {tree.length === 0 ? <p className="text-sm text-slate-500">حسابی نیست.</p> : <Tree nodes={tree} />}
    </main>
  );
}
