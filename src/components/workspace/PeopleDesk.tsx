"use client";

import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { PersonAttemptLink, PersonDetail, PersonSummary, PersonWipeField } from "@/lib/auth/people-types";

const WIPE_OPTIONS: { id: PersonWipeField; label: string }[] = [
  { id: "phone", label: "شماره تلفن" },
  { id: "name", label: "نام" },
  { id: "telegram", label: "تلگرام" },
  { id: "email", label: "ایمیل" },
  { id: "password", label: "رمز" },
  { id: "sessions", label: "نشست و توکن ورود" },
  { id: "otp", label: "رمز یک‌بارمصرف" },
  { id: "auth_events", label: "رویدادهای ورود" },
  { id: "attempts", label: "تلاش‌های آزمون" },
];

function whenFa(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fa-IR");
}

async function readError(res: Response) {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return data.error ?? "انجام نشد.";
}

export function PeopleDesk() {
  const [people, setPeople] = useState<PersonSummary[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    const res = await fetch("/api/workspace/people", { cache: "no-store" });
    if (!res.ok) {
      setLoadError(await readError(res));
      return;
    }
    const data = (await res.json()) as { people?: PersonSummary[] };
    setPeople(data.people ?? []);
    setLoadError(null);
  }, []);

  const loadPerson = useCallback(async (code: string) => {
    const res = await fetch(`/api/workspace/people/${code}`, { cache: "no-store" });
    if (!res.ok) {
      setError(await readError(res));
      setPerson(null);
      return;
    }
    const data = (await res.json()) as { person?: PersonDetail };
    setPerson(data.person ?? null);
    setError(null);
  }, []);

  useEffect(() => {
    // بارگذاری اولیه بعد از mount؛ loadList با useCallback پایدار است.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (!selectedCode) {
      // انتخاب برداشته شده؛ جزئیاتِ قبلی نباید بماند.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPerson(null);
      return;
    }
    void loadPerson(selectedCode);
  }, [selectedCode, loadPerson]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return people;
    const persian = "۰۱۲۳۴۵۶۷۸۹";
    const arabic = "٠١٢٣٤٥٦٧٨٩";
    const latin = q
      .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)));
    return people.filter((row) => {
      const hay = `${row.nameFa} ${row.publicCode} ${row.phone ?? ""} ${row.roleFa}`;
      return hay.includes(q) || hay.includes(latin);
    });
  }, [people, query]);

  async function patch(code: string, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/workspace/people/${code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; person?: PersonDetail };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "انجام نشد.");
      return false;
    }
    if (data.person) setPerson(data.person);
    await loadList();
    return true;
  }

  return (
    <div className="space-y-6">
      <input
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="جستجو با نام، شماره یا شناسهٔ ۸رقمی"
      />
      {loadError ? <p className="text-sm text-red-700">{loadError}</p> : null}
      <ul className="space-y-2">
        {filtered.length === 0 ? (
          <li className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">حسابی نیست.</li>
        ) : (
          filtered.map((row) => {
            const active = selectedCode === row.publicCode;
            return (
              <li key={row.publicCode}>
                <button
                  type="button"
                  onClick={() => setSelectedCode(row.publicCode)}
                  className={`w-full rounded-2xl border p-4 text-right text-sm ${
                    active ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="font-medium text-slate-900">{row.nameFa}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    <span dir="ltr">{row.publicCode}</span>
                    {" · "}
                    {row.phone ? <span dir="ltr">{row.phone}</span> : "شماره پاک‌شده"}
                    {" · "}
                    {row.roleFa}
                    {row.isActive ? "" : " · غیرفعال"}
                    {row.referredBy ? (
                      <>
                        {" · معرف "}
                        <span dir="ltr">{row.referredBy}</span>
                      </>
                    ) : null}
                    {row.referredCount > 0 ? ` · ${row.referredCount.toLocaleString("fa-IR")} معرفی‌شده` : null}
                  </p>
                </button>
              </li>
            );
          })
        )}
      </ul>
      {person ? (
        <PersonPanel
          person={person}
          busy={busy}
          error={error}
          onPatch={patch}
          onDeleted={async () => {
            setSelectedCode(null);
            setPerson(null);
            await loadList();
          }}
        />
      ) : null}
    </div>
  );
}

function PersonPanel({
  person,
  busy,
  error,
  onPatch,
  onDeleted,
}: {
  person: PersonDetail;
  busy: boolean;
  error: string | null;
  onPatch: (code: string, body: Record<string, unknown>) => Promise<boolean>;
  onDeleted: () => Promise<void>;
}) {
  const [role, setRole] = useState<"author" | "member">(person.role === "author" ? "author" : "member");
  const [referrer, setReferrer] = useState(person.referredBy ?? "");
  const [wipe, setWipe] = useState<PersonWipeField[]>(["phone", "name", "telegram", "email", "password", "sessions", "otp"]);
  const [childCodes, setChildCodes] = useState<Record<string, string>>({});
  const [attemptCodes, setAttemptCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    // فرم با تغییر عضو انتخاب‌شده از نو پر می‌شود.
    /* eslint-disable react-hooks/set-state-in-effect */
    setRole(person.role === "author" ? "author" : "member");
    setReferrer(person.referredBy ?? "");
    setChildCodes({});
    setAttemptCodes(
      Object.fromEntries(person.attempts.map((item) => [`${item.kind}-${item.id}`, item.referrerCode ?? ""])),
    );
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [person]);

  const locked = person.locked;

  function toggleWipe(id: PersonWipeField) {
    setWipe((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function removeAccount() {
    const typed = window.prompt("برای حذف کامل این حساب، شناسهٔ ۸رقمی را بنویسید.");
    if (!typed) return;
    const res = await fetch(`/api/workspace/people/${person.publicCode}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: typed.trim() }),
    });
    if (!res.ok) {
      window.alert(await readError(res));
      return;
    }
    await onDeleted();
  }

  return (
    <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{person.nameFa}</h2>
        <p className="mt-1 text-sm text-slate-500">
          شناسه <span dir="ltr">{person.publicCode}</span>
          {" · ثبت "}
          {whenFa(person.createdAt)}
          {" · آخرین ورود "}
          {whenFa(person.lastLoginAt)}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          شماره: {person.phone ? <span dir="ltr">{person.phone}</span> : "پاک‌شده"}
          {person.email ? ` · ${person.email}` : ""}
          {person.telegramUserId ? (
            <>
              {" · تلگرام "}
              <span dir="ltr">{person.telegramUserId}</span>
            </>
          ) : null}
          {` · ${person.attemptCount.toLocaleString("fa-IR")} تلاش آزمون`}
        </p>
      </div>

      {locked ? (
        <p className="text-sm text-slate-500">
          نقش، دسترسی و حذف برای حساب مدیر بسته است. پیوند معرف را برای هر نقش می‌توان عوض کرد.
        </p>
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm text-slate-600">
            نقش
            <select
              className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={role}
              onChange={(event) => setRole(event.target.value === "member" ? "member" : "author")}
            >
              <option value="author">آزمون‌ساز</option>
              <option value="member">عضو</option>
            </select>
          </label>
          <button
            type="button"
            disabled={busy}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
            onClick={() => void onPatch(person.publicCode, { role })}
          >
            ثبت نقش
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-60"
            onClick={() => void onPatch(person.publicCode, { isActive: !person.isActive })}
          >
            {person.isActive ? "غیرفعال کردن دسترسی" : "فعال کردن دسترسی"}
          </button>
        </div>
      )}

          <div>
            <h3 className="text-base font-medium text-slate-800">معرف این حساب</h3>
            <p className="mt-1 text-sm text-slate-500">کد کسی که این فرد هنگام ورود زده، یا خالی اگر پیوندی نیست.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                dir="ltr"
                maxLength={8}
                value={referrer}
                onChange={(event) => setReferrer(event.target.value)}
                placeholder="۱۲۳۴۵۶۷۸"
              />
              <button
                type="button"
                disabled={busy}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
                onClick={() => void onPatch(person.publicCode, { referredBy: referrer.trim() || null })}
              >
                جایگزینی معرف
              </button>
              <button
                type="button"
                disabled={busy || !person.referredBy}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-60"
                onClick={() => void onPatch(person.publicCode, { referredBy: null })}
              >
                قطع پیوند
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-slate-800">کسانی که کد این فرد را زدند</h3>
            {person.referred.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">هنوز کسی با کد این حساب وارد نشده.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {person.referred.map((row) => (
                  <li key={row.publicCode} className="rounded-xl border border-slate-100 p-3 text-sm">
                    <p>
                      {row.nameFa} · <span dir="ltr">{row.publicCode}</span> · {row.roleFa}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
                        dir="ltr"
                        maxLength={8}
                        value={childCodes[row.publicCode] ?? ""}
                        onChange={(event) =>
                          setChildCodes((current) => ({ ...current, [row.publicCode]: event.target.value }))
                        }
                        placeholder="کد تازه"
                      />
                      <button
                        type="button"
                        disabled={busy}
                        className="text-indigo-700 disabled:opacity-60"
                        onClick={() =>
                          void onPatch(person.publicCode, {
                            referred: {
                              publicCode: row.publicCode,
                              referredBy: (childCodes[row.publicCode] ?? "").trim() || null,
                            },
                          })
                        }
                      >
                        جایگزینی
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className="text-red-700 disabled:opacity-60"
                        onClick={() =>
                          void onPatch(person.publicCode, {
                            referred: { publicCode: row.publicCode, referredBy: null },
                          })
                        }
                      >
                        قطع
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <AttemptList
            title="در آزمون، کد این فرد را زدند"
            items={person.attempts.filter((item) => item.direction === "used_theirs")}
            empty="در آزمون کسی کد این حساب را نزده."
            codes={attemptCodes}
            setCodes={setAttemptCodes}
            busy={busy}
            onPatch={onPatch}
            personCode={person.publicCode}
          />
          <AttemptList
            title="خودش در آزمون کد دیگری را زده"
            items={person.attempts.filter((item) => item.direction === "they_used")}
            empty="در آزمون کدی نزده."
            codes={attemptCodes}
            setCodes={setAttemptCodes}
            busy={busy}
            onPatch={onPatch}
            personCode={person.publicCode}
          />

      {!locked ? (
        <>
          <div>
            <h3 className="text-base font-medium text-slate-800">پاک‌کردن ردپا</h3>
            <p className="mt-1 text-sm leading-7 text-slate-500">
              انتخاب کنید چه چیزی از پایگاه پاک شود. پاک‌کردن شماره، ورود بعدی با همان موبایل را حساب تازه می‌کند.
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {WIPE_OPTIONS.map((option) => (
                <li key={option.id}>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={wipe.includes(option.id)}
                      onChange={() => toggleWipe(option.id)}
                    />
                    {option.label}
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={busy || wipe.length === 0}
              className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 disabled:opacity-60"
              onClick={() => {
                const typed = window.prompt("برای پاک‌کردن ردپا، شناسهٔ ۸رقمی این حساب را بنویسید.");
                if (!typed) return;
                void onPatch(person.publicCode, { wipe, confirm: typed.trim() });
              }}
            >
              پاک‌کردن انتخاب‌ها
            </button>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-base font-medium text-red-800">حذف کامل حساب</h3>
            <p className="mt-1 text-sm leading-7 text-slate-500">
              ردیف حساب، نشست، کد عمومی، تلاش آزمون و شماره از پایگاه می‌رود. کسانی که معرف‌شان این فرد بوده بی‌پیوند
              می‌مانند.
            </p>
            <button
              type="button"
              disabled={busy}
              className="mt-3 rounded-xl bg-red-700 px-4 py-2 text-sm text-white disabled:opacity-60"
              onClick={() => void removeAccount()}
            >
              حذف کامل
            </button>
          </div>
        </>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </section>
  );
}

function AttemptList({
  title,
  items,
  empty,
  codes,
  setCodes,
  busy,
  onPatch,
  personCode,
}: {
  title: string;
  items: PersonAttemptLink[];
  empty: string;
  codes: Record<string, string>;
  setCodes: Dispatch<SetStateAction<Record<string, string>>>;
  busy: boolean;
  onPatch: (code: string, body: Record<string, unknown>) => Promise<boolean>;
  personCode: string;
}) {
  return (
    <div>
      <h3 className="text-base font-medium text-slate-800">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => {
            const key = `${item.kind}-${item.id}`;
            return (
              <li key={key} className="rounded-xl border border-slate-100 p-3 text-sm">
                <p>
                  {item.takerNameFa} · <span dir="ltr">{item.takerCode}</span> · {item.slug}
                  {item.referrerCode ? (
                    <>
                      {" · معرف "}
                      <span dir="ltr">{item.referrerCode}</span>
                    </>
                  ) : null}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
                    dir="ltr"
                    maxLength={8}
                    value={codes[key] ?? ""}
                    onChange={(event) => setCodes((current) => ({ ...current, [key]: event.target.value }))}
                    placeholder="کد تازه"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    className="text-indigo-700 disabled:opacity-60"
                    onClick={() =>
                      void onPatch(personCode, {
                        attempt: { kind: item.kind, id: item.id, referrer: (codes[key] ?? "").trim() || null },
                      })
                    }
                  >
                    جایگزینی
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="text-red-700 disabled:opacity-60"
                    onClick={() => void onPatch(personCode, { attempt: { kind: item.kind, id: item.id, referrer: null } })}
                  >
                    قطع
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
