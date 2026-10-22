export const HADIRAN_TEMPLATE_HTML = `<section class="doc-page hadiran-cover">
  <div class="hadiran-brand">
    <div class="hadiran-logo">{{{logos.light}}}</div>
    <p>هادیران · سند تفسیر</p>
  </div>
  <h1>{{packNameFa}}</h1>
  <p class="hadiran-lead">تفسیر پاسخ‌های ثبت‌شده. متن سؤال در این سند نیست.</p>
  <dl class="hadiran-meta">
    <div><dt>نام</dt><dd>{{personNameFa}}</dd></div>
    {{#hasBusiness}}<div><dt>کسب‌وکار</dt><dd>{{businessNameFa}}</dd></div>{{/hasBusiness}}
    <div><dt>تاریخ ثبت</dt><dd>{{submittedFa}}</dd></div>
    {{#hasPublicCode}}<div><dt>شناسه</dt><dd dir="ltr">{{publicCode}}</dd></div>{{/hasPublicCode}}
  </dl>
  <div class="hadiran-cards">
    {{#hasBottleneck}}
    <div class="hadiran-card">
      <p class="hadiran-k">گلوگاه</p>
      <p class="hadiran-v">{{bottleneckFa}}</p>
      {{#bottleneckScoreFa}}<p class="hadiran-s">{{bottleneckScoreFa}} از ۲۰</p>{{/bottleneckScoreFa}}
    </div>
    {{/hasBottleneck}}
    {{#hasTotal}}
    <div class="hadiran-card">
      <p class="hadiran-k">جمع‌بندی</p>
      <p class="hadiran-v">{{totalFa}} از {{totalMaxFa}}</p>
      {{#maturityFa}}<p class="hadiran-s">بلوغ: {{maturityFa}}</p>{{/maturityFa}}
    </div>
    {{/hasTotal}}
  </div>
</section>

<section class="doc-page hadiran-sheet">
  <p class="hadiran-kicker">خلاصه</p>
  <h2>نمای کلی</h2>
  {{#hasContext}}
  <dl class="hadiran-meta">
    {{#context}}<div><dt>{{labelFa}}</dt><dd>{{valueFa}}</dd></div>{{/context}}
  </dl>
  {{/hasContext}}
  {{#hasLayers}}
  <table class="hadiran-table">
    <thead><tr><th>لایه</th><th>نمره</th><th>وضعیت</th></tr></thead>
    <tbody>
      {{#layers}}
      <tr>
        <td>{{titleFa}}{{#isBottleneck}} <span class="hadiran-gap">گلوگاه</span>{{/isBottleneck}}</td>
        <td>{{scoreFa}} از {{scoreMaxFa}}</td>
        <td>{{statusFa}}</td>
      </tr>
      {{/layers}}
    </tbody>
  </table>
  {{/hasLayers}}
</section>

{{#hasPatterns}}
<section class="doc-page hadiran-sheet">
  <p class="hadiran-kicker">خوانش بین‌لایه</p>
  <ul class="hadiran-patterns">
    {{#patterns}}<li><p>{{meaningFa}}</p><p class="hadiran-s">{{actionFa}}</p></li>{{/patterns}}
  </ul>
</section>
{{/hasPatterns}}

{{#layers}}
<section class="doc-page hadiran-sheet">
  {{#isBottleneck}}<p class="hadiran-gap">گلوگاه</p>{{/isBottleneck}}
  <h2>{{titleFa}}</h2>
  {{#constructFa}}<p class="hadiran-s">{{constructFa}}</p>{{/constructFa}}
  <p>نمره {{scoreFa}} از {{scoreMaxFa}}{{#statusFa}} — {{statusFa}}{{/statusFa}}</p>
  {{#asIsFa}}<div class="hadiran-block"><p class="hadiran-k">وضعیت موجود</p><p>{{asIsFa}}</p></div>{{/asIsFa}}
  {{#toBeFa}}<div class="hadiran-block"><p class="hadiran-k">وضعیت مطلوب</p><p>{{toBeFa}}</p></div>{{/toBeFa}}
  {{#actionsFa}}<div class="hadiran-block"><p class="hadiran-k">اقدام پیشنهادی</p><p>{{actionsFa}}</p></div>{{/actionsFa}}
</section>
{{/layers}}

<section class="doc-page hadiran-sheet hadiran-end">
  <p>{{closingFa}}</p>
  <div class="hadiran-brand hadiran-foot">
    <div class="hadiran-logo hadiran-logo-sm">{{{logos.light}}}</div>
    <p>هادیران · نسخه {{version}}</p>
  </div>
</section>
`;

