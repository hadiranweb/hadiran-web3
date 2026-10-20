const day = 86400000;
export const REPORT_ZONE = "Asia/Tehran";
const formatter = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
  timeZone: REPORT_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

export type PersianDay = { year: number; month: number; day: number };

export function persianDay(date: Date): PersianDay {
  const parts = formatter.formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day") };
}

const key = (dayValue: PersianDay) => dayValue.year * 10000 + dayValue.month * 100 + dayValue.day;

export function dayLabel(dayValue: PersianDay) {
  return `${dayValue.year}-${String(dayValue.month).padStart(2, "0")}-${String(dayValue.day).padStart(2, "0")}`;
}

export function latinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (char) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(char)))
    .replace(/[٠-٩]/g, (char) => String("٠١٢٣٤٥٦٧٨٩".indexOf(char)));
}

export function parsePersianDay(value: string): PersianDay {
  const normalized = latinDigits(value.trim()).replaceAll("/", "-");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) throw new Error("invalid_persian_date");
  const [year, month, dayNumber] = normalized.split("-").map(Number);
  if (year < 1300 || year > 1499 || month < 1 || month > 12 || dayNumber < 1 || dayNumber > 31) {
    throw new Error("invalid_persian_date");
  }
  const result = { year, month, day: dayNumber };
  gregorianDay(result);
  return result;
}

function gregorianDay(target: PersianDay): number {
  let lo = Math.floor(Date.UTC(target.year + 620, 0, 1) / day);
  let hi = Math.floor(Date.UTC(target.year + 623, 0, 1) / day);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (key(persianDay(new Date(mid * day + day / 2))) < key(target)) lo = mid + 1;
    else hi = mid;
  }
  if (key(persianDay(new Date(lo * day + day / 2))) !== key(target)) throw new Error("invalid_persian_date");
  return lo;
}

export function startOfPersianDay(target: PersianDay): Date {
  const civil = gregorianDay(target) * day;
  let lo = civil - 18 * 3600000;
  let hi = civil + 18 * 3600000;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (key(persianDay(new Date(mid))) < key(target)) lo = mid + 1;
    else hi = mid;
  }
  return new Date(lo);
}

export function nextPersianDay(target: PersianDay): PersianDay {
  return persianDay(new Date((gregorianDay(target) + 1) * day + day / 2));
}

export type ReportPeriod = {
  period: "month" | "previous" | "all" | "custom";
  from: string;
  to: string;
  start: string | null;
  end: string | null;
};

export function reportPeriod(input: Record<string, string | undefined>, now = new Date()): ReportPeriod {
  const period = input.period || "month";
  if (!["month", "previous", "all", "custom"].includes(period)) throw new Error("invalid_period");
  if (period === "all") return { period, from: "", to: "", start: null, end: null };

  let from: PersianDay;
  let until: PersianDay;
  if (period === "custom") {
    from = parsePersianDay(input.from || "");
    until = nextPersianDay(parsePersianDay(input.to || ""));
  } else {
    const current = persianDay(now);
    const currentMonth = { ...current, day: 1 };
    from =
      period === "previous"
        ? { year: current.month === 1 ? current.year - 1 : current.year, month: current.month === 1 ? 12 : current.month - 1, day: 1 }
        : currentMonth;
    until = { year: from.month === 12 ? from.year + 1 : from.year, month: from.month === 12 ? 1 : from.month + 1, day: 1 };
  }
  const start = startOfPersianDay(from);
  const end = startOfPersianDay(until);
  if (end <= start || end.getTime() - start.getTime() > 367 * day) throw new Error("invalid_period_range");
  return {
    period: period as ReportPeriod["period"],
    from: dayLabel(from),
    to: dayLabel(persianDay(new Date(end.getTime() - 1))),
    start: start.toISOString(),
    end: end.toISOString(),
  };
}
