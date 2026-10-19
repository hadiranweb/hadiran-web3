"use client";

import { useEffect, useRef, useState, type ToggleEvent } from "react";
import { ArrowDown, ArrowUpLeft, BookOpen, Copy, Shuffle } from "lucide-react";
import Link from "next/link";
import { HomeChat } from "@/components/HomeChat";
import { MarkdownReadonly } from "@/components/MarkdownReadonly";
import { nextGardenIndex, type GardenSnapshot } from "@/lib/garden/types";
import { QuietLink } from "./QuietLink";
import "./garden.css";

const kinds: Record<string, string> = {
  idea: "ایده", note: "یادداشت", article: "مقاله", research: "پژوهش", wiki: "ویکی",
};

function fold(event: ToggleEvent<HTMLDetailsElement>) {
  const element = event.currentTarget;
  if (!element.open || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  element.querySelector<HTMLElement>(".gw-paper-body")?.animate(
    [{ opacity: 0, transform: "translateY(-4px)" }, { opacity: 1, transform: "none" }],
    { duration: 200, easing: "ease-out" },
  );
}

export function GardenPreview({ snapshot }: { snapshot: GardenSnapshot }) {
  const [chatOpen, setChatOpen] = useState(true);
  const [picked, setPicked] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string } | null>(null);
  const reading = useRef<HTMLElement>(null);
  const chatDoor = useRef<HTMLAnchorElement>(null);
  const chat = useRef<HTMLDivElement>(null);
  const toast = useRef<HTMLDivElement>(null);
  const details = useRef(new Map<string, HTMLDetailsElement>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    if (!notice || !toast.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = toast.current.animate([
      { opacity: 0, transform: "translateY(5px)", offset: 0 },
      { opacity: 1, transform: "none", offset: .12 },
      { opacity: 1, offset: .8 }, { opacity: 0, offset: 1 },
    ], { duration: 1400 });
    return () => animation.cancel();
  }, [notice]);

  function message(text: string) {
    if (timer.current) clearTimeout(timer.current);
    setNotice({ text });
    timer.current = setTimeout(() => setNotice(null), 1400);
  }

  function onCopy() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.anchorNode || !selection.focusNode) return;
    if (reading.current?.contains(selection.anchorNode) && reading.current.contains(selection.focusNode)) {
      message("امانت باشد دستت.");
    }
  }

  function pick() {
    const random = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
    const index = nextGardenIndex(snapshot.notes.length, last.current, random);
    if (index == null) return;
    last.current = index;
    const note = snapshot.notes[index];
    const element = details.current.get(note.slug);
    setPicked(note.slug);
    if (element) {
      element.open = true;
      element.scrollIntoView({ block: "start", behavior: "instant" });
      element.querySelector<HTMLElement>("summary")?.focus({ preventScroll: true });
    }
  }

  async function copy(slug: string) {
    const text = details.current.get(slug)?.querySelector<HTMLElement>(".gw-note-text")?.innerText;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      message("امانت باشد دستت.");
    } catch {
      message("کپی انجام نشد؛ متن را انتخاب کنید.");
    }
  }

  function openChat() {
    setChatOpen(true);
    requestAnimationFrame(() => chat.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus());
  }

  return (
    <main className="gw-page" data-source={snapshot.source}>
      <div className="gw-wrap">
        <div className="gw-preview-label">
          <span>نمونهٔ مستقلِ تجربه</span>
          <Link href="/" prefetch={false}>صفحهٔ اصلی فعلی <ArrowUpLeft size={14} /></Link>
        </div>
        <header className="gw-hero">
          <span className="gw-eyebrow">هادیران / کارگاه فکر</span>
          <h1>کمی مکث.<br />بعد، <em>روشن‌تر ببینیم.</em></h1>
          <p>با یک مسئله آمده‌ای، یا فقط کنجکاوی؟<br />از هر دو در می‌شود وارد شد.</p>
          <span className="gw-editorial">برای سؤال‌هایی که هنوز جواب آماده ندارند.</span>
        </header>

        <nav className="gw-doors" aria-label="دو راه ورود">
          <Link prefetch={false} className="gw-door gw-door-hunter" href="#garden-chat" ref={chatDoor} onClick={openChat}>
            <span className="gw-door-number">۰۱ / یک مسئله روی میز</span>
            <h2>یک گره را باز کنیم.</h2>
            <p>از همان چیزی شروع کن که گیر کرده؛<br />لازم نیست صورت‌مسئله کامل باشد.</p>
            <span className="gw-door-action">مسئله‌ام را می‌نویسم <ArrowDown size={17} /></span>
            <svg viewBox="0 0 120 58" aria-hidden="true">
              <path d="M8 30C18 5 60 5 58 30S26 55 34 29 94 6 112 30" />
            </svg>
          </Link>
          <Link prefetch={false} className="gw-door gw-door-wander" href="#garden-notes">
            <span className="gw-door-number">۰۲ / بی‌نقشه، نه بی‌جهت</span>
            <h2>در کارگاه بگرد.</h2>
            <p>یادداشتی باز کن. از یک پیوند برو جلو.<br />شاید سؤال تازه‌ای پیدا شد.</p>
            <span className="gw-door-action">ببینم چه فکرهایی اینجاست <ArrowDown size={17} /></span>
            <svg viewBox="0 0 120 58" aria-hidden="true">
              <path d="M10 44C28 44 24 13 51 13S63 44 88 44 101 17 112 17M51 13V4M88 44V54" />
            </svg>
          </Link>
        </nav>

        <section className="gw-proposition">
          <p>گاهی پیش از انتخاب راه‌حل، باید <strong>صورت‌مسئله</strong> را دوباره ببینیم.</p>
          <details onToggle={fold}>
            <summary>کمی بازش کنیم؟</summary>
            <div className="gw-paper-body">
              <p>نشانه‌ای که می‌بینیم، همیشه خودِ مسئله نیست. می‌شود پیش از پیشنهاد ابزار، از اتفاق مشخص، نتیجهٔ مطلوب و کارهایی که قبلاً آزموده‌ایم پرسید.</p>
              <p>این یک دعوت به فکرکردن است، نه تشخیص دربارهٔ تو یا سازمانت.</p>
            </div>
          </details>
        </section>

        <section className="gw-chat-section" id="garden-chat" aria-labelledby="gw-chat-heading">
          <div className="gw-section-heading">
            <div>
              <span className="gw-eyebrow">درِ اول</span>
              <h2 id="gw-chat-heading">همین گره، به زبان خودت.</h2>
            </div>
            {chatOpen ? (
              <button className="gw-text-button" onClick={() => { setChatOpen(false); chatDoor.current?.focus(); }}>
                بماند برای وقتی دیگر.
              </button>
            ) : <button className="gw-button" onClick={openChat}>گفت‌وگو را باز کنیم</button>}
          </div>
          <div className="gw-chat" ref={chat} hidden={!chatOpen}>
            <p className="gw-chat-privacy">این گفت‌وگو از مسیر فعلی سایت می‌گذرد و می‌تواند در سرور ذخیره شود.</p>
            <HomeChat />
          </div>
        </section>

        <section className="gw-reading" id="garden-notes" ref={reading} onCopy={onCopy} aria-labelledby="gw-notes-heading">
          <div className="gw-section-heading">
            <div>
              <span className="gw-eyebrow">درِ دوم</span>
              <h2 id="gw-notes-heading">چند فکر روی میز.</h2>
              <p>برای بازکردن هر یادداشت، عنوانش را انتخاب کن.</p>
            </div>
            <button className="gw-button" disabled={!snapshot.notes.length} onClick={pick}>
              <Shuffle size={16} />یک یادداشت بردار
            </button>
          </div>
          {snapshot.source !== "live" ? (
            <p className="gw-empty" role="status">یادداشت‌های عمومی در دسترس نیستند؛ دادهٔ نمونه جای آن‌ها ننشسته است.</p>
          ) : !snapshot.notes.length ? (
            <p className="gw-empty" role="status">هنوز یادداشت عمومیِ قابل انتشاری در این گوشه نداریم.</p>
          ) : (
            <>
              <p className="gw-pool">انتخاب از {snapshot.notes.length.toLocaleString("fa-IR")} یادداشتِ همین نما · فقط محتوای منتشرشدهٔ عمومی</p>
              <div className="gw-notes">
                {snapshot.notes.map((note, index) => (
                  <article key={note.slug} className="gw-note" data-note={note.slug} data-picked={picked === note.slug}>
                    <details onToggle={fold} ref={element => {
                      if (element) details.current.set(note.slug, element);
                      else details.current.delete(note.slug);
                    }}>
                      <summary>
                        <span className="gw-note-index">{String(index + 1).padStart(2, "0")}</span>
                        <span className="gw-note-heading">
                          <span className="gw-note-kind">{kinds[note.type] || "نوشته"} · انتشار عمومی</span>
                          <h3>{note.title}</h3>
                          {note.summary ? <span className="gw-note-summary">{note.summary}</span> : null}
                        </span>
                        <span className="gw-note-open" aria-hidden="true">＋</span>
                      </summary>
                      <div className="gw-paper-body">
                        <MarkdownReadonly className="gw-note-text" source={note.body} emptyLabel="متنی برای این یادداشت ثبت نشده است." />
                        {note.excerpted ? <p className="gw-pool">بخشی از متن در این نما آمده است.</p> : null}
                        {note.topics.length ? (
                          <div className="gw-topics">
                            <span>ردِ موضوع:</span>
                            {note.topics.map(topic => (
                              <QuietLink key={topic.slug} href={`/knowledge?topic=${encodeURIComponent(topic.slug)}`}>{topic.label}</QuietLink>
                            ))}
                          </div>
                        ) : null}
                        <div className="gw-note-foot">
                          <Link prefetch={false} className="gw-full-link" href={`/knowledge/${encodeURIComponent(note.slug)}`}>
                            صفحهٔ مستقل یادداشت <ArrowUpLeft size={14} />
                          </Link>
                          {note.body ? (
                            <button className="gw-text-button" onClick={() => void copy(note.slug)} aria-label={`کپی متنِ ${note.title}`}>
                              <Copy size={14} />کپی این بخش
                            </button>
                          ) : null}
                        </div>
                        {note.updatedAt ? (
                          <p className="gw-updated">به‌روزرسانی متن: <time dateTime={note.updatedAt}>{new Intl.DateTimeFormat("fa-IR", {
                            dateStyle: "medium", timeZone: "UTC",
                          }).format(new Date(note.updatedAt))}</time> UTC</p>
                        ) : null}
                      </div>
                    </details>
                  </article>
                ))}
              </div>
            </>
          )}
          <div className="gw-garden-foot">
            <QuietLink href="/knowledge">راهِ دانشنامه</QuietLink>
            <a href="/api/garden-preview">دادهٔ عمومی این نما · JSON</a>
          </div>
        </section>

        <aside className="gw-honesty">
          <BookOpen size={20} strokeWidth={1.3} />
          <div>
            <h2>چیزی که اینجا می‌بینی، همان چیزی است که داریم.</h2>
            <p>«انتشار عمومی» وضعیت دسترسی به نوشته است؛ نه گواهِ آزمون میدانی. تاریخچه و شمار بازبینی فکرها هنوز در این نمونه نمایش داده نمی‌شود.</p>
          </div>
        </aside>
        <footer className="gw-ending">
          <span className="gw-eyebrow">برای وقتِ دیگر</span>
          <p>اینجا پایان صفحه است؛<br /><em>مسئله می‌تواند هنوز باز بماند.</em></p>
          <span>گاهی یک سؤال دقیق، از چند پاسخ آماده جلوتر است.</span>
        </footer>
      </div>
      <div className="gw-toast" ref={toast} role="status" aria-live="polite">{notice?.text}</div>
    </main>
  );
}