export const HADIRAN_TEMPLATE_CSS = `/* جای لوگو */
.doc-hadiran {
  --logo-cover-size: 40px;
  --logo-foot-size: 32px;
  color: #0f172a;
}
.doc-hadiran .hadiran-logo { width: var(--logo-cover-size); height: var(--logo-cover-size); color: #1b1464; }
.doc-hadiran .hadiran-logo svg { width: 100%; height: 100%; display: block; }
.doc-hadiran .hadiran-logo-sm { width: var(--logo-foot-size); height: var(--logo-foot-size); }
.doc-hadiran .doc-page { min-height: 270mm; padding: 48px; box-sizing: border-box; }
.doc-hadiran .hadiran-cover { background: #f7f6f2; border: 1px solid #e2e8f0; }
.doc-hadiran .hadiran-sheet { margin-top: 24px; background: #fff; border: 1px solid #e2e8f0; }
.doc-hadiran .hadiran-brand { display: flex; align-items: center; gap: 12px; color: #64748b; font-size: 14px; }
.doc-hadiran h1 { margin: 64px 0 0; font-size: 30px; font-weight: 700; }
.doc-hadiran h2 { margin: 8px 0 0; font-size: 24px; font-weight: 700; }
.doc-hadiran .hadiran-lead { margin-top: 12px; font-size: 14px; line-height: 1.8; color: #475569; }
.doc-hadiran .hadiran-meta { margin-top: 40px; display: grid; gap: 16px; grid-template-columns: 1fr 1fr; font-size: 14px; }
.doc-hadiran .hadiran-meta dt { color: #64748b; }
.doc-hadiran .hadiran-cards { margin-top: 40px; display: grid; gap: 16px; grid-template-columns: 1fr 1fr; }
.doc-hadiran .hadiran-card { background: #fff; border-radius: 16px; padding: 20px; }
.doc-hadiran .hadiran-k, .doc-hadiran .hadiran-kicker { font-size: 12px; color: #64748b; font-weight: 600; }
.doc-hadiran .hadiran-v { margin-top: 8px; font-size: 18px; font-weight: 700; }
.doc-hadiran .hadiran-s { margin-top: 4px; font-size: 13px; color: #64748b; line-height: 1.7; }
.doc-hadiran .hadiran-table { width: 100%; margin-top: 32px; font-size: 14px; border-collapse: collapse; }
.doc-hadiran .hadiran-table th, .doc-hadiran .hadiran-table td { text-align: right; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
.doc-hadiran .hadiran-gap { color: #1e3a8a; font-size: 13px; font-weight: 600; }
.doc-hadiran .hadiran-patterns { list-style: none; padding: 0; margin-top: 24px; }
.doc-hadiran .hadiran-patterns li { margin-bottom: 24px; font-size: 14px; line-height: 1.8; }
.doc-hadiran .hadiran-block { margin-top: 20px; font-size: 14px; line-height: 1.8; }
.doc-hadiran .hadiran-end { display: flex; flex-direction: column; justify-content: flex-end; }
.doc-hadiran .hadiran-foot { margin-top: 32px; }
@media print {
  .doc-hadiran .hadiran-sheet { margin-top: 0; }
}
`;

export { CASIO_TEMPLATE_HTML } from "@/lib/analyzers/casio-ss/template-html";
export { CASIO_TEMPLATE_CSS } from "@/lib/analyzers/casio-ss/template-css";

