import Link from "@/components/workspace/WorkspaceLink";
import { ArrowUpLeft } from "lucide-react";
import { landingPreviewEnabled } from "@/lib/landing/preview";
import { loadPublicResources } from "@/lib/landing/public-resources";
import { resourceKindFa } from "@/lib/landing/resources";
/** Preview-only editorial links are resolved against the current public projection. */
export async function ResourceConnections({ resourceId }: { resourceId: string }) {
  if (!landingPreviewEnabled()) return null;
  const snapshot = await loadPublicResources();
  const edges = snapshot.connections.filter(edge => edge.from === resourceId || edge.to === resourceId);
  if (!edges.length) return null;
  return <section className="lp-crosslinks"><div><span className="lp-eyebrow">از اینجا، یک اتصال دیگر</span><h2>فکر را به یک قدم وصل کن.</h2><p>پیوندهای تحریریهٔ نمونه؛ نه پیشنهاد شخصی یا حق دسترسی خرید.</p></div><div>{edges.map(edge => { const target = snapshot.resources.find(item => item.id === (edge.from === resourceId ? edge.to : edge.from)); return target ? <Link key={target.id} href={target.href}><span className="lp-eyebrow">{edge.label} / {resourceKindFa[target.kind]}</span><h3>{target.title}</h3><p>{target.summary}</p><ArrowUpLeft size={20} /></Link> : null; })}</div></section>;
}
