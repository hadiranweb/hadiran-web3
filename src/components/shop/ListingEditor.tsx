"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

export type ListingDraft = {
  id?: string;
  slug?: string;
  titleFa: string;
  titleEn?: string | null;
  summaryFa?: string | null;
  bodyFa?: string | null;
  accessBodyFa?: string | null;
  amount: number;
  currency?: string;
  courseId?: number | null;
  published?: boolean;
};

export function ListingEditor({
  initial,
  courses,
}: {
  initial?: ListingDraft;
  courses: { id: number; titleFa: string; slug: string }[];
}) {
  const router = useRouter();
  const [titleFa, setTitleFa] = useState(initial?.titleFa ?? "");
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [summaryFa, setSummaryFa] = useState(initial?.summaryFa ?? "");
  const [bodyFa, setBodyFa] = useState(initial?.bodyFa ?? "");
  const [accessBodyFa, setAccessBodyFa] = useState(initial?.accessBodyFa ?? "");
  const [amount, setAmount] = useState(String(initial?.amount ?? ""));
  const [courseId, setCourseId] = useState(initial?.courseId ? String(initial.courseId) : "");
  const [published, setPublished] = useState(Boolean(initial?.published));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      titleFa,
      titleEn,
      slug,
      summaryFa,
      bodyFa,
      accessBodyFa,
      amount: Number(amount),
      courseId: courseId || null,
      published,
    };
    try {
      const res = initial?.id
        ? await fetch(`/api/workspace/shop/listings/${initial.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/workspace/shop/listings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "ذخیره نشد.");
        return;
      }
      router.push("/workspace/shop");
      router.refresh();
    } catch {
      setError("ذخیره نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">عنوان فارسی</span>
        <input
          required
          minLength={3}
          value={titleFa}
          onChange={(e) => setTitleFa(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">اسلاگ لاتین</span>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          dir="ltr"
          placeholder="from title_en if empty"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">عنوان انگلیسی (برای اسلاگ)</span>
        <input
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
          dir="ltr"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">مبلغ (ریال)</span>
        <input
          required
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          dir="ltr"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">خلاصهٔ عمومی</span>
        <textarea
          value={summaryFa}
          onChange={(e) => setSummaryFa(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">توضیح ویترین</span>
        <textarea
          value={bodyFa}
          onChange={(e) => setBodyFa(e.target.value)}
          rows={6}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">محتوای تحویل بعد از تسویه</span>
        <textarea
          value={accessBodyFa}
          onChange={(e) => setAccessBodyFa(e.target.value)}
          rows={6}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">قفل دوره (اختیاری)</span>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
        >
          <option value="">بدون دوره</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.titleFa} ({course.slug})
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
        انتشار در /shop
      </label>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        ذخیرهٔ کالا
      </button>
    </form>
  );
}
