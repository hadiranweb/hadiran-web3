export type ReferralNode = {
  code: string;
  name: string;
  role: "owner" | "author" | "member";
  kind: "account";
  referrerCode: string | null;
  hasReferrer: boolean;
  depth: number;
};

export type ReferralEdge = { from: string; to: string; kind: "account_referral" };

export type NetworkQuery = {
  root: string | null;
  q: string;
  role: "all" | ReferralNode["role"];
  page: number;
  depth: number;
  invalidRoot: boolean;
};

export type NetworkSnapshot = {
  source: "live" | "unavailable" | "error" | "not_found";
  asOf: string | null;
  query: NetworkQuery;
  total: number | null;
  withoutCode: number | null;
  directoryTotal: number | null;
  rootTotal: number | null;
  nodes: ReferralNode[];
  edges: ReferralEdge[];
  directory: ReferralNode[];
  truncated: boolean;
  cycle: boolean;
  nodeLimit: number;
  pageSize: number;
};

export function publicReferralCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value
    .trim()
    .replace(/[۰-۹]/g, (n) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(n)))
    .replace(/[٠-٩]/g, (n) => String("٠١٢٣٤٥٦٧٨٩".indexOf(n)));
  return /^\d{8}$/.test(code) ? code : null;
}

export function parseNetworkQuery(values: {
  root?: unknown;
  q?: unknown;
  role?: unknown;
  page?: unknown;
  depth?: unknown;
}): NetworkQuery {
  const root = publicReferralCode(values.root);
  const page = Number(values.page);
  const depth = Number(values.depth);
  return {
    root,
    invalidRoot: values.root != null && values.root !== "" && !root,
    q: typeof values.q === "string" ? values.q.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 80) : "",
    role: values.role === "owner" || values.role === "author" || values.role === "member" ? values.role : "all",
    page: Number.isSafeInteger(page) && page >= 1 && page <= 10000 ? page : 1,
    depth: Number.isInteger(depth) && depth >= 1 && depth <= 4 ? depth : 2,
  };
}

export function referralEdges(nodes: ReferralNode[]): { edges: ReferralEdge[]; cycle: boolean } {
  const codes = new Set(nodes.map((node) => node.code));
  const edges: ReferralEdge[] = nodes.flatMap((node) =>
    node.referrerCode && codes.has(node.referrerCode)
      ? [{ from: node.referrerCode, to: node.code, kind: "account_referral" as const }]
      : [],
  );
  const parents = new Map(nodes.map((node) => [node.code, node.referrerCode]));
  let cycle = false;
  for (const code of codes) {
    const seen = new Set<string>();
    let next: string | null | undefined = code;
    while (next && codes.has(next)) {
      if (seen.has(next)) {
        cycle = true;
        break;
      }
      seen.add(next);
      next = parents.get(next);
    }
  }
  return { edges, cycle };
}

/** Placement only: ring spacing reflects node count, never a relationship score. */
export function layoutReferralNodes(nodes: ReferralNode[]): {
  positions: Record<string, { x: number; y: number }>;
  size: number;
} {
  const layers = new Map<number, ReferralNode[]>();
  for (const node of nodes) {
    const layer = layers.get(node.depth) || [];
    layer.push(node);
    layers.set(node.depth, layer);
  }
  const widest = Math.max(1, ...[...layers.values()].map((layer) => layer.length));
  const step = Math.max(120, (widest * 34) / (2 * Math.PI));
  const maxDepth = Math.max(0, ...nodes.map((node) => node.depth));
  const singleRoot = (layers.get(0)?.length ?? 0) === 1;
  const outer = Math.max(160, (maxDepth + (singleRoot ? 0 : 1)) * step);
  const size = outer * 2 + 150;
  const center = size / 2;
  const positions: Record<string, { x: number; y: number }> = {};
  for (const [depth, layer] of [...layers.entries()].sort((a, b) => a[0] - b[0])) {
    layer.sort(
      (a, b) => (a.referrerCode || "").localeCompare(b.referrerCode || "") || a.code.localeCompare(b.code),
    );
    const radius = singleRoot && depth === 0 ? 0 : (depth + (singleRoot ? 0 : 1)) * step;
    layer.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / layer.length - Math.PI / 2;
      positions[node.code] = { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius };
    });
  }
  return { positions, size };
}
