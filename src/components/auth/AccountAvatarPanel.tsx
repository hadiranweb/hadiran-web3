"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { AVATAR_COUNT, type AccountAvatar } from "@/lib/account/avatar";
import { publishAccount } from "@/lib/ui/draft";
import { UserAvatar } from "./UserAvatar";

export function AccountAvatarPanel({ initial, name }: { initial: AccountAvatar; name: string }) {
  const [avatar, setAvatar] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(false);
  const group = useId();
  const router = useRouter();

  async function choose(variant: number) {
    if (busy) return;
    setBusy(true);
    setStatus("");
    setError(false);
    try {
      const res = await fetch("/api/account/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant }),
      });
      if (!res.ok) throw new Error("save_failed");
      const data = (await res.json()) as { avatar: AccountAvatar };
      setAvatar(data.avatar);
      publishAccount({ avatar: data.avatar });
      setStatus("آواتار ذخیره شد.");
      router.refresh();
    } catch {
      setError(true);
      setStatus("ذخیره نشد؛ دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="surface mb-8 p-5" aria-labelledby="avatar-panel-title">
      <div className="mb-4 flex items-center gap-4">
        <UserAvatar variant={avatar.variant} photoUrl={avatar.photoUrl} size={80} />
        <div>
          <h2 id="avatar-panel-title" className="text-base font-semibold text-ink">
            تصویر پروفایل
          </h2>
          <p className="mt-1 text-sm leading-7 text-muted">
            {name}، یک آواتار به‌صورت خودکار برای حسابت انتخاب شده است. اگر دوست داشتی، تغییرش بده.
          </p>
        </div>
      </div>
      <fieldset disabled={busy} aria-busy={busy} className="border-0 p-0">
        <legend className="mb-3 text-xs font-medium text-mark">آواتار خودت را انتخاب کن</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {Array.from({ length: AVATAR_COUNT }, (_, variant) => (
            <label
              key={variant}
              className={`flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border p-1 ${
                avatar.variant === variant && !avatar.photoUrl
                  ? "border-accent ring-2 ring-[color-mix(in_srgb,var(--ring)_40%,transparent)]"
                  : "border-line hover:border-ink/30"
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                name={group}
                value={variant}
                checked={avatar.variant === variant && !avatar.photoUrl}
                onChange={() => void choose(variant)}
                aria-label={`آواتار ${variant + 1}`}
              />
              <UserAvatar variant={variant} size={56} />
            </label>
          ))}
        </div>
      </fieldset>
      <p
        className={`mt-3 text-sm ${error ? "text-red-700 dark:text-red-300" : "text-muted"}`}
        role="status"
        aria-live="polite"
      >
        {busy ? "در حال ذخیره…" : status}
      </p>
      <p className="mt-2 text-xs text-muted">فعلاً آواتارهای SVG فعال‌اند؛ امکان بارگذاری عکس شخصی در مرحلهٔ بعد اضافه می‌شود.</p>
    </section>
  );
}
