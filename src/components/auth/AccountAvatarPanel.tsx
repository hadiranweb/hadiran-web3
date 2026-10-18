"use client";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { previewFetch as fetch } from "@/lib/auth/preview-fetch";
import { AVATAR_COUNT, type AccountAvatar } from "@/lib/account/avatar";
import { publishAccount } from "@/lib/ui/draft";
import { UserAvatar } from "./UserAvatar";
export function AccountAvatarPanel({ initial, name }: { initial: AccountAvatar; name: string }) {
  const [avatar, setAvatar] = useState(initial); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(""); const [error, setError] = useState(false);
  const group = useId(); const router = useRouter();
  async function choose(variant: number) {
    if (busy) return; setBusy(true); setStatus(""); setError(false);
    try {
      const res = await fetch("/api/account/avatar", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variant }) });
      if (!res.ok) throw new Error("save_failed");
      const data = await res.json() as { avatar: AccountAvatar }; setAvatar(data.avatar); publishAccount({ avatar: data.avatar });
      setStatus("آواتار ذخیره شد."); router.refresh();
    } catch { setError(true); setStatus("ذخیره نشد؛ دوباره تلاش کنید."); } finally { setBusy(false); }
  }
  return <section className="surface account-avatar-panel" aria-labelledby="avatar-panel-title">
    <div className="account-avatar-intro"><UserAvatar variant={avatar.variant} photoUrl={avatar.photoUrl} size={80} /><div><h2 id="avatar-panel-title">تصویر پروفایل</h2><p>{name}، یک آواتار به‌صورت خودکار برای حسابت انتخاب شده است. اگر دوست داشتی، تغییرش بده.</p></div></div>
    <fieldset disabled={busy} aria-busy={busy}><legend>آواتار خودت را انتخاب کن</legend><div className="avatar-options">{Array.from({ length: AVATAR_COUNT }, (_, variant) => <label className="avatar-option" key={variant}><input type="radio" name={group} value={variant} checked={avatar.variant === variant && !avatar.photoUrl} onChange={() => void choose(variant)} aria-label={`آواتار ${variant + 1}`} /><UserAvatar variant={variant} size={56} /></label>)}</div></fieldset>
    <p className={error ? "avatar-save-error" : "avatar-save-status"} role="status" aria-live="polite">{busy ? "در حال ذخیره…" : status}</p>
    <p className="avatar-upload-note">فعلاً آواتارهای SVG فعال‌اند؛ امکان بارگذاری عکس شخصی در مرحلهٔ بعد اضافه می‌شود.</p>
  </section>;
}
