"use client";

import { previewFetch as fetch } from "@/lib/auth/preview-fetch";

import { useEffect, useRef, useState } from "react";
import Link from "@/components/workspace/WorkspaceLink";
import { Check, Copy, Loader2, ArrowUp, ArrowUpLeft, RotateCcw, Sparkles, ScanLine, GitBranch, Workflow, BookOpen, FlaskConical, GraduationCap, Hash } from "lucide-react";
import type { ChatReferences } from "@/lib/ai";
import { MarkdownReadonly } from "@/components/MarkdownReadonly";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  references?: ChatReferences | null;
}

const STORAGE_KEY = "hw3-conversation-id";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "سلام. مسئله‌ات را بگو تا با هم شفافش کنیم — از گلوگاه روزمره تا معماری سیستم. اول می‌بینیم، بعد می‌سازیم.",
};

const STARTERS = [
  {
    label: "ایده‌ام را روشن کنیم",
    note: "از یک ایدهٔ خام تا محدوده و اولویت‌ها",
    icon: ScanLine,
    prompt: "در حال شروع یک پروژه جدید هستم و نیاز دارم محدوده و اولویت‌ها را روشن کنم.",
  },
  {
    label: "یک تصمیم بهتر بگیریم",
    note: "مقایسهٔ مسیرها، فرض‌ها و هزینه‌ها",
    icon: GitBranch,
    prompt: "بین دو رویکرد فنی مردد هستم و می‌خواهم فرض‌ها و هزینه هر کدام را بررسی کنم.",
  },
  {
    label: "گره کار را پیدا کنیم",
    note: "دیدن مسئلهٔ اصلی در یک فرایند",
    icon: Workflow,
    prompt: "فرایند کاری ما یک گلوگاه دارد و نمی‌دانم مسئله اصلی دقیقاً کجاست.",
  },
];

function hasAny(refs?: ChatReferences | null) {
  if (!refs) return false;
  return refs.knowledge.length + refs.projects.length + refs.courses.length + refs.topics.length > 0;
}

