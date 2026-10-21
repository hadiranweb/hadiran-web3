"use client";

import { useMemo, useState } from "react";
import type { CopyEntry, HistoryRow } from "@/lib/content/types";

type Filter = "all" | "changed" | "draft";

type FieldState = { value: string; dirty: boolean };

function initialState(entries: CopyEntry[]): Record<string, FieldState> {
  const out: Record<string, FieldState> = {};
  for (const entry of entries) out[entry.key] = { value: entry.draft ?? entry.live ?? entry.fallback, dirty: false };
  return out;
}

function statusOf(entry: CopyEntry, state: FieldState) {
  if (state.dirty) return { label: "ذخیره‌نشده", tone: "text-mark" };
  if (entry.draft) return { label: "پیش‌نویس ذخیره‌شده", tone: "text-mark" };
  if (entry.live) return { label: "منتشرشده", tone: "text-good" };
  return { label: "پیش‌فرض", tone: "text-muted" };
}

export function CopyGroupEditor({
  group,
  entries,
  disabled,
}: {
  group: string;
  entries: CopyEntry[];
  disabled: boolean;
}) {
  const [rows, setRows] = useState<CopyEntry[]>(entries);
  const [state, setState] = useState<Record<string, FieldState>>(() => initialState(entries));
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  const dirtyKeys = useMemo(
    () => rows.filter((row) => state[row.key]?.dirty).map((row) => row.key),
    [rows, state],
  );
  const draftKeys = useMemo(() => rows.filter((row) => row.draft).map((row) => row.key), [rows]);

  const visible = rows.filter((row) => {
    if (filter === "changed" && !row.live) return false;
    if (filter === "draft" && !row.draft) return false;
    if (!query.trim()) return true;
    const needle = query.trim();
    const haystack = `${row.label} ${row.hint ?? ""} ${row.key} ${state[row.key]?.value ?? ""}`;
    return haystack.includes(needle);
  });

  function update(row: CopyEntry, value: string) {
    setMessage(null);
    const base = row.draft ?? row.live ?? row.fallback;
    setState((prev) => ({ ...prev, [row.key]: { value, dirty: value !== base } }));
  }

  async function refresh() {
    const res = await fetch(`/api/workspace/copy?group=${encodeURIComponent(group)}`, { cache: "no-store" });
    const data = (await res.json()) as { entries?: CopyEntry[] };
    if (data.entries) {
      setRows(data.entries);
      setState(initialState(data.entries));
    }
  }

  async function save(keys: string[]): Promise<boolean> {
    if (!keys.length) {
      setError("چیزی برای ذخیره نبود.");
      return false;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    const values: Record<string, string> = {};
    for (const key of keys) values[key] = state[key]?.value ?? "";
    const res = await fetch("/api/workspace/copy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values, note: note || null }),
    });
    const data = (await res.json()) as { error?: string; saved?: number };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "ذخیره نشد.");
      return false;
    }
    setMessage(`پیش‌نویس ذخیره شد (${(data.saved ?? 0).toLocaleString("fa-IR")} کلید). هنوز عمومی نیست.`);
    await refresh();
    return true;
  }

  async function publish() {
    if (!note.trim()) {
      setError("برای انتشار، یادداشت تغییر لازم است.");
      return;
    }
    if (dirtyKeys.length && !(await save(dirtyKeys))) return;
    setBusy(true);
    setError(null);
    const fresh = await fetch(`/api/workspace/copy?group=${encodeURIComponent(group)}`, { cache: "no-store" });
    const freshData = (await fresh.json()) as { entries?: CopyEntry[] };
    const freshRows = freshData.entries ?? rows;
    const keys = freshRows.filter((row) => row.draft).map((row) => row.key);
    if (!keys.length) {
      setBusy(false);
      setError("پیش‌نویسی برای انتشار نبود.");
      return;
    }
    const revisions: Record<string, number> = {};
    for (const row of freshRows) revisions[row.key] = row.revision;
    const res = await fetch("/api/workspace/copy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish", keys, revisions, note }),
    });
    const data = (await res.json()) as { error?: string; published?: string[] };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "انتشار نشد.");
      return;
    }
    setMessage(`منتشر شد: ${(data.published ?? []).length.toLocaleString("fa-IR")} کلید. صفحه‌های عمومی تازه شدند.`);
    setNote("");
    await refresh();
  }

  async function revert(key: string) {
    if (!note.trim()) {
      setError("برای بازگشت به پیش‌فرض، یادداشت تغییر لازم است.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/workspace/copy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revert", key, note }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "بازگشت انجام نشد.");
      return;
    }
    setMessage("به پیش‌فرض برگشت.");
    await refresh();
  }

  async function openHistory(key: string) {
    if (historyKey === key) {
      setHistoryKey(null);
      return;
    }
    setHistoryKey(key);
    setHistory([]);
    const res = await fetch(`/api/workspace/copy?history=${encodeURIComponent(key)}`, { cache: "no-store" });
    const data = (await res.json()) as { items?: HistoryRow[] };
    setHistory(data.items ?? []);
  }

  async function restore(key: string, revision: number) {
    if (!note.trim()) {
      setError("برای بازگردانی، یادداشت تغییر لازم است.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/workspace/copy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore", key, revision, note }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "بازگردانی انجام نشد.");
      return;
    }
    setMessage(`نسخهٔ ${revision.toLocaleString("fa-IR")} دوباره منتشر شد.`);
    await refresh();
  }

  return (
    <div className="space-y-4">
      <section className="surface space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["all", "همه"],
              ["changed", "تغییرکرده"],
              ["draft", "پیش‌نویس"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={filter === value ? "chip" : "ws-button min-h-9 px-3 py-1 text-xs"}
            >
              {label}
            </button>
          ))}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جست‌وجوی کلید یا متن"
            aria-label="جست‌وجوی کلید یا متن"
            className="min-h-11 min-w-0 flex-1 rounded-[var(--radius-md)] border border-line bg-elev px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
        </div>
        <label className="block">
          <span className="text-xs text-muted">یادداشت تغییر (برای انتشار، بازگشت و بازگردانی لازم است)</span>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={280}
            placeholder="مثلاً: شعار کوتاه‌تر شد"
            className="mt-1 min-h-11 w-full rounded-[var(--radius-md)] border border-line bg-elev px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <button
            type="button"
            onClick={() => void save(dirtyKeys)}
            disabled={disabled || busy || !dirtyKeys.length}
            className="ws-button ws-primary disabled:opacity-50"
          >
            ذخیرهٔ پیش‌نویس{dirtyKeys.length ? ` (${dirtyKeys.length.toLocaleString("fa-IR")})` : ""}
          </button>
          <button
            type="button"
            onClick={() => void publish()}
            disabled={disabled || busy || !(draftKeys.length || dirtyKeys.length)}
            className="ws-button disabled:opacity-50"
          >
            انتشار
          </button>
          <span className="ms-auto text-xs text-muted">
            پیش‌نویس تا انتشار در هیچ صفحهٔ عمومی دیده نمی‌شود.
          </span>
        </div>
        {error ? (
          <p className="rounded-[var(--radius-sm)] border border-line bg-elev px-3 py-2 text-sm text-ink" role="alert">
            {error}
          </p>
        ) : null}
        {message ? <p className="text-sm text-good">{message}</p> : null}
      </section>

      {visible.length === 0 ? (
        <p className="surface p-6 text-sm text-muted">کلیدی با این صافی پیدا نشد.</p>
      ) : null}

      {visible.map((row) => {
        const field = state[row.key] ?? { value: "", dirty: false };
        const status = statusOf(row, field);
        const over = field.value.length > row.maxLength;
        return (
          <section key={row.key} className="surface space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-sm font-medium text-ink">{row.label}</h2>
                {row.hint ? <p className="mt-0.5 text-xs leading-6 text-muted">{row.hint}</p> : null}
              </div>
              <span className={`shrink-0 text-xs ${status.tone}`}>{status.label}</span>
            </div>

            {row.multiline ? (
              <textarea
                value={field.value}
                onChange={(event) => update(row, event.target.value)}
                rows={Math.min(8, Math.max(3, Math.ceil(field.value.length / 60)))}
                maxLength={row.maxLength + 40}
                disabled={disabled}
                aria-label={row.label}
                className="w-full rounded-[var(--radius-sm)] border border-line bg-elev px-3 py-2 text-sm leading-7 text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              />
            ) : (
              <input
                value={field.value}
                onChange={(event) => update(row, event.target.value)}
                maxLength={row.maxLength + 40}
                disabled={disabled}
                aria-label={row.label}
                className="min-h-11 w-full rounded-[var(--radius-sm)] border border-line bg-elev px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              />
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <span className={over ? "text-mark" : ""}>
                {field.value.length.toLocaleString("fa-IR")} / {row.maxLength.toLocaleString("fa-IR")}
              </span>
              <span>کلید: {row.key}</span>
              {row.revision > 0 ? <span>نسخهٔ {row.revision.toLocaleString("fa-IR")}</span> : null}
              <span className="text-muted">
                مصرف: {row.usedAt.map((path) => path.split("/").slice(-2).join("/")).join(" ، ")}
              </span>
              <button type="button" onClick={() => void openHistory(row.key)} className="ms-auto underline">
                تاریخچه
              </button>
              {row.live ? (
                <button
                  type="button"
                  onClick={() => void revert(row.key)}
                  disabled={disabled || busy}
                  className="underline disabled:opacity-50"
                >
                  بازگشت به پیش‌فرض
                </button>
              ) : null}
            </div>

            {field.value !== row.fallback ? (
              <details className="text-xs text-muted">
                <summary className="cursor-pointer">مقدار پیش‌فرض</summary>
                <p className="mt-2 rounded-[var(--radius-sm)] bg-paper px-3 py-2 leading-6">{row.fallback}</p>
              </details>
            ) : null}

            {historyKey === row.key ? (
              <div className="rounded-[var(--radius-sm)] border border-line p-3 text-xs">
                <p className="mb-2 font-medium text-ink">تاریخچهٔ انتشار</p>
                {history.length === 0 ? <p className="text-muted">هنوز نسخه‌ای منتشر نشده.</p> : null}
                <ul className="space-y-2">
                  {history.map((item) => {
                    const snapshot = item.snapshot as { fa?: string | null; restoredFrom?: number };
                    return (
                      <li key={item.revision} className="flex flex-wrap items-center gap-2 border-t border-line pt-2 first:border-0 first:pt-0">
                        <span className="tabular-nums text-ink">نسخهٔ {item.revision.toLocaleString("fa-IR")}</span>
                        <span className="min-w-0 flex-1 truncate text-muted">{snapshot?.fa ?? "— بازگشت به پیش‌فرض —"}</span>
                        <span className="text-muted">{item.note ?? "بدون یادداشت"}</span>
                        <button
                          type="button"
                          onClick={() => void restore(row.key, item.revision)}
                          disabled={disabled || busy}
                          className="underline disabled:opacity-50"
                        >
                          انتشار این نسخه
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
