"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import type { ChatReferences } from "@/lib/ai";
import { MarkdownReadonly } from "@/components/MarkdownReadonly";
import { clearDraft, readDraft, writeDraft } from "@/lib/ui/draft";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  references?: ChatReferences | null;
}

const STORAGE_KEY = "hw3-conversation-id";
const COMPOSER_KEY = "home-composer";

const GREETING: ChatMessage = {
  role: "assistant",
  content: "سلام. مسئله‌ات را بگو تا با هم شفافش کنیم — از گلوگاه روزمره تا معماری سیستم. اول می‌بینیم، بعد می‌سازیم.",
};

const STARTERS = [
  {
    label: "ایده‌ام را روشن کنیم",
    prompt: "در حال شروع یک پروژه جدید هستم و نیاز دارم محدوده و اولویت‌ها را روشن کنم.",
  },
  {
    label: "یک تصمیم بهتر بگیریم",
    prompt: "بین دو رویکرد فنی مردد هستم و می‌خواهم فرض‌ها و هزینه هر کدام را بررسی کنم.",
  },
  {
    label: "گره کار را پیدا کنیم",
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const empty = messages.length <= 1;

  useEffect(() => {
    const draft = readDraft<string>(COMPOSER_KEY);
    if (typeof draft === "string" && draft) {
      // پیش‌نویس فقط بعد از هیدریشن خوانده می‌شود؛ سرور آن را نمی‌بیند.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInput(draft);
      requestAnimationFrame(() => fitArea());
    }
  }, []);

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
    fitArea();
  }, [input]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  function fitArea() {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }

  function resetConversation() {
    sessionStorage.removeItem(STORAGE_KEY);
    setConversationId(null);
    setMessages([GREETING]);
    setInput("");
    clearDraft(COMPOSER_KEY);
    requestAnimationFrame(() => areaRef.current?.focus());
  }

  async function sendText(userMessage: string) {
    if (!userMessage || isLoading) return;

    setInput("");
    clearDraft(COMPOSER_KEY);
    requestAnimationFrame(() => {
      if (areaRef.current) areaRef.current.style.height = "auto";
    });
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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    await sendText(input.trim());
  }

  return (
    <section className="flex min-h-[24rem] flex-1 flex-col" aria-label="گفتگو با هادیران">
      <form
        onSubmit={(event) => void handleSend(event)}
        className={`composer-shell relative mb-3 ${isLoading ? "is-loading" : ""}`}
        aria-busy={isLoading}
      >
        <label htmlFor="home-composer" className="sr-only">
          مسئله، ایده یا سؤال
        </label>
        <textarea
          id="home-composer"
          ref={areaRef}
          rows={1}
          value={input}
          onChange={(e) => {
            const next = e.target.value;
            setInput(next);
            if (next.trim()) writeDraft(COMPOSER_KEY, next);
            else clearDraft(COMPOSER_KEY);
            fitArea();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="مسئله، ایده یا سؤالت را بنویس..."
          className="w-full resize-none bg-transparent p-4 ps-4 pe-28 text-sm leading-7 text-ink outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="absolute top-2 bottom-2 left-2 inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:bg-line disabled:text-muted"
        >
          <Send className="h-4 w-4" strokeWidth={1.5} />
          ارسال
        </button>
      </form>

      {empty && !isLoading ? (
        <ul className="mb-3 flex flex-wrap gap-2 px-1" aria-label="شروع گفتگو">
          {STARTERS.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => void sendText(item.prompt)}
                className="min-h-11 rounded-full border border-line bg-elev px-3.5 py-2 text-xs font-medium text-ink transition hover:border-accent"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}


      {!empty ? (
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <p className="text-xs text-muted">گفت‌وگو با هادیران</p>
          <button
            type="button"
            onClick={resetConversation}
            disabled={isLoading}
            className="min-h-11 rounded-[var(--radius-sm)] px-3 text-xs text-muted hover:text-ink disabled:opacity-50"
          >
            گفت‌وگوی تازه
          </button>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="relative mb-3 flex-1 space-y-4 overflow-y-auto px-1 py-2"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-busy={isLoading}
        aria-label="پیام‌های گفتگو"
      >
        {messages.map((msg, idx) => (
          <article
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
            aria-label={msg.role === "user" ? "پیام شما" : "پاسخ هادیران"}
          >
            <div
              className={`chat-in max-w-[min(85%,75ch)] p-4 text-sm leading-[1.85] ${
                msg.role === "user"
                  ? "rounded-[var(--radius-md)] rounded-ss-sm bg-accent-soft text-ink"
                  : "rounded-[var(--radius-md)] rounded-se-sm border border-line bg-elev text-ink"
              }`}
            >
              {msg.role === "assistant" ? (
                <MarkdownReadonly source={msg.content} className="text-sm" dir="auto" />
              ) : (
                <p className="whitespace-pre-wrap" dir="auto">
                  {msg.content}
                </p>
              )}
              {hasAny(msg.references) && msg.references ? (
                <div className="mt-4 space-y-3 border-t border-line pt-3">
                  <ReferenceGroup
                    label="منابع دانشی"
                    href={(slug) => `/knowledge/${slug}`}
                    items={msg.references.knowledge.map((k) => ({ slug: k.slug, label: k.title }))}
                  />
                  <ReferenceGroup
                    label="کارگاه"
                    href={(slug) => `/lab/${slug}`}
                    items={msg.references.projects.map((p) => ({ slug: p.slug, label: p.name }))}
                  />
                  <ReferenceGroup
                    label="دوره‌های پیشنهادی"
                    href={(slug) => `/courses/${slug}`}
                    items={msg.references.courses.map((c) => ({ slug: c.slug, label: c.title }))}
                  />
                  <ReferenceGroup
                    label="موضوعات"
                    href={(slug) => `/topics/${slug}`}
                    items={msg.references.topics.map((t) => ({ slug: t.slug, label: t.name }))}
                  />
                </div>
              ) : null}
            </div>
          </article>
        ))}
        {isLoading ? (
          <div className="flex justify-end">
            <div className="chat-in rounded-[var(--radius-md)] rounded-se-sm border border-line bg-elev px-4 py-3">
              <p className="text-sm text-muted" role="status">
                در حال فکر کردن…
              </p>
              <span className="thinking-dots mt-2" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </div>
          </div>
        ) : null}
        <div
          aria-hidden="true"
          className="pointer-events-none sticky bottom-0 h-8 bg-gradient-to-t from-paper to-transparent"
        />
      </div>


    </section>
  );
}

function ReferenceGroup({
  label,
  items,
  href,
}: {
  label: string;
  items: { slug: string; label: string }[];
  href: (slug: string) => string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={`${label}-${item.slug}`}
            href={href(item.slug)}
            className="inline-flex items-center rounded-full border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:border-accent"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
