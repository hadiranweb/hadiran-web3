export class InvalidPhoneError extends Error {
  constructor() {
    super("invalid_phone");
    this.name = "InvalidPhoneError";
  }
}

/** Convert Persian and Arabic numerals without changing other characters. */
export function normalizeDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

/** Normalize Iranian mobile to `09xxxxxxxxx`. Accepts Persian/Arabic digits, +98, 0098. */
export function normalizePhone(input: string): string {
  const translated = normalizeDigits(input);
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
