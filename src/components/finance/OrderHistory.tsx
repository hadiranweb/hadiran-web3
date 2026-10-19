import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { SessionAccount } from "@/lib/auth/session";
import { financeMoney } from "@/lib/finance/types";
import "./finance.css";
const labels: Record<string,string> = {created:"ساخت سفارش",reference_submitted:"ثبت شمارهٔ پیگیری",receipt_confirmed:"تأیید دریافت",receipt_declined:"عدم تأیید دریافت",cancelled:"لغو توسط خریدار",access_repaired:"ترمیم دسترسی سفارشِ قبلاً تسویه‌شده"};
async function loadHistory(orderId: string, account: SessionAccount) {
    const scope = account.role === "owner" ? sql`true` : sql`o.buyer_id=${account.id}`;
    const order = await db.execute<{amount:string;currency:string;discount:string;original:string|null}>(sql`select amount::text,currency,discount_amount::text discount,original_amount::text original from shop_orders o where o.id=${orderId} and ${scope} limit 1`);
    if (!order.rows.length) return null;
    const events = await db.execute<{kind:string;actor:string;code:string|null;role:string;time:Date}>(sql`select e.kind,
      case when ${account.role === 'owner'} or e.actor_id=${account.id} then coalesce(nullif(trim(concat_ws(' ',a.given_name,a.family_name)),''),nullif(a.display_name,''),'نام ثبت نشده') else 'مدیر' end actor,
      case when ${account.role === 'owner'} or e.actor_id=${account.id} then c.code else null end code,e.actor_role role,e.created_at time from shop_order_events e join shop_orders o on o.id=e.order_id
      left join accounts a on a.id=e.actor_id left join account_public_codes c on c.account_id=a.id
      where e.order_id=${orderId} and ${scope} order by e.created_at desc,e.id desc limit 50`);
    return {item: order.rows[0], events: events.rows};
}
export async function OrderHistory({orderId,account}:{orderId:string;account:SessionAccount}) {
  const data = await loadHistory(orderId,account).catch(() => undefined);
  if (data === undefined) return <section className="fc-history"><p role="status">رویدادهای سفارش در دسترس نیستند.</p></section>;
  if (data === null) return null;
  const {item, events} = data;
  return <section className="fc-history" aria-labelledby="order-history-title">
      <h2 id="order-history-title">مبلغ ثبت‌شده و رویدادهای سفارش</h2>
      <p>مبلغ پیش از تخفیف: {financeMoney(item.original,item.currency)} · تخفیف: {financeMoney(item.discount,item.currency)} · قابل پرداخت: {financeMoney(item.amount,item.currency)}</p>
      <p>برای پرداخت بیرونی، مبلغ ذخیره‌شده نیز بدون تبدیل: {item.amount} {item.currency}</p>
      <p>حداکثر ۵۰ رویداد آخر · زمان تهران · رویدادهای تاریخیِ ثبت‌نشده بازسازی نشده‌اند.</p>
      {events.length ? <ol>{events.map((event,index)=><li key={index}><strong>{labels[event.kind] || "تغییر ثبت‌شده"}</strong><small>{event.actor} · {event.role === "owner" ? "مدیر" : "خریدار"}{event.code ? ` · ${event.code}` : ""} · <time dateTime={new Date(event.time).toISOString()}>{new Intl.DateTimeFormat("fa-IR-u-ca-persian",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Tehran"}).format(new Date(event.time))}</time></small></li>)}</ol> : <p>رویداد ثبت‌شده‌ای در این نسخه نداریم.</p>}
    </section>;
}