/** قالب پایهٔ «عارضه‌یابی سیستم کسب‌وکار»: جدول امتیاز کلیدواژه‌ها، موج‌های مداخلهٔ علّی و برگهٔ A3. */
export const SYSTEM_DIAGNOSIS_TEMPLATE_HTML = `<section class="doc-page hadiran-cover">
  <div class="hadiran-brand">
    <div class="hadiran-logo">{{{logos.light}}}</div>
    <p>هادیران · عارضه‌یابی سیستم کسب‌وکار</p>
  </div>
  <h1>{{packNameFa}}</h1>
  <p class="hadiran-lead">گزارش عارضه‌یابی بر اساس امتیاز واقعی هر لایه و هر کلیدواژه، همراه با تحلیل علّی مؤثرها و متأثرها.</p>
  <dl class="hadiran-meta">
    <div><dt>نام</dt><dd>{{personNameFa}}</dd></div>
    {{#hasBusiness}}<div><dt>کسب‌وکار</dt><dd>{{businessNameFa}}</dd></div>{{/hasBusiness}}
    <div><dt>تاریخ ثبت</dt><dd>{{submittedFa}}</dd></div>
    {{#hasPublicCode}}<div><dt>شناسه</dt><dd dir="ltr">{{publicCode}}</dd></div>{{/hasPublicCode}}
  </dl>
  <div class="hadiran-cards">
    {{#hasBottleneck}}
    <div class="hadiran-card">
      <p class="hadiran-k">گلوگاه</p>
      <p class="hadiran-v">{{bottleneckFa}}</p>
      {{#bottleneckScoreFa}}<p class="hadiran-s">{{bottleneckScoreFa}} از ۲۰</p>{{/bottleneckScoreFa}}
    </div>
    {{/hasBottleneck}}
    {{#hasTotal}}
    <div class="hadiran-card">
      <p class="hadiran-k">نمرهٔ کل</p>
      <p class="hadiran-v">{{totalFa}} از {{totalMaxFa}}</p>
      {{#maturityFa}}<p class="hadiran-s">بلوغ: {{maturityFa}}</p>{{/maturityFa}}
    </div>
    {{/hasTotal}}
  </div>
</section>

{{#layers}}
<section class="doc-page hadiran-sheet">
  <p class="hadiran-kicker">لایه</p>
  <h2>{{titleFa}} — {{scoreFa}} از ۲۰ ({{statusFa}})</h2>
  <p>{{asIsFa}}</p>
  <p><b>وضعیت مطلوب:</b> {{toBeFa}}</p>
  <p><b>اقدام‌ها:</b> {{actionsFa}}</p>
  <table class="hadiran-table">
    <thead><tr><th>کلیدواژه</th><th>نمره</th><th>وضعیت</th><th>افق / مسئول</th></tr></thead>
    <tbody>
      {{#keywords}}
      <tr>
        <td>{{titleFa}}{{#micmacLabelFa}}<br><small>{{micmacLabelFa}}</small>{{/micmacLabelFa}}</td>
        <td>{{scoreFa}}/۲۰</td>
        <td>{{bandLabelFa}}</td>
        <td>{{horizonFa}}{{#ownerRoleFa}} · {{ownerRoleFa}}{{/ownerRoleFa}}</td>
      </tr>
      {{/keywords}}
    </tbody>
  </table>
</section>
{{/layers}}

{{#hasInterventionWaves}}
<section class="doc-page hadiran-sheet">
  <p class="hadiran-kicker">نقشهٔ راه علّی</p>
  <h2>موج‌های مداخله: از مؤثر ریشه‌ای تا متأثر نهایی</h2>
  {{#hasSymptomTrap}}<p class="sd-trap">{{symptomTrapWarningFa}}</p>{{/hasSymptomTrap}}
  {{#interventionWaves}}
  <h3>{{titleFa}}</h3>
  <p>{{rationaleFa}}</p>
  <ul>{{#keywords}}<li>{{titleFa}} <span dir="ltr">({{canonicalCode}})</span></li>{{/keywords}}</ul>
  {{/interventionWaves}}
</section>
{{/hasInterventionWaves}}

{{#hasA3}}
<section class="doc-page hadiran-sheet">
  <p class="hadiran-kicker">برگهٔ حل مسئله</p>
  <h2>{{a3.titleFa}}</h2>
  <p><b>پیشینه:</b> {{a3.backgroundFa}}</p>
  <p><b>وضعیت فعلی:</b> {{a3.currentConditionFa}}</p>
  <p><b>ریشهٔ سازمانی:</b> {{a3.organizationRootFa}}</p>
  <p><b>ریشهٔ فرایندی:</b> {{a3.processRootFa}}</p>
  <p><b>ریشهٔ مجری:</b> {{a3.performerRootFa}}</p>
  <p><b>هدف ۳۰ روزه:</b> {{a3.targetCondition30DayFa}}</p>
  <p><b>برنامه (Plan):</b> {{a3.pdsaPlanFa}}</p>
  <p><b>اجرا (Do):</b> {{a3.pdsaDoFa}}</p>
  <p><b>بررسی (Study):</b> {{a3.pdsaStudyFa}}</p>
  <p><b>تصمیم (Act):</b> {{a3.pdsaActFa}}</p>
</section>
{{/hasA3}}

<section class="doc-page hadiran-sheet">
  <h2>یادداشت پایانی</h2>
  <p>{{closingFa}}</p>
</section>
`;

export const SYSTEM_DIAGNOSIS_TEMPLATE_CSS = `
.sd-trap { border: 1px solid #b91c1c; color: #7f1d1d; border-radius: 12px; padding: 10px 14px; }
`;
