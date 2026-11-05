/** Public navigation projections only; these objects cannot grant access or move money. */
export type ResourceKind = "knowledge" | "product" | "analyzer";
export type PublicResource = { id: string; kind: ResourceKind; title: string; summary: string; href: string; minutes?: number; format?: string; cover?: string | null };
export type PublicConnection = { from: string; to: string; label: string; provenance: "preview-editorial" };
export type PublicResourceSnapshot = { resources: PublicResource[]; connections: PublicConnection[]; sources: Record<ResourceKind, "live" | "preview" | "unavailable"> };
export const resourceKindFa: Record<ResourceKind,string> = { knowledge: "باغ دانش", product: "فروشگاه", analyzer: "آینه‌ها" };
export const journeyIntents = [
  { id: "question", title: "یک پرسش را روشن کنم", note: "از خواندن تا تمرین", stages: ["knowledge", "product"] },
  { id: "reflection", title: "یک ارزیابی را بهتر بفهمم", note: "از زمینه تا آینه", stages: ["knowledge", "analyzer"] },
  { id: "practice", title: "یک تمرین را شروع کنم", note: "از ابزار تا فکر تازه", stages: ["product", "knowledge"] },
] as const;
export function publicConnections(resources: PublicResource[], connections: PublicConnection[]) {
  const ids = new Set(resources.map(item => item.id));
  return connections.filter(edge => edge.from !== edge.to && ids.has(edge.from) && ids.has(edge.to));
}