export function HomeChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasConversation = messages.length > 1;

  useEffect(() => {
    const element = inputRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
  }, [input]);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const savedId = raw ? Number(raw) : NaN;
    if (!Number.isInteger(savedId) || savedId < 1) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/chat?conversationId=${savedId}`);
        if (!res.ok) {
          sessionStorage.removeItem(STORAGE_KEY);
          return;
        }
        const data = (await res.json()) as { conversationId: number; messages: ChatMessage[] };
        if (cancelled) return;
        setConversationId(data.conversationId);
        setMessages(data.messages.length > 0 ? data.messages : [GREETING]);
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  function resetConversation() {
    sessionStorage.removeItem(STORAGE_KEY);
    setConversationId(null);
    setMessages([GREETING]);
    setInput("");
    inputRef.current?.focus();
  }

  async function copyMessage(content: string, index: number) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(index);
      window.setTimeout(() => setCopiedMessageId(null), 1800);
    } catch {
      setCopiedMessageId(null);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const userMessage = input.trim();
    if (!userMessage || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, conversationId }),
      });
      const data = (await res.json()) as {
        answer?: string;
        references?: ChatReferences;
        conversationId?: number | null;
        error?: string;
      };

      if (typeof data.conversationId === "number") {
        setConversationId(data.conversationId);
        sessionStorage.setItem(STORAGE_KEY, String(data.conversationId));
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || data.error || "پاسخی دریافت نشد.",
          references: data.references,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "متاسفانه مشکلی در برقراری ارتباط پیش آمد. لطفاً دوباره تلاش کنید." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="home-chat" aria-label="گفتگو با هادیران">
      {hasConversation ? (
        <div className="home-chat-conversation">
          <div className="home-chat-toolbar">
            <span className="home-chat-identity"><Sparkles size={16} aria-hidden="true" /> گفت‌وگو با هادیران</span>
            <button type="button" className="home-chat-reset" onClick={resetConversation} disabled={isLoading}>
              <RotateCcw size={14} aria-hidden="true" /> گفت‌وگوی تازه
            </button>
          </div>
          <div
            ref={scrollRef}
            className="home-chat-thread"
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            aria-busy={isLoading}
            aria-label="پیام‌های گفتگو"
          >
            {messages.map((msg, idx) => {
              if (idx === 0 && msg.content === GREETING.content) return null;
              return (
                <article key={idx} className={`home-chat-message home-chat-message--${msg.role}`} aria-label={msg.role === "user" ? "پیام شما" : "پاسخ هادیران"}>
                  {msg.role === "assistant" ? (
                    <span className="home-chat-answer-label"><Sparkles size={14} aria-hidden="true" /> هادیران</span>
                  ) : null}
                  {msg.role === "assistant" ? (
                    <MarkdownReadonly source={msg.content} className="home-chat-answer" dir="auto" />
                  ) : (
                    <p className="home-chat-user-text" dir="auto">{msg.content}</p>
                  )}
              {hasAny(msg.references) && msg.references && (
                <div className="chat-references mt-4 space-y-3 pt-3">
                  <ReferenceGroup
                    label="منابع دانشی"
                    href={(slug) => `/knowledge/${slug}`}
                    items={msg.references.knowledge.map((k) => ({ slug: k.slug, label: k.title }))}
                    className="reference-chip reference-chip-knowledge"
                    icon={BookOpen}
                  />
                  <ReferenceGroup
                    label="کارگاه"
                    href={(slug) => `/lab/${slug}`}
                    items={msg.references.projects.map((p) => ({ slug: p.slug, label: p.name }))}
                    className="reference-chip reference-chip-project"
                    icon={FlaskConical}
                  />
                  <ReferenceGroup
                    label="دوره‌های پیشنهادی"
                    href={(slug) => `/courses/${slug}`}
                    items={msg.references.courses.map((c) => ({ slug: c.slug, label: c.title }))}
                    className="reference-chip reference-chip-course"
                    icon={GraduationCap}
                  />
                  <ReferenceGroup
                    label="موضوعات"
                    href={(slug) => `/topics/${slug}`}
                    items={msg.references.topics.map((t) => ({ slug: t.slug, label: t.name }))}
                    className="reference-chip reference-chip-topic"
                    icon={Hash}
                  />
                </div>
              )}
                  {msg.role === "assistant" ? (
                    <button type="button" className="home-chat-copy" onClick={() => void copyMessage(msg.content, idx)} aria-label={copiedMessageId === idx ? "پاسخ کپی شد" : "کپی پاسخ"}>
                      {copiedMessageId === idx ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                      <span>{copiedMessageId === idx ? "کپی شد" : "کپی پاسخ"}</span>
                    </button>
                  ) : null}
                </article>
              );
            })}
            {isLoading ? (
              <div className="home-chat-thinking" role="status">
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                <span>دارم مسئله‌ات را بررسی می‌کنم…</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="home-chat-intro">
          <span className="home-chat-identity"><Sparkles size={16} aria-hidden="true" /> فضای هم‌فکری تو</span>
          <h2>از کجا شروع کنیم؟</h2>
        </div>
      )}

      <form onSubmit={handleSend} className="home-chat-composer" aria-label="ارسال مسئله به هادیران">
        <label htmlFor="home-chat-input" className="sr-only">مسئله یا پرسش</label>
        <textarea
          ref={inputRef}
          id="home-chat-input"
          rows={2}
          maxLength={12000}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="هر چیزی که ذهنت را مشغول کرده، اینجا بنویس…"
          className="home-chat-textarea"
          aria-describedby="home-chat-keyboard-hint"
        />
        <div className="home-chat-composer-footer">
          <button type="submit" disabled={isLoading || !input.trim()} className="home-chat-send" aria-label={isLoading ? "در حال دریافت پاسخ" : "ارسال پیام"}>
            {isLoading ? <Loader2 size={19} className="animate-spin" aria-hidden="true" /> : <ArrowUp size={20} aria-hidden="true" />}
          </button>
        </div>
      </form>
      <div className="home-chat-under-composer">
        <p>از ابهام شروع کن؛ لازم نیست سؤال کاملی داشته باشی.</p>
        <p id="home-chat-keyboard-hint" className="home-chat-keyboard-hint"><kbd>Enter</kbd> ارسال <span aria-hidden="true">·</span> <kbd>Shift + Enter</kbd> خط جدید</p>
      </div>

      {!hasConversation ? (
        <div className="home-chat-suggestions">
          <p className="home-chat-suggestions-label">یا با یکی از این مسیرها شروع کن</p>
          <div className="home-chat-suggestion-grid">
            {STARTERS.map((starter) => (
              <button key={starter.label} type="button" className="home-chat-suggestion" onClick={() => {
                setInput(starter.prompt);
                inputRef.current?.focus();
              }}>
                <span className="home-chat-suggestion-top"><starter.icon size={18} strokeWidth={1.6} aria-hidden="true" /><ArrowUpLeft size={15} className="home-chat-suggestion-arrow" aria-hidden="true" /></span>
                <span className="home-chat-suggestion-title">{starter.label}</span>
                <span className="home-chat-suggestion-note">{starter.note}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <p className="home-chat-disclaimer">پاسخ‌ها می‌توانند خطا داشته باشند؛ تصمیم‌های مهم را بررسی کن.</p>
    </section>
  );
}

function ReferenceGroup({
  label,
  items,
  href,
  className,
  icon: Icon,
}: {
  label: string;
  items: { slug: string; label: string }[];
  href: (slug: string) => string;
  className: string;
  icon: typeof BookOpen;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-slate-400 dark:text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={`${label}-${item.slug}`}
            href={href(item.slug)}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${className}`}
          >
            <Icon className="h-3 w-3" />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
