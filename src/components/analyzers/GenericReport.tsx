import Link from "next/link";
import type { GenericReport } from "@/lib/analyzers/generic-report";

const FA = "۰۱۲۳۴۵۶۷۸۹";

function faNum(value: number | string) {
  return String(value).replace(/\d/g, (digit) => FA[Number(digit)] ?? digit);
}

function displayValue(value: number | string) {
  if (typeof value === "number") {
    const rounded = Math.round(value * 10) / 10;
    return faNum(Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1));
  }
  return value;
}

export function GenericReportView({
  report,
  hubHref,
}: {
  report: GenericReport;
  hubHref: string | null;
}) {
  return (
    <div className="space-y-8">
      {report.bottleneck ? (
        <section className="surface p-6 sm:p-8">
          <p className="text-sm font-medium text-mark">گلوگاه</p>
          <p className="mt-2 text-base leading-8 text-ink">{report.bottleneck.titleFa}</p>
        </section>
      ) : null}

      <section className="surface p-6 sm:p-8">
        <h2 className="text-lg font-bold leading-[1.7] text-ink">نمره‌ها</h2>
        {report.scores.length ? (
          <ul className="mt-4 space-y-2 text-sm leading-7 text-ink">
            {report.scores.map((row) => (
              <li key={row.id}>
                {row.titleFa}: {displayValue(row.value)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-7 text-muted">برای این نسخه فرمول نمره‌ای تعریف نشده.</p>
        )}
      </section>

      {report.keywords.length ? (
        <section className="surface p-6 sm:p-8">
          <h2 className="text-lg font-bold leading-[1.7] text-ink">درخت کلیدواژه</h2>
          <ul className="mt-4 space-y-2 text-sm leading-7 text-ink">
            {report.keywords.map((node) => (
              <li key={node.keyword.id}>{node.keyword.labelFa}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-sm leading-7 text-muted">نتیجهٔ این ارزیابی یک راهنمای کلی است، نه حکم قطعی.</p>
      {hubHref ? (
        <p>
          <Link href={hubHref} className="text-sm font-medium text-accent hover:text-ink">
            بازگشت به تحلیلگر‌ها
          </Link>
        </p>
      ) : null}
    </div>
  );
}
