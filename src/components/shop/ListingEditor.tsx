"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { shopKindFa, type ShopKind } from "@/lib/shop/kinds";

type CourseOpt = { id: number; titleFa: string; slug: string };
type SpecRow = { key: string; value: string };

type Initial = {
  id: string;
  slug: string;
  titleFa: string;
  titleEn: string | null;
  summaryFa: string | null;
  bodyFa: string | null;
  accessBodyFa: string | null;
  amount: number;
  currency: string;
  kind?: string;
  usdRatio?: number | null;
  comparePrice?: number | null;
  specs?: SpecRow[] | null;
  imageUrls?: string[];
  courseId: number | null;
  published: boolean;
};

export function ListingEditor({
  courses,
  initial,
}: {
  courses: CourseOpt[];
  initial?: Initial;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<ShopKind>(
    initial?.kind === "physical_good" || initial?.kind === "course_access"
      ? initial.kind
      : "digital_entitlement",
  );
  const [specs, setSpecs] = useState<SpecRow[]>(initial?.specs?.length ? initial.specs : [{ key: "", value: "" }]);
  const [imageUrls, setImageUrls] = useState((initial?.imageUrls ?? []).join("\n"));

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      titleFa: String(form.get("titleFa") ?? ""),
      titleEn: String(form.get("titleEn") ?? ""),
      slug: String(form.get("slug") ?? ""),
      summaryFa: String(form.get("summaryFa") ?? ""),
      bodyFa: String(form.get("bodyFa") ?? ""),
      accessBodyFa: String(form.get("accessBodyFa") ?? ""),
      amount: Number(form.get("amount")),
      currency: String(form.get("currency") ?? "IRR"),
      kind,
      usdRatio: String(form.get("usdRatio") ?? "").trim() || null,
      comparePrice: String(form.get("comparePrice") ?? "").trim() || null,
      specs: specs.filter((row) => row.key.trim() && row.value.trim()),
      images: imageUrls,
      courseId: String(form.get("courseId") ?? "") || null,
      published: form.get("published") === "on",
    };
    const url = initial ? `/api/workspace/shop/listings/${initial.id}` : "/api/workspace/shop/listings";
    const res = await fetch(url, {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "ذخیره نشد.");
      return;
    }
    router.push("/workspace/shop");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      <label className="block text-sm">
        عنوان فارسی
        <input name="titleFa" required defaultValue={initial?.titleFa} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
      </label>
      <label className="block text-sm">
        عنوان لاتین (برای اسلاگ)
        <input name="titleEn" defaultValue={initial?.titleEn ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" dir="ltr" />
      </label>
      <label className="block text-sm">
        اسلاگ
        <input name="slug" defaultValue={initial?.slug} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" dir="ltr" />
      </label>
      <fieldset className="rounded-2xl border border-slate-200 p-3">
        <legend className="px-1 text-sm font-medium text-slate-700">نوع کالا</legend>
        <div className="flex flex-wrap gap-3 text-sm">
          {(["digital_entitlement", "physical_good", "course_access"] as const).map((value) => (
            <label key={value} className="flex items-center gap-2">
              <input type="radio" name="kind" checked={kind === value} onChange={() => setKind(value)} />
              {shopKindFa(value)}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm">
        خلاصه
        <textarea name="summaryFa" rows={3} defaultValue={initial?.summaryFa ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
      </label>
      <label className="block text-sm">
        توضیح
        <textarea name="bodyFa" rows={8} defaultValue={initial?.bodyFa ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
      </label>
      <label className="block text-sm">
        متن پس از تأیید پرداخت {kind === "physical_good" ? "(برای فیزیکی: هماهنگی ارسال)" : "(لینک یا دستور دسترسی)"}
        <textarea name="accessBodyFa" rows={5} defaultValue={initial?.accessBodyFa ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          مبلغ (ریال)
          <input name="amount" type="number" min={1} required defaultValue={initial?.amount ?? 0} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" dir="ltr" />
        </label>
        <label className="block text-sm">
          نسبت دلاری (اختیاری)
          <input name="usdRatio" type="number" step="0.0001" min={0} defaultValue={initial?.usdRatio ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" dir="ltr" />
        </label>
        <label className="block text-sm">
          قیمت مقایسه (ریال)
          <input name="comparePrice" type="number" min={0} defaultValue={initial?.comparePrice ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" dir="ltr" />
        </label>
      </div>
      <p className="text-xs text-slate-500">
        اگر نسبت دلاری و نرخ هفته ثبت شده باشد، مبلغ نهایی = گرد روان‌شناختی(نسبت × نرخ) است، نه همان ضرب خام. پرداخت همچنان خارج از سایت است.
      </p>
      <input type="hidden" name="currency" defaultValue={initial?.currency ?? "IRR"} />
      <label className="block text-sm">
        نشانی تصاویر (هر خط یک URL؛ اولی جلد است)
        <textarea
          rows={4}
          value={imageUrls}
          onChange={(e) => setImageUrls(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          dir="ltr"
          placeholder="https://…"
        />
      </label>
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">مشخصات</p>
        {specs.map((row, index) => (
          <div key={index} className="grid grid-cols-2 gap-2">
            <input
              value={row.key}
              onChange={(e) => {
                const next = [...specs];
                next[index] = { ...next[index], key: e.target.value };
                setSpecs(next);
              }}
              placeholder="ویژگی"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              value={row.value}
              onChange={(e) => {
                const next = [...specs];
                next[index] = { ...next[index], value: e.target.value };
                setSpecs(next);
              }}
              placeholder="مقدار"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        ))}
        <button
          type="button"
          className="text-sm text-indigo-700"
          onClick={() => setSpecs((rows) => (rows.length >= 15 ? rows : [...rows, { key: "", value: "" }]))}
        >
          + ردیف مشخصات
        </button>
      </div>
      <label className="block text-sm">
        دورهٔ مرتبط (برای دسترسی آموزشی)
        <select name="courseId" defaultValue={initial?.courseId ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
          <option value="">بدون دوره</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.titleFa} ({course.slug})
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={initial?.published} />
        منتشر شود
      </label>
      <button disabled={busy} className="rounded-full bg-indigo-700 px-5 py-2 text-sm font-medium text-white disabled:opacity-60">
        {busy ? "در حال ذخیره…" : "ذخیره"}
      </button>
    </form>
  );
}
