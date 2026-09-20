"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, BookOpen, FlaskConical, GraduationCap, Hash } from "lucide-react";
import Link from "next/link";
import type { RetrievedEntity, AIResponse } from "@/lib/ai";

interface Message {
  role: "user" | "assistant";
  content: string;
  related?: RetrievedEntity[];
}

const iconForType = {
  knowledge: BookOpen,
  project: FlaskConical,
  course: GraduationCap,
  topic: Hash,
};

const pathForType = {
  knowledge: "/knowledge",
  project: "/lab",
  course: "/courses",
  topic: "/knowledge",
};

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "سلام! من AI هادیران‌وب۳ هستم. دربارهٔ دانش، دوره‌ها و پروژه‌ها ازم بپرس.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = (await res.json()) as AIResponse;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, related: data.related },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "مشکلی در ارتباط با AI پیش آمد. لطفاً دوباره امتحان کن." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[28rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "rounded-bl-none bg-indigo-600 text-white"
                  : "rounded-br-none bg-slate-100 text-slate-800"
              }`}
            >
              <p>{msg.content}</p>
              {msg.related && msg.related.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs opacity-80">منابع و موارد مرتبط:</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.related.map((item) => {
                      const Icon = iconForType[item.type];
                      return (
                        <Link
                          key={`${item.type}-${item.slug}`}
                          href={`${pathForType[item.type]}/${item.slug}`}
                          className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-white"
                        >
                          <Icon className="h-3 w-3" />
                          {item.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-br-none bg-slate-100 px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-slate-200 bg-white p-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="مثلاً: وب۳ چیست؟"
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-50"
          aria-label="ارسال"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
