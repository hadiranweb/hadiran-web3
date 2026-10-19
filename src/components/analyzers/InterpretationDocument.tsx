import { HadiranMark } from "@/components/HadiranMark";
import { CasioResearchDocument } from "@/components/analyzers/CasioResearchDocument";
import { ChromeDocument } from "@/components/analyzers/ChromeDocument";
import { renderChromeDocument } from "@/lib/analyzers/document-chrome";
import { readDocumentChrome } from "@/lib/analyzers/document-templates-store";
import { documentLayoutKey } from "@/lib/analyzers/document-templates";
import { faNum, type InterpretationDocument } from "@/lib/analyzers/document-model";

function whenFa(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fa-IR");
}

export async function InterpretationDocumentView({ doc }: { doc: InterpretationDocument }) {
  const chrome = await readDocumentChrome(doc.templateId);
  if (chrome.html.trim()) {
    const rendered = renderChromeDocument(chrome, doc);
    return <ChromeDocument html={rendered.html} css={rendered.css} className={rendered.className} />;
  }
  if (documentLayoutKey(doc.templateId) === "casio-ss") return <CasioResearchDocument doc={doc} />;
  return <HadiranDocument doc={doc} />;
}

export function InterpretationDocument({ doc }: { doc: InterpretationDocument }) {
  return <InterpretationDocumentView doc={doc} />;
}

function HadiranDocument({ doc }: { doc: InterpretationDocument }) {
  const layerPages: InterpretationDocument["layers"][] = [];
  for (let i = 0; i < doc.layers.length; i += 1) {
    const layer = doc.layers[i];
    if (layer) layerPages.push([layer]);
  }

  return (
    <div className="doc-root mx-auto w-[210mm] max-w-full text-slate-900">
      <section className="doc-page flex min-h-[270mm] flex-col justify-between rounded-none border border-slate-200 bg-[#f7f6f2] p-12">
        <div>
          <div className="flex items-center gap-3">
            <HadiranMark className="h-10 w-10" />
            <p className="text-sm font-medium text-slate-500">هادیران · سند تفسیر</p>
          </div>
          <h1 className="mt-16 text-3xl font-bold leading-snug">{doc.packNameFa}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            تفسیر پاسخ‌های ثبت‌شده. متن سؤال در این سند نیست.
          </p>
          <dl className="mt-10 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">نام</dt>
              <dd className="mt-1 font-medium">{doc.personNameFa}</dd>
            </div>
            {doc.businessNameFa ? (
              <div>
                <dt className="text-slate-500">کسب‌وکار</dt>
                <dd className="mt-1 font-medium">{doc.businessNameFa}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-slate-500">تاریخ ثبت</dt>
              <dd className="mt-1 font-medium">{whenFa(doc.submittedAt)}</dd>
            </div>
            {doc.publicCode ? (
              <div>
                <dt className="text-slate-500">شناسه</dt>
                <dd className="mt-1 font-medium" dir="ltr">
                  {doc.publicCode}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {doc.bottleneckFa ? (
            <div className="rounded-2xl bg-white p-5">
              <p className="text-xs text-slate-500">گلوگاه</p>
              <p className="mt-2 text-lg font-bold">{doc.bottleneckFa}</p>
              {doc.bottleneckScoreFa ? (
                <p className="mt-1 text-sm text-slate-500">
                  {doc.bottleneckScoreFa} از {faNum(20)}
                </p>
              ) : null}
            </div>
          ) : null}
          {doc.totalFa || doc.maturityFa ? (
            <div className="rounded-2xl bg-white p-5">
              <p className="text-xs text-slate-500">جمع‌بندی</p>
              {doc.totalFa ? (
                <p className="mt-2 text-lg font-bold">
                  {doc.totalFa} از {faNum(doc.totalScoreMax ?? 100)}
                </p>
              ) : null}
              {doc.maturityFa ? <p className="mt-1 text-sm text-slate-500">بلوغ: {doc.maturityFa}</p> : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="doc-page mt-6 border border-slate-200 bg-white p-12 print:mt-0">
        <p className="text-xs font-medium text-slate-500">خلاصه</p>
        <h2 className="mt-2 text-2xl font-bold">نمای کلی</h2>
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
        {doc.layers.length ? (
          <table className="mt-8 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-right text-slate-500">
                <th className="py-2 font-medium">لایه</th>
                <th className="py-2 font-medium">نمره</th>
                <th className="py-2 font-medium">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {doc.layers.map((layer) => (
                <tr key={layer.id} className="border-b border-slate-100">
                  <td className="py-2.5">
                    {layer.titleFa}
                    {layer.isBottleneck ? <span className="mr-2 text-xs text-slate-500">گلوگاه</span> : null}
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
        <section className="doc-page mt-6 border border-slate-200 bg-white p-12 print:mt-0">
          <p className="text-xs font-medium text-slate-500">خوانش بین‌لایه</p>
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

      {layerPages.map((page, pageIndex) => (
        <section key={pageIndex} className="doc-page mt-6 border border-slate-200 bg-white p-12 print:mt-0">
          {page.map((layer) => (
            <article key={layer.id}>
              {layer.isBottleneck ? <p className="text-sm font-medium text-indigo-800">گلوگاه</p> : null}
              <h2 className={`${layer.isBottleneck ? "mt-2 " : ""}text-2xl font-bold`}>{layer.titleFa}</h2>
              {layer.constructFa ? <p className="mt-2 text-sm leading-7 text-slate-500">{layer.constructFa}</p> : null}
              <p className="mt-3 text-sm">
                نمره {layer.scoreFa} از {layer.scoreMaxFa}
                {layer.statusFa ? ` — ${layer.statusFa}` : ""}
              </p>
              {layer.asIsFa ? (
                <div className="mt-6">
                  <p className="text-xs font-medium text-slate-500">وضعیت موجود</p>
                  <p className="mt-1 text-sm leading-7">{layer.asIsFa}</p>
                </div>
              ) : null}
              {layer.toBeFa ? (
                <div className="mt-4">
                  <p className="text-xs font-medium text-slate-500">وضعیت مطلوب</p>
                  <p className="mt-1 text-sm leading-7">{layer.toBeFa}</p>
                </div>
              ) : null}
              {layer.actionsFa ? (
                <div className="mt-4">
                  <p className="text-xs font-medium text-slate-500">اقدام پیشنهادی</p>
                  <p className="mt-1 text-sm leading-7">{layer.actionsFa}</p>
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
            </article>
          ))}
        </section>
      ))}

      <section className="doc-page mt-6 flex flex-col justify-end border border-slate-200 bg-white p-12 print:mt-0">
        <p className="text-sm leading-7 text-slate-600">{doc.closingFa}</p>
        <p className="mt-8 text-xs text-slate-400">نسخه {doc.version}</p>
      </section>
    </div>
  );
}
