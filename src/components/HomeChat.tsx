"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send, BookOpen, FlaskConical, GraduationCap, Hash } from "lucide-react";
import type { ChatReferences } from "@/lib/ai";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  references?: ChatReferences | null;
}

const STORAGE_KEY = "hw3-conversation-id";

const GREETING: ChatMessage = {
  role: "assistant",
  content: "سلام. مسئله‌ات را بگو تا با هم شفافش کنیم — از بازنمایی ایده تا معماری سیستم، هوش مصنوعی و وب۳.",
};

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

  function fitArea() {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const userMessage = input.trim();
    if (!userMessage || isLoading) return;

    setInput("");
    requestAnimationFrame(() => {
      if (areaRef.current) {
        areaRef.current.style.height = "auto";
      }
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

  return (
    <div className="flex min-h-[24rem] flex-1 flex-col">
      <div ref={scrollRef} className="relative mb-3 flex-1 space-y-4 overflow-y-auto px-1 py-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
            <div
              className={`chat-in max-w-[85%] p-4 text-sm leading-[1.85] whitespace-pre-wrap ${
                msg.role === "user"
                  ? "rounded-[var(--radius-md)] rounded-ss-sm bg-accent-soft text-ink"
                  : "rounded-[var(--radius-md)] rounded-se-sm border border-line bg-elev text-ink"
              }`}
            >
              <p>{msg.content}</p>
              {hasAny(msg.references) && msg.references && (
                <div className="mt-4 space-y-3 border-t border-line pt-3">
                  <ReferenceGroup
                    label="منابع دانشی"
                    href={(slug) => `/knowledge/${slug}`}
                    items={msg.references.knowledge.map((k) => ({ slug: k.slug, label: k.title }))}
                    icon={BookOpen}
                  />
                  <ReferenceGroup
                    label="پروژه‌های مرتبط"
                    href={(slug) => `/lab/${slug}`}
                    items={msg.references.projects.map((p) => ({ slug: p.slug, label: p.name }))}
                    icon={FlaskConical}
                  />
                  <ReferenceGroup
                    label="دوره‌های پیشنهادی"
                    href={(slug) => `/courses/${slug}`}
                    items={msg.references.courses.map((c) => ({ slug: c.slug, label: c.title }))}
                    icon={GraduationCap}
                  />
                  <ReferenceGroup
                    label="موضوعات"
                    href={(slug) => `/topics/${slug}`}
                    items={msg.references.topics.map((t) => ({ slug: t.slug, label: t.name }))}
                    icon={Hash}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading ? (
          <div className="flex justify-end">
            <div className="chat-in rounded-[var(--radius-md)] rounded-se-sm border border-line bg-elev px-4 py-3">
              <span className="thinking-dots" role="status" aria-label="در حال فکر کردن">
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

      <form
        onSubmit={handleSend}
        className={`composer-shell relative ${isLoading ? "is-loading" : ""}`}
      >
        <textarea
          ref={areaRef}
          rows={1}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
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
          className="absolute top-2 bottom-2 left-2 inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:bg-line disabled:text-muted"
        >
          <Send className="h-4 w-4" strokeWidth={1.5} />
          ارسال
        </button>
      </form>
    </div>
  );
}

function ReferenceGroup({
  label,
  items,
  href,
  icon: Icon,
}: {
  label: string;
  items: { slug: string; label: string }[];
  href: (slug: string) => string;
  icon: typeof BookOpen;
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
            className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:border-accent"
          >
            <Icon className="h-3 w-3 text-muted" strokeWidth={1.5} />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
