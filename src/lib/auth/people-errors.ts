export const PEOPLE_ERROR_FA: Record<string, string> = {
  unknown_code: "این شناسه حسابی ندارد.",
  unknown_child: "این شناسه در فهرست معرف‌شده‌ها نیست.",
  not_referred_by_this: "این حساب با کد این فرد وارد نشده.",
  cannot_change_self: "حساب خودتان از اینجا عوض نمی‌شود.",
  cannot_change_owner: "حساب مدیر عوض نمی‌شود.",
  invalid_referral: "شناسهٔ معرف نامعتبر است.",
  unknown_referral: "این کد معرف وجود ندارد.",
  self_referral: "کسی نمی‌تواند معرف خودش باشد.",
  referral_cycle: "این پیوند حلقه می‌سازد.",
  attempt_missing: "این تلاش پیدا نشد.",
  attempt_unrelated: "این تلاش به این حساب وصل نیست.",
  confirm_mismatch: "شناسهٔ تأیید با حساب یکی نیست.",
  nothing_selected: "چیزی برای پاک‌کردن انتخاب نشده.",
  owns_bots: "این حساب ربات دارد؛ اول ربات را جابه‌جا یا حذف کنید.",
};

export function peopleErrorFa(code: string) {
  return PEOPLE_ERROR_FA[code] ?? "انجام نشد.";
}
