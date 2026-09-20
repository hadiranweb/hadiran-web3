"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Send, BookOpen, FlaskConical, GraduationCap, Hash } from "lucide-react";
import type { ChatReferences } from "@/lib/ai";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  references?: ChatReferences | null;
}

const STORAGE_KEY = "hw3-conversation-id";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "سلام. مسئله‌ات را بگو تا با هم شفافش کنیم — از بازنمایی ایده تا معماری سیستم، هوش مصنوعی و وب۳.",
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
    <div className="flex min-h-[24rem] flex-1 flex-col">
      <div
        ref={scrollRef}
        className="mb-4 flex-1 space-y-6 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-100/50 p-4 dark:border-slate-800 dark:bg-slate-900/40"
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[85%] rounded-2xl p-4 ${
                msg.role === "user"
                  ? "rounded-tr-none bg-indigo-600 text-white"
                  : "rounded-tl-none border border-slate-200 bg-white text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              {hasAny(msg.references) && msg.references && (
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <ReferenceGroup
                    label="منابع دانشی"
                    href={(slug) => `/knowledge/${slug}`}
                    items={msg.references.knowledge.map((k) => ({ slug: k.slug, label: k.title }))}
                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    icon={BookOpen}
                  />
                  <ReferenceGroup
                    label="پروژه‌های مرتبط"
                    href={(slug) => `/lab/${slug}`}
                    items={msg.references.projects.map((p) => ({ slug: p.slug, label: p.name }))}
                    className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    icon={FlaskConical}
                  />
                  <ReferenceGroup
                    label="دوره‌های پیشنهادی"
                    href={(slug) => `/courses/${slug}`}
                    items={msg.references.courses.map((c) => ({ slug: c.slug, label: c.title }))}
                    className="bg-amber-50 text-amber-700 hover:bg-amber-100"
                    icon={GraduationCap}
                  />
                  <ReferenceGroup
                    label="موضوعات"
                    href={(slug) => `/topics/${slug}`}
                    items={msg.references.topics.map((t) => ({ slug: t.slug, label: t.name }))}
                    className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                    icon={Hash}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-tl-none border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="مسئله، ایده یا سؤالت را بنویس..."
          className="w-full rounded-2xl border border-slate-200 bg-white p-4 pl-28 shadow-lg outline-none transition focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="absolute top-2 bottom-2 left-2 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:bg-slate-300"
        >
          <Send className="h-4 w-4" />
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
