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

export function CasioSsReport({
  report,
  showHubLink = true,
}: {
  report: CasioReport;
  showHubLink?: boolean;
}) {
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
          <h2 className="text-lg font-bold leading-[1.7] text-ink">خوانش بین‌لایه و الگوهای زمینه‌ای</h2>
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

      {report.ontology ? (
        <section className="surface p-6 sm:p-8">
          <p className="text-sm font-medium text-mark">گراف دانشی Research Vaults (S001–S055)</p>
          <h2 className="mt-2 text-lg font-bold leading-[1.7] text-ink">
            معماری سه سطح عملکرد (Rummler-Brache) و هم‌خوانی سازمانی (Nadler-Tushman)
          </h2>
          {report.contextProfile ? (
            <p className="mt-3 text-sm leading-7 text-ink">
              <strong>جایگاه مرحلهٔ رشد: </strong>
              {report.contextProfile.growthStageTitleFa}
              {" — "}
              <span className="text-muted">{report.contextProfile.growthStageCrisisFa}</span>
            </p>
          ) : null}
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            {report.ontology.rummlerBreakdown.map((lvl) => (
              <div key={lvl.level} className="rounded-lg border border-line p-3">
                <p className="font-medium text-ink">{lvl.labelFa}</p>
                <p className="mt-1 text-xs text-muted">
                  میانگین: {faScore(lvl.avgScore)} از {faNum(20)} · گلوگاه: {lvl.weakestKeywordTitleFa}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-7 text-ink">
            <strong>کانون عدم هم‌خوانی (Nadler &amp; Tushman — S055): </strong>
            <span className="text-muted">{report.ontology.primaryNadlerDisconnectFa}</span>
          </p>
          {report.ontology.activatedSources.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-medium text-ink">منابع علمی فعال‌شده برای گلوگاه‌های شما:</p>
              <ul className="mt-2 space-y-1 text-xs leading-6 text-muted">
                {report.ontology.activatedSources.slice(0, 6).map((src) => (
                  <li key={src.id}>
                    <span className="font-medium text-ink">[{src.id}] {src.titleFa}</span>
                    {" — "}
                    {src.coreTakeawayFa}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
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

          <h3 className="mt-6 text-base font-bold text-ink">درخت کلیدواژه (به ترتیب اولویت گلوگاه)</h3>
          <ul className="mt-3 space-y-4">
            {layer.keywords.map((keyword) => (
              <li key={keyword.id}>
                <p className="text-sm font-medium leading-7 text-ink">
                  {keyword.titleFa}
                  {keyword.score != null ? (
                    <span className="mr-2 text-xs font-normal text-muted">
                      ({faScore(keyword.score)} از {faNum(20)}
                      {keyword.bandLabelFa ? ` · ${keyword.bandLabelFa}` : ""})
                    </span>
                  ) : null}
                  {keyword.canonicalCode ? (
                    <span className="mr-2 font-mono text-xs text-muted">
                      [{keyword.canonicalCode}]
                    </span>
                  ) : null}
                  {keyword.micmacLabelFa ? (
                    <span className="mr-2 rounded border border-line px-1.5 py-0.5 text-[11px] text-muted">
                      {keyword.micmacLabelFa}
                    </span>
                  ) : null}
                </p>
                {keyword.whyFa ? (
                  <p className="mt-1 text-xs leading-6 text-muted">{keyword.whyFa}</p>
                ) : null}
                {(keyword.influencersFa?.length || keyword.influencedFa?.length) ? (
                  <div className="mt-1.5 space-y-0.5 text-xs leading-6 text-muted">
                    {keyword.influencersFa?.length ? (
                      <p>
                        <span className="font-medium text-ink">مؤثرهای بالادستی (علل): </span>
                        {keyword.influencersFa.slice(0, 3).join(" · ")}
                      </p>
                    ) : null}
                    {keyword.influencedFa?.length ? (
                      <p>
                        <span className="font-medium text-ink">متأثرهای پایین‌دستی (پیامدها): </span>
                        {keyword.influencedFa.slice(0, 3).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                ) : null}
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

      {report.causalGraph ? (
        <section className="surface p-6 sm:p-8">
          <p className="text-sm font-medium text-mark">
            تحلیل شبکهٔ علّی مؤثرها و متأثرها (DEMATEL · ISM · MICMAC · کدینگ {report.causalGraph.codingVersion})
          </p>
          <h2 className="mt-2 text-lg font-bold leading-[1.7] text-ink">
            اصلی‌ترین مؤثر ریشه‌ای (اهرم تغییر شماره ۱): {report.causalGraph.primaryRootCauseDriver.titleFa}{" "}
            <span className="font-mono text-xs text-muted">
              [{report.causalGraph.primaryRootCauseDriver.canonicalCode}]
            </span>
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            نقش در شبکهٔ علّی: {report.causalGraph.primaryRootCauseDriver.causalRoleLabelFa} ·{" "}
            {report.causalGraph.primaryRootCauseDriver.micmacLabelFa} · توان اثرگذاری کل (D):{" "}
            {faNum(report.causalGraph.primaryRootCauseDriver.drivingPower)} · توان اثرپذیری کل (R):{" "}
            {faNum(report.causalGraph.primaryRootCauseDriver.dependencePower)} · خالص علّی (D-R):{" "}
            {faNum(report.causalGraph.primaryRootCauseDriver.netCauseEffect)}
          </p>

          {report.causalGraph.symptomTrapWarningFa ? (
            <div className="mt-4 rounded-lg border border-mark/40 bg-mark/5 p-4 text-sm leading-7 text-ink">
              {report.causalGraph.symptomTrapWarningFa}
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {report.causalGraph.interventionWaves.map((wave) => (
              <div key={wave.waveNumber} className="rounded-lg border border-line p-4">
                <p className="text-sm font-bold text-ink">{wave.titleFa}</p>
                <p className="mt-1 text-xs leading-6 text-muted">{wave.rationaleFa}</p>
                <ul className="mt-2 list-disc space-y-1.5 pr-4 text-xs leading-6 text-muted">
                  {wave.keywords.map((item) => (
                    <li key={item.keywordId}>
                      <span className="font-medium text-ink">{item.titleFa}</span>{" "}
                      <span className="font-mono">[{item.canonicalCode}]</span> (امتیاز:{" "}
                      {faNum(Math.round(item.score))} از ۲۰)
                      {item.unlockedDownstreamTitlesFa.length ? (
                        <span className="block text-[11px] text-muted">
                          بازگشایی متأثرها: {item.unlockedDownstreamTitlesFa.join(" · ")}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {report.deepDive ? (
        <section className="surface p-6 sm:p-8">
          <p className="text-sm font-medium text-mark">
            برنامهٔ اقدام علمی ۳۰ روزه (S051 Shook A3 · S022 Taylor PDSA)
          </p>
          <h2 className="mt-2 text-lg font-bold leading-[1.7] text-ink">
            {report.deepDive.a3Sheet.titleFa}
          </h2>
          <p className="mt-2 text-xs text-muted">
            مسئول اجرا: {report.deepDive.a3Sheet.ownerRoleFa} · افق زمانی: {report.deepDive.a3Sheet.horizonFa}
          </p>

          <div className="mt-4 space-y-3 text-sm leading-7">
            <p>
              <span className="font-medium text-ink">۱. پیش‌زمینه و ضرورت مسأله: </span>
              <span className="text-muted">{report.deepDive.a3Sheet.backgroundFa}</span>
            </p>
            <p>
              <span className="font-medium text-ink">۲. وضعیت موجود کمی‌شده (AS-IS): </span>
              <span className="text-muted">{report.deepDive.a3Sheet.currentConditionFa}</span>
            </p>
            <div>
              <p className="font-medium text-ink">
                ۳. تحلیل علت ریشه‌ای در ۳ سطح (بدون مقصرانگاری فردی — S052, S054):
              </p>
              <ul className="mt-1 list-disc space-y-1 pr-5 text-xs leading-6 text-muted">
                <li>{report.deepDive.a3Sheet.multiLevelRootCause.organizationRootFa}</li>
                <li>{report.deepDive.a3Sheet.multiLevelRootCause.processRootFa}</li>
                <li>{report.deepDive.a3Sheet.multiLevelRootCause.performerRootFa}</li>
              </ul>
            </div>
            <p>
              <span className="font-medium text-ink">۴. وضعیت هدف ۳۰ روزه (TO-BE): </span>
              <span className="text-muted">{report.deepDive.a3Sheet.targetCondition30DayFa}</span>
            </p>
          </div>

          <div className="mt-5 rounded-lg border border-line p-4 text-sm leading-7">
            <p className="font-bold text-ink">
              کارت آزمون کوچک ۱۴ روزهٔ PDSA (Plan–Do–Study–Act)
            </p>
            <ul className="mt-2 space-y-2 text-xs leading-6 text-muted">
              <li>{report.deepDive.a3Sheet.pdsaCard.planHypothesisFa}</li>
              <li>{report.deepDive.a3Sheet.pdsaCard.doSmallScaleFa}</li>
              <li>{report.deepDive.a3Sheet.pdsaCard.studyMetricFa}</li>
              <li>{report.deepDive.a3Sheet.pdsaCard.actDecisionRuleFa}</li>
            </ul>
          </div>

          {report.deepDive.recommendedModules.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-base font-bold text-ink">
                کاوش عمیق تطبیقی مرحلهٔ ۲ (انتخاب‌شده از بانک ۸۹ گویه بر اساس گلوگاه شما)
              </h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {report.deepDive.recommendedModules.map((mod) => (
                  <div key={mod.dimensionId} className="rounded-lg border border-line p-4">
                    <p className="text-sm font-medium text-ink">{mod.titleFa}</p>
                    <p className="mt-1 text-xs leading-6 text-muted">{mod.summaryFa}</p>
                    <ul className="mt-2 list-disc space-y-1 pr-4 text-xs leading-6 text-muted">
                      {mod.items.map((it) => (
                        <li key={it.id}>
                          [{it.id}] {it.text}
                          {it.critical ? " (گویهٔ حیاتی)" : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <p className="text-sm leading-7 text-muted">{report.closingFa}</p>

      {showHubLink ? (
        <p>
          <Link href="/analyzers" className="text-sm font-medium text-accent hover:text-ink">
            بازگشت به آینه‌ها
          </Link>
        </p>
      ) : null}
    </div>
  );
}
