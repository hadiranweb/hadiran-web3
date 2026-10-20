import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountPublicCodes, accounts } from "@/db/schema";
import { ensureAccessSchema } from "@/lib/auth/schema-guard";
import type { SessionAccount } from "@/lib/auth/session";
import {
  publicReferralCode,
  referralEdges,
  type NetworkQuery,
  type NetworkSnapshot,
  type ReferralNode,
} from "./network-types";

const NODE_LIMIT = 120;
const PAGE_SIZE = 20;
const ROOT_LIMIT = 20;

type Row = {
  id: number;
  parent: number | null;
  code: string;
  name: string;
  role: ReferralNode["role"];
  referrerCode: string | null;
};

function nameOf(row: { givenName: string | null; familyName: string | null; displayName: string | null }) {
  const joined = [row.givenName, row.familyName].filter(Boolean).join(" ").trim();
  if (joined) return joined;
  if (row.displayName?.trim()) return row.displayName.trim();
  return "بدون نام";
}

function asRole(role: string): ReferralNode["role"] {
  if (role === "owner" || role === "author" || role === "member") return role;
  return "member";
}

function toNode(row: Row, depth: number): ReferralNode {
  return {
    code: row.code,
    name: row.name,
    role: row.role,
    kind: "account",
    referrerCode: row.referrerCode,
    hasReferrer: row.parent != null,
    depth,
  };
}

function emptySnapshot(query: NetworkQuery, source: NetworkSnapshot["source"]): NetworkSnapshot {
  return {
    source,
    asOf: null,
    query,
    total: null,
    withoutCode: null,
    directoryTotal: null,
    rootTotal: null,
    nodes: [],
    edges: [],
    directory: [],
    truncated: false,
    cycle: false,
    nodeLimit: NODE_LIMIT,
    pageSize: PAGE_SIZE,
  };
}

export async function loadNetworkSnapshot(
  account: Pick<SessionAccount, "id" | "role">,
  query: NetworkQuery,
): Promise<NetworkSnapshot> {
  if (account.role !== "owner") return emptySnapshot(query, "unavailable");
  if (query.invalidRoot) return emptySnapshot(query, "not_found");

  try {
    await ensureAccessSchema();
    const rows = await db
      .select({
        id: accounts.id,
        parent: accounts.referredByAccountId,
        role: accounts.role,
        givenName: accounts.givenName,
        familyName: accounts.familyName,
        displayName: accounts.displayName,
        publicCode: accountPublicCodes.code,
      })
      .from(accounts)
      .leftJoin(accountPublicCodes, eq(accountPublicCodes.accountId, accounts.id))
      .where(eq(accounts.isActive, true));

    const coded: Row[] = [];
    const byId = new Map<number, Row>();
    let withoutCode = 0;
    for (const row of rows) {
      const code = publicReferralCode(row.publicCode);
      if (!code) {
        withoutCode += 1;
        continue;
      }
      const item: Row = {
        id: row.id,
        parent: row.parent,
        code,
        name: nameOf(row),
        role: asRole(row.role),
        referrerCode: null,
      };
      coded.push(item);
      byId.set(row.id, item);
    }
    for (const item of coded) {
      if (item.parent == null) continue;
      const parent = byId.get(item.parent);
      item.referrerCode = parent?.code ?? null;
    }

    const needle = query.q.toLowerCase();
    const directoryPool = coded
      .filter((row) => (query.role === "all" || row.role === query.role) && (!needle || `${row.name} ${row.code}`.toLowerCase().includes(needle)))
      .sort((a, b) => a.code.localeCompare(b.code));
    const directory = directoryPool
      .slice((query.page - 1) * PAGE_SIZE, query.page * PAGE_SIZE)
      .map((row) => toNode(row, 0));

    const roots = coded.filter((row) => !row.referrerCode).sort((a, b) => a.code.localeCompare(b.code));
    let seed: Row[] = [];
    let truncated = false;
    if (query.root) {
      const root = coded.find((row) => row.code === query.root);
      if (!root) return emptySnapshot(query, "not_found");
      seed = [root];
    } else {
      truncated = roots.length > ROOT_LIMIT;
      seed = roots.slice(0, ROOT_LIMIT);
    }

    const loaded = new Map<number, Row>();
    const depths = new Map<number, number>();
    for (const row of seed) {
      loaded.set(row.id, row);
      depths.set(row.id, 0);
    }
    let frontier = seed.map((row) => row.id);
    for (let depth = 1; depth <= query.depth && frontier.length; depth += 1) {
      const room = NODE_LIMIT - loaded.size;
      const children = coded
        .filter((row) => row.parent != null && frontier.includes(row.parent) && !loaded.has(row.id))
        .sort((a, b) => a.code.localeCompare(b.code));
      if (children.length > room) truncated = true;
      frontier = [];
      for (const row of children.slice(0, Math.max(0, room))) {
        loaded.set(row.id, row);
        depths.set(row.id, depth);
        frontier.push(row.id);
      }
      if (truncated && loaded.size >= NODE_LIMIT) break;
    }
    if (frontier.length) {
      const deeper = coded.some((row) => row.parent != null && frontier.includes(row.parent) && !loaded.has(row.id));
      if (deeper) truncated = true;
    }

    const nodes = [...loaded.values()].map((row) => toNode(row, depths.get(row.id) ?? 0));
    return {
      ...emptySnapshot(query, "live"),
      asOf: new Date().toISOString(),
      total: coded.length,
      withoutCode,
      rootTotal: roots.length,
      directoryTotal: directoryPool.length,
      nodes,
      ...referralEdges(nodes),
      directory,
      truncated,
    };
  } catch (error) {
    console.error("[hadiran] referral network unavailable", error instanceof Error ? error.name : "unknown");
    return emptySnapshot(query, "error");
  }
}
