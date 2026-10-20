import "server-only";
import { db } from "@/db";
import { analyzerPacks } from "@/db/schema";
import { listAccessiblePacks } from "@/lib/analyzers/access";
import type { SessionAccount } from "@/lib/auth/session";
import { deskFilter, type DeskFilter, type DeskItem, type DeskSnapshot } from "./role-home-types";

const PAGE_SIZE = 12;

function matches(item: DeskItem, filter: DeskFilter) {
  if (filter === "drafts") return item.status === "draft" && item.edit;
  if (filter === "responses") return item.responses;
  if (filter === "mine") return item.mine;
  return true;
}

export async function loadDeskSnapshot(
  account: Pick<SessionAccount, "id" | "role">,
  filterRaw: unknown,
  pageRaw: unknown,
): Promise<DeskSnapshot> {
  const filter = deskFilter(filterRaw);
  const page = typeof pageRaw === "string" ? Number(pageRaw) : 1;
  const safePage = Number.isSafeInteger(page) && page >= 1 && page <= 10000 ? page : 1;
  const empty: DeskSnapshot = {
    source: "unavailable",
    asOf: null,
    counts: { all: null, drafts: null, responses: null, mine: null },
    items: [],
    filter,
    page: safePage,
    pageSize: PAGE_SIZE,
  };

  try {
    const authored = await listAccessiblePacks(account);
    const times = await db
      .select({
        slug: analyzerPacks.slug,
        updatedAt: analyzerPacks.updatedAt,
        createdBy: analyzerPacks.createdBy,
      })
      .from(analyzerPacks);
    const meta = new Map(times.map((row) => [row.slug, row]));
    const all: DeskItem[] = authored.map(({ pack, access }) => {
      const row = meta.get(pack.slug);
      return {
        slug: pack.slug,
        title: pack.nameFa,
        status: pack.status,
        updatedAt: row?.updatedAt?.toISOString() || new Date(0).toISOString(),
        mine: row?.createdBy === account.id,
        edit: access.edit,
        responses: access.responses,
        grant: access.grant,
      };
    });
    const filtered = all.filter((item) => matches(item, filter));
    const start = (safePage - 1) * PAGE_SIZE;
    return {
      source: "live",
      asOf: new Date().toISOString(),
      counts: {
        all: all.length,
        drafts: all.filter((item) => matches(item, "drafts")).length,
        responses: all.filter((item) => matches(item, "responses")).length,
        mine: all.filter((item) => matches(item, "mine")).length,
      },
      items: filtered.slice(start, start + PAGE_SIZE),
      filter,
      page: safePage,
      pageSize: PAGE_SIZE,
    };
  } catch (error) {
    console.error("[hadiran] analyzer desk unavailable", error instanceof Error ? error.name : "unknown");
    return { ...empty, source: "error" };
  }
}
