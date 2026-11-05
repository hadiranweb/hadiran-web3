"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Download, Focus, MapPin, Printer, Save, Trash2, Type } from "lucide-react";
import { downloadText, localKey, useBrowserState } from "@/lib/landing/browser-state";
import { LocalCollection, SaveButton, ShareButton } from "./LocalCollection";
import { ToolDialog } from "./ToolDialog";

type Heading = { id: string; text: string };
type ReadingState = { note: string; observation: string; hypothesis: string; nextStep: string; section: string; done: boolean };
const initial: ReadingState = { note: "", observation: "", hypothesis: "", nextStep: "", section: "", done: false };
function validState(value: unknown): value is ReadingState {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return ["note", "observation", "hypothesis", "nextStep", "section"].every(key => typeof row[key] === "string" && (row[key] as string).length <= 10000) && typeof row.done === "boolean";
}
type Prefs = { size: number };
const defaultPrefs: Prefs = { size: 16 };
function validPrefs(value: unknown): value is Prefs { return Boolean(value && typeof value === "object" && [15, 16, 18, 20].includes((value as Prefs).size)); }
function observeReading(onUpdate: (active: string, progress: number) => void, headings: Heading[]) {
  let frame = 0;
  function measure() {
    frame = 0;
    const body = document.querySelector<HTMLElement>(".lp-reading-content");
    if (!body) return;
    const toolbar = document.querySelector<HTMLElement>(".lp-reader-toolbar");
    const edge = (toolbar?.offsetHeight || 120) + (toolbar ? parseInt(getComputedStyle(toolbar).top, 10) || 0 : 74) + 24;
    const page = document.querySelector<HTMLElement>(".lp-knowledge-page");
    page?.style.setProperty("--lp-sticky-edge", `${edge}px`);
    const scrollPadding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    page?.style.setProperty("--lp-heading-offset", `${Math.max(0, edge - scrollPadding)}px`);
    let active = headings[0]?.id || "";
    for (const heading of headings) { const node = document.getElementById(heading.id); if (node && node.getBoundingClientRect().top <= edge + 4) active = heading.id; }
    const rect = body.getBoundingClientRect();
    const distance = Math.max(1, rect.height - window.innerHeight + edge);
    const progress = Math.min(100, Math.max(0, Math.round((edge - rect.top) / distance * 100)));
    onUpdate(active, progress);
  }
  function tick() { if (!frame) frame = window.requestAnimationFrame(measure); }
  measure(); window.addEventListener("scroll", tick, { passive: true }); window.addEventListener("resize", tick);
  const observer = new ResizeObserver(tick);
  const content = document.querySelector(".lp-reading-content"); if (content) observer.observe(content);
  const toolbar = document.querySelector(".lp-reader-toolbar"); if (toolbar) observer.observe(toolbar);
  return () => { observer.disconnect(); window.removeEventListener("scroll", tick); window.removeEventListener("resize", tick); window.cancelAnimationFrame(frame); };
}
export function ActiveArticleTOC({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState(headings[0]?.id || "");
  useEffect(() => observeReading(id => setActive(id), headings), [headings]);
  return <nav aria-label="فهرست مطالب">{headings.map(heading => <a key={heading.id} href={`#${heading.id}`} aria-current={active === heading.id ? "location" : undefined}>{heading.text.replace(/[*`]/g, "")}</a>)}</nav>;
}
export function ArticleReadingTools({ scope, slug, title, headings }: { scope: string; slug: string; title: string; headings: Heading[] }) {
  const [prefs, savePrefs] = useBrowserState(localKey(scope, "reading-prefs"), defaultPrefs, validPrefs);
  const [state, saveState] = useBrowserState(localKey(scope, `reading:${slug}`), initial, validState);
  const [focused, setFocused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const currentSection = useRef("");
  useEffect(() => observeReading((id, percent) => { currentSection.current = id; setProgress(percent); }, headings), [headings]);
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".lp-knowledge-page");
    page?.style.setProperty("--lp-reading-size", `${prefs.size}px`);
    page?.toggleAttribute("data-reading-focus", focused);
    return () => { page?.removeAttribute("data-reading-focus"); page?.style.removeProperty("--lp-reading-size"); };
  }, [focused, prefs.size]);
  const resume = headings.find(heading => heading.id === state.section);
  return <section className="lp-reader-toolbar" aria-label="ابزار مطالعه"><div className="lp-progress-line" role="progressbar" aria-label="پیشرفت مطالعهٔ متن" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div><div className="lp-tool-row"><span className="lp-progress-number">{progress.toLocaleString("fa-IR")}٪</span><label className="lp-size-control"><Type size={17} /><span className="sr-only">اندازهٔ متن</span><select aria-label="اندازهٔ متن" value={prefs.size} onChange={e => { const persisted = savePrefs({ size: Number(e.target.value) }); if (!persisted) setMessage("اندازهٔ متن فقط در این صفحه می‌ماند؛ حافظهٔ مرورگر در دسترس نیست."); }}><option value={15}>ریزتر</option><option value={16}>عادی</option><option value={18}>درشت</option><option value={20}>درشت‌تر</option></select></label><button type="button" className="lp-tool-button" aria-pressed={focused} onClick={() => setFocused(value => !value)}><Focus size={17} />{focused ? "پایان تمرکز" : "مطالعهٔ متمرکز"}</button><SaveButton scope={scope} item={{ href: `/knowledge/${slug}`, title, kind: "knowledge" }} /><button type="button" className="lp-tool-button" onClick={() => window.print()}><Printer size={17} /> چاپ</button><ShareButton /><LocalCollection scope={scope} /></div><div className="lp-tool-row lp-reader-secondary"><button type="button" className="lp-tool-button" disabled={!headings.length} onClick={() => {
    const persisted = saveState({ ...state, section: currentSection.current });
    setMessage(persisted ? "جای مطالعه در این مرورگر ذخیره شد." : "حافظهٔ مرورگر در دسترس نیست؛ جای مطالعه فقط تا بستن صفحه می‌ماند.");
  }}><MapPin size={16} /> ذخیرهٔ جای مطالعه</button>{resume && <a className="lp-resume-link" href={`#${resume.id}`}>ادامه از «{resume.text.replace(/[*`]/g, "")}» ←</a>}<button type="button" className="lp-tool-button" aria-pressed={state.done} onClick={() => { const persisted = saveState({ ...state, done: !state.done }); setMessage(persisted ? state.done ? "از خوانده‌شده‌ها برداشته شد." : "در این مرورگر، خوانده‌شده نشان شد." : "حافظهٔ مرورگر در دسترس نیست؛ وضعیت فقط در این صفحه می‌ماند."); }}><Check size={16} />{state.done ? "خوانده‌ام" : "خواندم"}</button></div><p className="lp-feedback" role="status">{message}</p></section>;
}
export function ArticleNotebook({ scope, slug, title }: { scope: string; slug: string; title: string }) {
  const [state, saveState] = useBrowserState(localKey(scope, `reading:${slug}`), initial, validState);
  const [draft, setDraft] = useState<Pick<ReadingState, "note" | "observation" | "hypothesis" | "nextStep"> | null>(null);
  const [message, setMessage] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const value = draft || state;
  const dirty = draft !== null;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function change(key: "note" | "observation" | "hypothesis" | "nextStep", text: string) { setDraft({ note: value.note, observation: value.observation, hypothesis: value.hypothesis, nextStep: value.nextStep, [key]: text }); setMessage("تغییرات هنوز ذخیره نشده‌اند."); }
  function exportNote() {
    downloadText(`hadiran-notes-${slug}.txt`, `یادداشت شخصی / ${title}\n\nبرداشت من:\n${value.note}\n\nمشاهده:\n${value.observation}\n\nفرض‌های من:\n${value.hypothesis}\n\nقدم بعدی:\n${value.nextStep}\n\nاین متن یادداشت شخصی است، نه تشخیص یا تفسیر آزمون.`);
    setMessage("فایل متنی برای دریافت آماده شد؛ محتوایی به سرور فرستاده نشد.");
  }
  return <section className="lp-notebook" aria-labelledby="notebook-title"><div className="lp-notebook-heading"><span className="lp-eyebrow">از خواندن تا به کار بستن</span><span aria-hidden="true">✳</span></div><h2 id="notebook-title">این فکر، در زندگی تو چه شکلی است؟</h2><p className="lp-local-note">یادداشت شخصی و کاربرگِ یک قدم بعدی. با زدن «ذخیره»، فقط در همین مرورگر و برای این حساب یا مهمان نگه داشته می‌شود؛ بدون ارسال به سرور، همگام‌سازی یا رمزگذاری. روی دستگاه مشترک، اطلاعات حساس ننویس.</p><label className="lp-note-field">برداشت من از این نوشته<textarea maxLength={10000} rows={4} value={value.note} onChange={e => change("note", e.target.value)} placeholder="کدام جمله یا پرسش را می‌خواهم با خودم ببرم؟" /></label><details className="lp-worksheet"><summary>کاربرگ سه‌قدم؛ از یک مشاهده تا یک آزمایش کوچک</summary><div>{[["observation", "۰۱ / چه چیزی را واقعاً مشاهده کردم؟", "یک اتفاق مشخص، بدون قضاوت…"], ["hypothesis", "۰۲ / چه توضیح‌های دیگری ممکن است؟", "دست‌کم دو فرض، نه یک حکم…"], ["nextStep", "۰۳ / قدم کوچک بعدی من چیست؟", "چه کاری، چه زمانی و با چه نشانه‌ای برای بازبینی؟"]].map(([key, label, placeholder]) => <label className="lp-note-field" key={key}>{label}<textarea maxLength={10000} rows={3} value={value[key as keyof typeof value]} onChange={e => change(key as "observation" | "hypothesis" | "nextStep", e.target.value)} placeholder={placeholder} /></label>)}</div></details><div className="lp-tool-row"><button type="button" className="lp-button" disabled={!dirty} onClick={() => {
    const persisted = saveState({ ...state, ...value }); setDraft(null); setMessage(persisted ? "یادداشت و کاربرگ در این مرورگر ذخیره شد." : "ذخیرهٔ پایدار ممکن نشد؛ فایل را دریافت کن. داده فقط تا بستن صفحه می‌ماند.");
  }}><Save size={17} /> ذخیرهٔ یادداشت</button><button type="button" className="lp-tool-button" onClick={exportNote}><Download size={17} /> دریافت فایل متنی</button><button type="button" className="lp-tool-button" onClick={() => setConfirmClear(true)}><Trash2 size={17} /> پاک کردن یادداشت</button></div><p className="lp-feedback" role="status">{message || (dirty ? "تغییرات ذخیره نشده‌اند." : "")}</p><ToolDialog open={confirmClear} onClose={() => setConfirmClear(false)} title="یادداشت این نوشته پاک شود؟"><p className="lp-local-note">متن یادداشت و کاربرگ این نوشته از همین مرورگر پاک می‌شود. این کار قابل بازگشت نیست؛ نشان و جای مطالعه حفظ می‌شود.</p><div className="lp-tool-row"><button type="button" className="lp-button" onClick={() => { const persisted = saveState({ ...state, note: "", observation: "", hypothesis: "", nextStep: "" }); setDraft(null); setConfirmClear(false); setMessage(persisted ? "یادداشت و کاربرگ پاک شد." : "پاک‌کردن پایدار ممکن نشد؛ دسترسی به حافظهٔ مرورگر را بررسی کن."); }}>بله، پاک کن</button><button type="button" className="lp-tool-button" onClick={() => setConfirmClear(false)}>انصراف</button></div></ToolDialog></section>;
}
