import Link from "next/link";
import type { CasioReport } from "@/lib/analyzers/casio-ss/report";

const FA = "۰۱۲۳۴۵۶۷۸۹";

function faNum(value: number | string) {
  return String(value).replace(/\d/g, (digit) => FA[Number(digit)] ?? digit);
}

function faScore(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return faNum(Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1));
}

export function CasioSsReport({ report }: { report: CasioReport }) {
  const priority = [...report.layers].sort((a, b) => a.score - b.score);

  return (
    <div className="space-y-8">
      <section className="surface p-6 sm:p-8">
        <p className="text-sm font-medium text-mark">جمع‌بندی</p>
        <p className="mt-3 text-base leading-8 text-ink">
          بلوغ سیستم: <strong>{report.maturity.labelFa}</strong>
          {" — "}
          نمرهٔ کل {faScore(report.total)} از {faNum(100)}.
        </p>
        <p className="mt-3 text-sm leading-7 text-muted">
          گلوگاه فعلی: <span className="font-medium text-ink">{report.bottleneck.titleFa}</span>
          {" "}
          ({faScore(report.bottleneck.score)} از {faNum(20)}). نمره فقط اولویت را نشان می‌دهد؛ هر پنج لایه در گزارش آمده‌اند.
        </p>
        {report.context.length ? (
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            {report.context.map((field) => (
              <div key={field.labelFa}>
                <dt className="text-muted">{field.labelFa}</dt>
                <dd className="mt-1 text-ink">{field.valueFa}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </section>

      <section className="surface p-6 sm:p-8">
        <h2 className="text-lg font-bold leading-[1.7] text-ink">ترتیب اولویت لایه‌ها</h2>
        <ol className="mt-4 space-y-2 text-sm leading-7 text-ink">
          {priority.map((layer, index) => (
            <li key={layer.id}>
              {faNum(index + 1)}. {layer.titleFa}
              {" — "}
              {faScore(layer.score)} از {faNum(20)}
              {" · "}
              {layer.band.labelFa}
              {layer.isBottleneck ? " · گلوگاه" : ""}
            </li>
          ))}
        </ol>
      </section>

      {report.patterns.length ? (
        <section className="surface p-6 sm:p-8">
          <h2 className="text-lg font-bold leading-[1.7] text-ink">خوانش بین‌لایه</h2>
          <ul className="mt-4 space-y-5">
            {report.patterns.map((pattern) => (
              <li key={pattern.id}>
                <p className="text-sm leading-7 text-ink">{pattern.meaningFa}</p>
                <p className="mt-1 text-sm leading-7 text-muted">{pattern.actionFa}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {report.layers.map((layer) => (
        <section key={layer.id} className="surface p-6 sm:p-8">
          {layer.isBottleneck ? <p className="text-sm font-medium text-mark">گلوگاه</p> : null}
          <h2 className={`${layer.isBottleneck ? "mt-2 " : ""}text-xl font-bold leading-[1.7] text-ink`}>
            {layer.titleFa}
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted">{layer.constructFa}</p>
          <p className="mt-3 text-sm leading-7 text-ink">
            نمره {faScore(layer.score)} از {faNum(20)} — {layer.band.labelFa}. {layer.band.meaningFa}
          </p>

          <div className="mt-5 space-y-4 text-sm leading-7">
            <p>
              <span className="font-medium text-ink">وضعیت موجود: </span>
              <span className="text-muted">{layer.asIsFa}</span>
            </p>
            <p>
              <span className="font-medium text-ink">وضعیت مطلوب: </span>
              <span className="text-muted">{layer.toBeFa}</span>
            </p>
            <p>
              <span className="font-medium text-ink">اقدام پیشنهادی: </span>
              <span className="text-muted">{layer.actionsFa}</span>
            </p>
          </div>

          <h3 className="mt-6 text-base font-bold text-ink">درخت کلیدواژه</h3>
          <ul className="mt-3 space-y-4">
            {layer.keywords.map((keyword) => (
              <li key={keyword.id}>
                <p className="text-sm font-medium leading-7 text-ink">{keyword.titleFa}</p>
                {keyword.children.length ? (
                  <ul className="mt-1 list-disc space-y-1 pr-5 text-sm leading-7 text-muted">
                    {keyword.children.map((child) => (
                      <li key={child}>{child}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="text-sm leading-7 text-muted">
        نتیجهٔ این ارزیابی یک راهنمای کلی است، نه حکم قطعی دربارهٔ شما یا کسب‌وکارتان.
      </p>

      <p>
        <Link href="/analyzers" className="text-sm font-medium text-accent hover:text-ink">
          بازگشت به تحلیلگر‌ها
        </Link>
      </p>
    </div>
  );
}
