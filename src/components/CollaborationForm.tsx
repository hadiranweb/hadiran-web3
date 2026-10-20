"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";

interface Role {
  id: number;
  labelFa: string;
}

interface Props {
  projectId: number;
  roles: Role[];
}

export function CollaborationForm({ projectId, roles }: Props) {
  const [form, setForm] = useState({
    roleId: "",
    fullName: "",
    email: "",
    message: "",
    portfolioUrl: "",
    skills: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/collaborate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          roleId: form.roleId ? Number(form.roleId) : undefined,
          fullName: form.fullName,
          email: form.email,
          message: form.message,
          portfolioUrl: form.portfolioUrl,
          skills: form.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setError("مشکلی در ارسال پیش آمد. لطفاً دوباره امتحان کن.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-[var(--radius-md)] border border-line bg-paper p-6 text-center">
        <CheckCircle className="mx-auto mb-3 h-10 w-10 text-good" />
        <h3 className="text-lg font-bold text-ink">درخواست ثبت شد</h3>
        <p className="text-sm text-muted">هادیران درخواستت را بررسی می‌کند و با تو تماس می‌گیرد.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {roles.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">نقش موردنظر</label>
          <select
            value={form.roleId}
            onChange={(e) => setForm({ ...form, roleId: e.target.value })}
            className="w-full rounded-[var(--radius-md)] border border-line bg-elev px-4 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <option value="">انتخاب نقش...</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.labelFa}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">نام کامل</label>
          <input
            required
            type="text"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full rounded-[var(--radius-md)] border border-line bg-elev px-4 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">ایمیل</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-[var(--radius-md)] border border-line bg-elev px-4 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">پیام</label>
        <textarea
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full rounded-[var(--radius-md)] border border-line bg-elev px-4 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">لینک نمونه کار</label>
          <input
            type="url"
            value={form.portfolioUrl}
            onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
            className="w-full rounded-[var(--radius-md)] border border-line bg-elev px-4 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">مهارت‌ها (با کاما جدا کن)</label>
          <input
            type="text"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            className="w-full rounded-[var(--radius-md)] border border-line bg-elev px-4 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
        </div>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg disabled:opacity-50"
      >
        {loading ? "در حال ارسال..." : "ارسال درخواست"}
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
