"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "@/components/workspace/WorkspaceLink";
import { useWorkspace } from "@/components/workspace/WorkspaceContext";
import { FEE_ROUNDING_MODES } from "@/lib/commerce/assessment-policy";
import { emptyPlanDraft, normalizePlanDraft, TARIFF_SUGGESTIONS, type FinancePlanDraft, type FinancePlanRevision, type Tariff } from "@/lib/finance/tariffs";
import { financeMoney } from "@/lib/finance/types";
import { parseTomanInput } from "@/lib/finance/journal";
import "./finance-plans.css";
const messages: Record<string, string> = {
  plan_version_conflict: "نسخهٔ پلن تغییر کرده است؛ ابتدا صفحه را تازه کنید و تغییرات را بررسی کنید.",
  finance_configuration_writes_disabled: "ثبت تنظیمات در این محیط فعال نشده است.",
  duplicate_tariff_key: "شناسهٔ هر تعرفه باید یکتا باشد.", invalid_finance_key: "شناسه باید با حرف انگلیسی کوچک شروع شود و فقط حرف، عدد، نقطه، خط تیره یا زیرخط داشته باشد.",
  invalid_IRR_integer_string: "مبلغ را به تومان دقیق، با حداکثر یک رقم اعشار وارد کنید.", invalid_percentage_tariff: "نرخ باید عدد صحیح بین صفر و ۱۰۰۰۰، بر مبنای قیمت پیش از تخفیف باشد.",
};
function draftOf(plan: FinancePlanRevision): FinancePlanDraft {
  return { key: plan.key, name: plan.name, currency: "IRR", rounding: plan.rounding, refundPolicy: plan.refundPolicy, tariffs: plan.tariffs };
}
function tomanInput(irr: string) { const n = BigInt(irr); return `${n / BigInt(10)}${n % BigInt(10) ? `.${n % BigInt(10)}` : ""}`; }
function AmountField({ amountIRR, onChange }: { amountIRR: string; onChange: (value: string) => void }) {
  const { t, locale } = useWorkspace();
  const [text, setText] = useState(() => tomanInput(amountIRR));
  return <label>{t("مبلغ (تومان؛ حداکثر یک رقم اعشار)", "Amount (toman; up to one decimal)")}<input dir="ltr" inputMode="decimal" value={text} aria-invalid={amountIRR === ""} onChange={event => {
    const value = event.target.value; setText(value);
    try { onChange(String(parseTomanInput(value))); } catch { onChange(""); }
  }} /><small>{amountIRR ? financeMoney(amountIRR, "IRR", locale) : t("مبلغ نامعتبر", "Invalid amount")}</small></label>;
}
export function FinancePlanSettings({ initialPlans, writable, storageState }: {
  initialPlans: FinancePlanRevision[]; writable: boolean; storageState: "ready" | "preview" | "unavailable";
}) {
  const { t } = useWorkspace();
  const [plans, setPlans] = useState(initialPlans), [draft, setDraft] = useState<FinancePlanDraft>(() => initialPlans[0] ? draftOf(initialPlans[0]) : emptyPlanDraft());
  const nextRow = useRef(0);
  const [rowKeys, setRowKeys] = useState(() => (initialPlans[0]?.tariffs ?? []).map((_, i) => `initial-${i}`));
  function freshKeys(count: number) { return Array.from({ length: count }, () => `row-${nextRow.current++}`); }
  const [version, setVersion] = useState(initialPlans[0]?.version ?? 0), [editingSession, setEditingSession] = useState(0);
  const [search, setSearch] = useState(""), [status, setStatus] = useState(""), [busy, setBusy] = useState(false), [dirty, setDirty] = useState(false);
  const roundingLabels = {
    reject_fraction: t("توقف در صورت کسری ریال", "Reject fractional rials"), floor: t("رو به پایین", "Round down"),
    ceil: t("رو به بالا", "Round up"), half_up: t("نزدیک‌ترین؛ نیم رو به بالا", "Nearest; halves up"),
  };
  function change(next: FinancePlanDraft) { setDraft(next); setDirty(true); setStatus(""); }
  function update(index: number, next: Tariff) { change({ ...draft, tariffs: draft.tariffs.map((row, i) => i === index ? next : row) }); }
  function choose(key: string) {
    if (dirty && !window.confirm(t("پیش‌نویس ذخیره‌نشده کنار گذاشته شود؟", "Discard the unsaved draft?"))) return;
    const plan = plans.find(row => row.key === key);
    setRowKeys(freshKeys(plan?.tariffs.length ?? 0)); setDraft(plan ? draftOf(plan) : emptyPlanDraft()); setVersion(plan?.version ?? 0); setDirty(false); setStatus(""); setSearch(""); setEditingSession(n => n + 1);
  }
  function add(key = "") {
    const suggestion = TARIFF_SUGGESTIONS.find(row => row.key === key);
    if (draft.tariffs.length >= 200) { setStatus(t("حداکثر ۲۰۰ تعرفه در هر پلن.", "Up to 200 tariffs per plan.")); return; }
    const addedKeys = freshKeys(1);
    setRowKeys(previous => [...previous, ...addedKeys]);
    change({ ...draft, tariffs: [...draft.tariffs, { key, label: suggestion?.label ?? "", payer: suggestion?.payer ?? "creator", mode: "free", enabled: false }] });
    setSearch("");
  }
  function validate() {
    try { const value = normalizePlanDraft(draft); setStatus(t("ساختار پیش‌نویس معتبر است؛ این بررسی، ثبت یا فعال‌سازی کیف پول نیست.", "Draft structure is valid. This does not save or activate a wallet.")); return value; }
    catch (error) { const code = error instanceof Error ? error.message : "invalid_configuration"; setStatus(messages[code] ?? t("تنظیمات ناقص یا نامعتبر است؛ نام پلن، شناسه‌ها، تعرفه‌ها و مبالغ را بررسی کنید.", "Check the plan name, keys, tariffs and amounts.")); return null; }
  }
  async function save(event: FormEvent) {
    event.preventDefault(); const config = validate(); if (!config || !writable || busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/workspace/finance/plans", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expectedVersion: version, config }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "configuration_unavailable");
      const saved = body.plan as FinancePlanRevision;
      setPlans(previous => [...previous.filter(row => row.key !== saved.key), saved]); setDraft(draftOf(saved)); setVersion(saved.version); setDirty(false); setRowKeys(freshKeys(saved.tariffs.length)); setEditingSession(n => n + 1);
      setStatus(t("نسخهٔ تازهٔ تنظیمات ثبت شد؛ این کار به‌تنهایی تراکنش یا کیف پول را فعال نمی‌کند.", "New configuration revision saved. This does not enable financial transactions."));
    } catch (error) { const code = error instanceof Error ? error.message : "configuration_unavailable"; setStatus(messages[code] ?? t("ثبت تأیید نشد؛ صفحه را تازه کنید و پیش از تکرار، نسخهٔ جاری را بررسی کنید.", "Save was not confirmed. Reload and check the current revision before retrying.")); }
    finally { setBusy(false); }
  }
  const filtered = draft.tariffs.map((tariff, index) => ({ tariff, index })).filter(({ tariff }) => `${tariff.key} ${tariff.label}`.toLowerCase().includes(search.toLowerCase()));
  return <main className="ws-page fp-page"><header className="fp-heading"><div><p className="ws-overline">{t("تنظیمات مالی / پلن‌ها", "FINANCIAL SETTINGS / PLANS")}</p><h1>{t("مرکز تعرفه‌ها و قواعد پلن", "Plan tariffs & financial rules")}</h1><p>{t("تعرفه‌های امروز و خدمات آینده، در یک فهرست نسخه‌دار؛ بدون قیمت یا کارمزد پنهان.", "A versioned registry for current and future services, without implicit pricing.")}</p></div><Link href="/workspace/settings">{t("تنظیمات", "Settings")}</Link></header>
    <aside className="fp-notice"><strong>{t("کیف پول عملیاتی هنوز فعال نیست", "Production wallet is not active")}</strong><p>{t("ثبت تعرفه، اجازهٔ برداشت نیست. تعرفهٔ جدید تا اتصال صریح به سرویس مربوط، اجرا نمی‌شود. تغییر پلن نباید قیمت سفارش قبلی را تغییر دهد.", "Defining a tariff does not authorize a charge. Each service needs explicit integration; previous orders retain their snapshots.")}</p><p>{storageState === "preview" ? t("بدون دیتابیس: فقط پیش‌نویس موقت همین صفحه؛ با خروج از صفحه از بین می‌رود.", "No database: drafts exist only in this page and are lost on navigation.") : storageState === "unavailable" ? t("زیرساخت تنظیمات مالی آماده نیست؛ ثبت غیرفعال است.", "Financial configuration storage is not ready; saving is disabled.") : !writable ? t("خواندن تنظیمات ممکن است؛ ثبت در این محیط قفل است.", "Configuration can be read; writes are locked in this environment.") : t("ثبت فقط برای مالک و به‌صورت نسخهٔ جدید انجام می‌شود.", "Only the owner can append a new revision.")}</p></aside>
    <nav className="fp-plan-list" aria-label={t("انتخاب پلن", "Choose plan")}>{plans.map(plan => <button type="button" key={plan.key} onClick={() => choose(plan.key)} aria-pressed={draft.key === plan.key && version > 0}>{plan.name} · v{plan.version}</button>)}<button type="button" onClick={() => choose("")}>{t("پلن تازه", "New plan")}</button></nav>
    <form onSubmit={save} key={editingSession}><fieldset disabled={busy}><section className="fp-panel"><div className="fp-fields"><label>{t("نام پلن", "Plan name")}<input maxLength={120} value={draft.name} onChange={event => change({ ...draft, name: event.target.value })} /></label><label>{t("شناسهٔ پلن", "Plan key")}<input dir="ltr" maxLength={80} readOnly={version > 0} value={draft.key} onChange={event => change({ ...draft, key: event.target.value })} /></label><label>{t("قاعدهٔ گردکردن کارمزد", "Fee rounding policy")}<select value={draft.rounding} onChange={event => change({ ...draft, rounding: event.target.value as FinancePlanDraft["rounding"] })}>{FEE_ROUNDING_MODES.map(mode => <option key={mode} value={mode}>{roundingLabels[mode]}</option>)}</select></label></div><p>{t("بازپرداخت: فقط پیش از تحویل. محاسبه و ذخیره: ریال صحیح؛ نمایش مبلغ: تومان دقیق. کارمزد درصدی: بر قیمت پیش از تخفیف.", "Refunds: before delivery only. Integer IRR storage, exact toman display. Percentage fees use the pre-discount price.")}</p><small>{version ? t(`نسخهٔ مبنا: ${version}؛ ثبت، نسخهٔ بعدی می‌سازد.`, `Base revision: ${version}; saving appends the next revision.`) : t("هنوز نسخه‌ای ثبت نشده است.", "No revision has been saved.")}</small></section>
    <section className="fp-panel"><div className="fp-toolbar"><h2>{t("فهرست تعرفه‌ها", "Tariff registry")}</h2><label>{t("جست‌وجو", "Search")}<input type="search" value={search} onChange={event => setSearch(event.target.value)} /></label><button type="button" onClick={() => add()}>{t("افزودن تعرفهٔ دلخواه", "Add custom tariff")}</button></div><div className="fp-suggestions">{TARIFF_SUGGESTIONS.filter(row => !draft.tariffs.some(tariff => tariff.key === row.key)).map(row => <button key={row.key} type="button" onClick={() => add(row.key)}>+ {row.label}</button>)}</div><p>{t("موارد پیشنهادی قیمت‌گذاری نشده‌اند؛ افزودن آن‌ها تعرفه‌ای غیرفعال می‌سازد. «رایگان» انتخاب صریح است، نه پیش‌فرض برای تعرفهٔ ناموجود.", "Suggestions are not prices. Added entries start disabled. Free is explicit; missing tariffs never default to zero.")}</p>
    {!filtered.length && <p>{t("تعرفه‌ای برای نمایش نیست.", "No tariffs to display.")}</p>}{filtered.map(({ tariff, index }) => <article className="fp-tariff" key={rowKeys[index]}><div className="fp-tariff-heading"><h3>{tariff.label || t("تعرفهٔ تازه", "New tariff")}</h3><label className="fp-toggle"><input type="checkbox" checked={tariff.enabled} onChange={event => update(index, { ...tariff, enabled: event.target.checked })} />{t("فعال در تنظیمات", "Enabled in configuration")}</label><button type="button" onClick={() => { setRowKeys(previous => previous.filter((_, i) => i !== index)); change({ ...draft, tariffs: draft.tariffs.filter((_, i) => i !== index) }); }}>{t("حذف از پیش‌نویس", "Remove from draft")}</button></div><div className="fp-fields"><label>{t("عنوان تعرفه", "Tariff label")}<input maxLength={120} value={tariff.label} onChange={event => update(index, { ...tariff, label: event.target.value })} /></label><label>{t("شناسهٔ تعرفه", "Tariff key")}<input dir="ltr" maxLength={80} value={tariff.key} onChange={event => update(index, { ...tariff, key: event.target.value })} /></label><label>{t("طرف هزینه", "Cost bearer")}<select value={tariff.payer} onChange={event => update(index, { ...tariff, payer: event.target.value as Tariff["payer"] })}><option value="creator">{t("سازنده", "Creator")}</option><option value="buyer">{t("خریدار", "Buyer")}</option><option value="platform">{t("پلتفرم", "Platform")}</option></select></label><label>{t("نوع تعرفه", "Pricing type")}<select value={tariff.mode} onChange={event => {
      const base = { key: tariff.key, label: tariff.label, enabled: tariff.enabled, payer: tariff.payer };
      update(index, event.target.value === "fixed" ? { ...base, mode: "fixed", amountIRR: "0" } : event.target.value === "percentage" ? { ...base, mode: "percentage", basisPoints: 0, basis: "pre_discount" } : { ...base, mode: "free" });
    }}><option value="free">{t("رایگان صریح", "Explicitly free")}</option><option value="fixed">{t("مبلغ ثابت", "Fixed amount")}</option><option value="percentage">{t("درصدی از قیمت پیش از تخفیف", "Percentage of pre-discount price")}</option></select></label>{tariff.mode === "fixed" && <AmountField key={`amount-${index}`} amountIRR={tariff.amountIRR} onChange={amountIRR => update(index, { ...tariff, amountIRR })} />}{tariff.mode === "percentage" && <label>{t("نرخ: واحد صدم درصد (۱۰۰ = ۱٪)", "Rate in basis points (100 = 1%)")}<input type="number" min={0} max={10000} step={1} value={Number.isNaN(tariff.basisPoints) ? "" : tariff.basisPoints} onChange={event => update(index, { ...tariff, basisPoints: event.target.value === "" ? NaN : Number(event.target.value) })} /></label>}</div></article>)}</section>
    <footer className="fp-actions"><button type="button" onClick={() => validate()}>{t("بررسی پیش‌نویس", "Validate draft")}</button><button type="submit" disabled={!writable || !dirty || busy}>{busy ? t("در حال ثبت…", "Saving…") : t("ثبت نسخهٔ جدید تنظیمات", "Save new revision")}</button><p role="status" aria-live="polite">{status}</p></footer></fieldset></form>
  </main>;
}
