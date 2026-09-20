export class InvalidPhoneError extends Error {
  constructor() {
    super("invalid_phone");
    this.name = "InvalidPhoneError";
  }
}

/** Normalize Iranian mobile to `09xxxxxxxxx`. Accepts Persian/Arabic digits, +98, 0098. */
export function normalizePhone(input: string): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const translated = input
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
  const digits = translated.replace(/[^0-9]/g, "");
  const withoutCountry = digits.startsWith("0098")
    ? digits.slice(4)
    : digits.startsWith("98")
      ? digits.slice(2)
      : digits;
  const national = withoutCountry.startsWith("0") ? withoutCountry.slice(1) : withoutCountry;
  if (!/^9\d{9}$/.test(national)) throw new InvalidPhoneError();
  return `0${national}`;
}

/** SMS.ir Verify expects 9xxxxxxxxx (no leading zero). */
export function toSmsIrMobile(phone: string): string {
  const normalized = normalizePhone(phone);
  return normalized.slice(1);
}

export function maskPhone(phone: string): string {
  try {
    const normalized = normalizePhone(phone);
    return `${normalized.slice(0, 4)}***${normalized.slice(-2)}`;
  } catch {
    return "***";
  }
}
