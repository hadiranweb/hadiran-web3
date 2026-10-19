import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { SessionAccount } from "@/lib/auth/session";
import { referralEdges, type NetworkQuery, type NetworkSnapshot, type ReferralNode } from "./network-types";
type Row = { id: number; parent: number | null; code: string; name: string; role: ReferralNode["role"]; referrerCode: string | null };
const NODE_LIMIT = 120, PAGE_SIZE = 20;
// Internal IDs exist only in the transaction; the explicit serializer never returns them.
const fields = sql`a.id, a.referred_by_account_id as parent, c.code,
  coalesce(nullif(trim(concat_ws(' ',a.given_name,a.family_name)),''),nullif(trim(a.display_name),''),'بدون نام') as name,
  a.role, pc.code as "referrerCode"`;
const tables = sql`accounts a join account_public_codes c on c.account_id=a.id
  left join accounts p on p.id=a.referred_by_account_id and p.is_active=true
  left join account_public_codes pc on pc.account_id=p.id and pc.code ~ '^[0-9]{8}$'`;
const visible = sql`a.is_active=true and c.code ~ '^[0-9]{8}$'`;
function node(row: Row, depth: number): ReferralNode {
  return { code: row.code, name: row.name, role: row.role, kind: "account", referrerCode: row.referrerCode, hasReferrer: row.parent != null, depth };
}
export async function loadNetworkSnapshot(account: Pick<SessionAccount,"id"|"role">, query: NetworkQuery): Promise<NetworkSnapshot> {
  if (account.role !== "owner") throw new Error("forbidden");
  const empty: NetworkSnapshot = { source: account.id===0 ? "preview" : "unavailable", asOf:null,query,total:null,withoutCode:null,directoryTotal:null,rootTotal:null,nodes:[],edges:[],directory:[],truncated:false,cycle:false,nodeLimit:NODE_LIMIT,pageSize:PAGE_SIZE };
  if (account.id===0 || !process.env.DATABASE_URL) return empty;
  if (query.invalidRoot) return {...empty,source:"not_found"};
  try {
    return await db.transaction(async tx=>{
      const counts = await tx.execute<{total:number;withoutCode:number}>(sql`select count(*) filter (where c.code ~ '^[0-9]{8}$')::int as total, count(*) filter (where c.code is null or c.code !~ '^[0-9]{8}$')::int as "withoutCode" from accounts a left join account_public_codes c on c.account_id=a.id where a.is_active=true`);
      const roots = sql`${visible} and pc.code is null`;
      const rootCount = await tx.execute<{n:number}>(sql`select count(*)::int as n from ${tables} where ${roots}`);
      const search = sql`${visible} and (${query.role==='all'} or a.role::text=${query.role}) and (${query.q===''} or position(lower(${query.q}) in lower(concat_ws(' ',a.given_name,a.family_name,a.display_name,c.code)))>0)`;
      const directoryCount = await tx.execute<{n:number}>(sql`select count(*)::int as n from ${tables} where ${search}`);
      const directoryRows = await tx.execute<Row>(sql`select ${fields} from ${tables} where ${search} order by c.code limit ${PAGE_SIZE} offset ${(query.page-1)*PAGE_SIZE}`);
      const seed = await tx.execute<Row>(sql`select ${fields} from ${tables} where ${query.root ? sql`${visible} and c.code=${query.root}` : roots} order by c.code limit ${query.root ? 1 : 20}`);
      if (query.root && !seed.rows.length) return {...empty,source:"not_found"};
      const loaded = new Map<number,Row>(), depths = new Map<number,number>();
      for (const row of seed.rows) { loaded.set(row.id,row); depths.set(row.id,0); }
      let frontier = seed.rows.map(row=>row.id), truncated = !query.root && rootCount.rows[0].n>20;
      for (let depth=1; depth<=query.depth && frontier.length; depth++) {
        const ids = sql.join(frontier.map(id=>sql`${id}`),sql`, `);
        const seen = sql.join([...loaded.keys()].map(id=>sql`${id}`),sql`, `);
        const room = NODE_LIMIT-loaded.size;
        const children = await tx.execute<Row>(sql`select ${fields} from ${tables} where ${visible} and a.referred_by_account_id in (${ids}) and a.id not in (${seen}) order by c.code limit ${room+1}`);
        if (children.rows.length>room) truncated=true;
        frontier=[];
        for (const row of children.rows.slice(0,room)) { loaded.set(row.id,row); depths.set(row.id,depth); frontier.push(row.id); }
        if (truncated && loaded.size>=NODE_LIMIT) break;
      }
      if (frontier.length) {
        const ids=sql.join(frontier.map(id=>sql`${id}`),sql`, `), seen=sql.join([...loaded.keys()].map(id=>sql`${id}`),sql`, `);
        const deeper=await tx.execute(sql`select 1 from ${tables} where ${visible} and a.referred_by_account_id in (${ids}) and a.id not in (${seen}) limit 1`);
        if (deeper.rows.length) truncated=true;
      }
      const nodes=[...loaded.values()].map(row=>node(row,depths.get(row.id)!));
      const time=await tx.execute<{asOf:string}>(sql`select transaction_timestamp() as "asOf"`);
      return {...empty,source:"live",asOf:new Date(time.rows[0].asOf).toISOString(),total:counts.rows[0].total,withoutCode:counts.rows[0].withoutCode,
        rootTotal:rootCount.rows[0].n,directoryTotal:directoryCount.rows[0].n,nodes,...referralEdges(nodes),directory:directoryRows.rows.map(row=>node(row,0)),truncated};
    },{isolationLevel:"repeatable read",accessMode:"read only"});
  } catch(error) {
    console.error("[hadiran] referral network unavailable",error instanceof Error ? error.name : "unknown");
    return {...empty,source:"error"};
  }
}
