import { HadiranMark } from "@/components/HadiranMark";
import { faNum, type InterpretationDocument } from "@/lib/analyzers/document-model";

function whenFa(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fa-IR");
}

export function CasioResearchDocument({ doc }: { doc: InterpretationDocument }) {
  const totalMax = doc.totalScoreMax ?? 100;

  return (
    <div className="doc-root mx-auto w-[210mm] max-w-full text-[#1b2430]" style={{ fontFamily: "inherit" }}>
      <section
        className="doc-page flex min-h-[270mm] flex-col justify-between p-12 text-white"
        style={{ background: "#0E2841" }}
      >
        <div>
          <div className="flex items-center gap-3 text-white">
            <HadiranMark className="h-12 w-12" />
            <div>
              <p className="text-sm font-medium tracking-wide">هادیران</p>
              <p className="text-xs text-white/70">سند تفسیر پنج‌لایه</p>
            </div>
          </div>
          <h1 className="mt-20 text-3xl font-bold leading-snug">{doc.packNameFa}</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/80">
            خوانش لایه‌ها از پاسخ‌های ثبت‌شده. متن سؤال در این سند نیست.
          </p>
        </div>
        <dl className="grid gap-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-white/60">نام</dt>
            <dd className="mt-1 text-lg font-medium">{doc.personNameFa}</dd>
          </div>
          {doc.businessNameFa ? (
            <div>
              <dt className="text-white/60">کسب‌وکار</dt>
              <dd className="mt-1 text-lg font-medium">{doc.businessNameFa}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-white/60">تاریخ ثبت</dt>
            <dd className="mt-1">{whenFa(doc.submittedAt)}</dd>
          </div>
          {doc.maturityFa ? (
            <div>
              <dt className="text-white/60">بلوغ سیستم</dt>
              <dd className="mt-1">{doc.maturityFa}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="doc-page mt-6 border border-[#e4d9c8] bg-[#FFFdf8] p-12 print:mt-0">
        <p className="text-xs font-medium" style={{ color: "#7A1F33" }}>
          نمای کلی
        </p>
        <h2 className="mt-2 text-2xl font-bold">خلاصهٔ لایه‌ها</h2>
        {doc.context.length ? (
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            {doc.context.map((field) => (
              <div key={field.labelFa}>
                <dt className="text-slate-500">{field.labelFa}</dt>
                <dd className="mt-1">{field.valueFa}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {doc.totalFa ? (
            <div className="rounded-xl bg-[#0E2841] p-5 text-white">
              <p className="text-xs text-white/70">نمرهٔ کل</p>
              <p className="mt-2 text-2xl font-bold">
                {doc.totalFa} از {faNum(totalMax)}
              </p>
            </div>
          ) : null}
          {doc.bottleneckFa ? (
            <div className="rounded-xl p-5 text-white" style={{ background: "#7A1F33" }}>
              <p className="text-xs text-white/70">گلوگاه</p>
              <p className="mt-2 text-xl font-bold">{doc.bottleneckFa}</p>
              {doc.bottleneckScoreFa ? (
                <p className="mt-1 text-sm text-white/80">
                  {doc.bottleneckScoreFa} از {faNum(20)}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        {doc.layers.length ? (
          <table className="mt-8 w-full text-sm">
            <thead>
              <tr className="border-b border-[#e4d9c8] text-right text-slate-500">
                <th className="py-2 font-medium">لایه</th>
                <th className="py-2 font-medium">نمره</th>
                <th className="py-2 font-medium">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {doc.layers.map((layer) => (
                <tr
                  key={layer.id}
                  className="border-b border-[#f0e6d8]"
                  style={layer.isBottleneck ? { background: "#f8ebe8" } : undefined}
                >
                  <td className="py-2.5">
                    {layer.titleFa}
                    {layer.isBottleneck ? (
                      <span className="mr-2 text-xs" style={{ color: "#7A1F33" }}>
                        گلوگاه
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2.5">
                    {layer.scoreFa} از {layer.scoreMaxFa}
                  </td>
                  <td className="py-2.5">{layer.statusFa || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : doc.scores.length ? (
          <ul className="mt-6 space-y-2 text-sm">
            {doc.scores.map((item) => (
              <li key={item.titleFa}>
                {item.titleFa}: {item.valueFa}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-slate-500">نمره‌ای برای این نوبت ثبت نشده.</p>
        )}
      </section>

      {doc.patterns.length ? (
        <section className="doc-page mt-6 border border-[#e4d9c8] bg-[#FFFdf8] p-12 print:mt-0">
          <p className="text-xs font-medium" style={{ color: "#7A1F33" }}>
            خوانش بین‌لایه
          </p>
          <ul className="mt-6 space-y-6">
            {doc.patterns.map((pattern, index) => (
              <li key={index}>
                <p className="text-sm leading-7">{pattern.meaningFa}</p>
                <p className="mt-1 text-sm leading-7 text-slate-500">{pattern.actionFa}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {doc.layers.map((layer) => (
        <section key={layer.id} className="doc-page mt-6 border border-[#e4d9c8] bg-[#FFFdf8] p-12 print:mt-0">
          {layer.isBottleneck ? (
            <p className="text-sm font-medium" style={{ color: "#7A1F33" }}>
              گلوگاه این ارزیابی
            </p>
          ) : (
            <p className="text-xs font-medium text-slate-500">لایه</p>
          )}
          <h2 className="mt-2 text-2xl font-bold">{layer.titleFa}</h2>
          {layer.constructFa ? <p className="mt-2 text-sm leading-7 text-slate-500">{layer.constructFa}</p> : null}
          <p className="mt-3 text-sm">
            نمره {layer.scoreFa} از {layer.scoreMaxFa}
            {layer.statusFa ? ` — ${layer.statusFa}` : ""}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {layer.asIsFa ? (
              <div className="rounded-xl border border-[#e4d9c8] bg-white p-4">
                <p className="text-xs font-medium text-slate-500">وضعیت موجود</p>
                <p className="mt-2 text-sm leading-7">{layer.asIsFa}</p>
              </div>
            ) : null}
            {layer.toBeFa ? (
              <div className="rounded-xl border border-[#d7e3d4] bg-[#f6faf4] p-4">
                <p className="text-xs font-medium text-slate-500">وضعیت مطلوب</p>
                <p className="mt-2 text-sm leading-7">{layer.toBeFa}</p>
              </div>
            ) : null}
          </div>
          {layer.actionsFa ? (
            <div className="mt-5 rounded-xl p-4 text-white" style={{ background: "#0E2841" }}>
              <p className="text-xs text-white/70">اقدام پیشنهادی</p>
              <p className="mt-2 text-sm leading-7">{layer.actionsFa}</p>
            </div>
          ) : null}
          {layer.keywords.length ? (
            <div className="mt-6">
              <p className="text-xs font-medium text-slate-500">کلیدواژه‌ها</p>
              <ul className="mt-2 space-y-3">
                {layer.keywords.map((keyword) => (
                  <li key={keyword.id}>
                    <p className="text-sm font-medium">{keyword.titleFa}</p>
                    {keyword.children.length ? (
                      <ul className="mt-1 list-disc pr-5 text-sm leading-7 text-slate-500">
                        {keyword.children.map((child) => (
                          <li key={child}>{child}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ))}

      <section className="doc-page mt-6 flex min-h-[180mm] flex-col justify-end border border-[#e4d9c8] bg-[#FFFdf8] p-12 print:mt-0">
        <p className="text-sm leading-7 text-slate-600">{doc.closingFa}</p>
        <div className="mt-10 flex items-center gap-3 text-[#0E2841]">
          <HadiranMark className="h-8 w-8" />
          <p className="text-xs">هادیران · نسخه {doc.version}</p>
        </div>
      </section>
    </div>
  );
}
