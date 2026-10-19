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

export const CASIO_TEMPLATE_HTML = `<section class="doc-page casio-page casio-cover">
  <div class="casio-cover-logo">{{{logos.light}}}</div>
  <div class="casio-cover-tag">PROFILE 02 · RESEARCH</div>
  <div class="casio-cover-title-block">
    {{#personNameFa}}<div class="casio-cover-eyebrow">{{personNameFa}}</div>{{/personNameFa}}
    <h1 class="casio-cover-title">{{packNameFa}}</h1>
    {{#hasBusiness}}<div class="casio-cover-subtitle">{{businessNameFa}}</div>{{/hasBusiness}}
    <div class="casio-cover-rule"></div>
  </div>
  <div class="casio-cover-cards">
    <div class="casio-cover-card">
      <div class="casio-cover-card-label">گلوگاه بحرانی</div>
      <div class="casio-cover-card-value">{{bottleneckFa}}</div>
      <div class="casio-cover-card-note">{{#bottleneckScoreFa}}{{bottleneckScoreFa}} از ۲۰{{/bottleneckScoreFa}}</div>
    </div>
    <div class="casio-cover-card">
      <div class="casio-cover-card-label">نمره کل</div>
      <div class="casio-cover-card-score">
        <span class="casio-cover-score-number">{{totalFa}}</span>
        <span class="casio-cover-score-of">از {{totalMaxFa}}</span>
      </div>
      <div class="casio-cover-card-note">بلوغ کلی: {{maturityFa}}</div>
    </div>
  </div>
  <div class="casio-cover-footer">
    <div class="casio-cover-footer-rule"></div>
    <div class="casio-cover-footer-row">
      <div class="casio-cover-badge">PROFILE 02 · RESEARCH</div>
      <div class="casio-cover-footer-text">گزارش پاسخ‌ها و تفسیرها · {{submittedFa}}</div>
    </div>
  </div>
</section>

<section class="doc-page casio-page">
  <div class="casio-pagehead">
    <div class="casio-runhead">
      <div class="casio-runhead-profile">PROFILE 02 · RESEARCH</div>
      <div class="casio-runhead-title">گزارش ماتریسی شکاف · پروفایل پژوهش</div>
    </div>
    <div class="casio-head-kicker">خلاصه مدیریتی · نمای پنج‌لایه</div>
    <h1 class="casio-head-title">تصویر کلی شکاف</h1>
    <div class="casio-head-subtitle">{{personNameFa}}{{#hasBusiness}} · {{businessNameFa}}{{/hasBusiness}}</div>
    <div class="casio-head-hairline"></div>
  </div>
  <div class="casio-pagehead-rule"></div>
  <div class="casio-summary-cards">
    <div class="casio-card">
      <div class="casio-card-label">نمره کل</div>
      <div class="casio-card-score">
        <span class="casio-card-score-number">{{totalFa}}</span>
        <span class="casio-card-score-of">از {{totalMaxFa}}</span>
      </div>
      <div class="casio-card-note">بلوغ کلی: {{maturityFa}}</div>
    </div>
    <div class="casio-card">
      <div class="casio-card-label">گلوگاه بحرانی</div>
      <div class="casio-card-value">{{bottleneckFa}}</div>
      <div class="casio-card-note">{{bottleneckScoreFa}} از ۲۰</div>
    </div>
  </div>
  {{#hasRadar}}{{{radarSvg}}}{{/hasRadar}}
  {{#hasContext}}
  <dl class="casio-context">
    {{#context}}<div><dt>{{labelFa}}</dt><dd>{{valueFa}}</dd></div>{{/context}}
  </dl>
  {{/hasContext}}
  {{#hasLayers}}
  <div class="casio-table-title">جدول خلاصه</div>
  <table class="casio-summary-table">
    <thead><tr><th>لایه</th><th>نمره از ۲۰</th><th>وضعیت</th></tr></thead>
    <tbody>
      {{#layers}}
      <tr>
        <td class="casio-cell-layer">{{titleFa}}{{#isBottleneck}}<span class="casio-gap-mark">گلوگاه</span>{{/isBottleneck}}</td>
        <td class="casio-cell-score">
          <div class="casio-score-line">{{scoreFa}} / {{scoreMaxFa}}</div>
          <div class="casio-bar"><div class="casio-bar-fill" style="width: {{ratio}}%"></div></div>
        </td>
        <td class="casio-cell-status"><span class="casio-pill {{#isBottleneck}}casio-pill-weak{{/isBottleneck}}{{^isBottleneck}}casio-pill-grow{{/isBottleneck}}">{{statusFa}}</span></td>
      </tr>
      {{/layers}}
    </tbody>
  </table>
  {{/hasLayers}}
  <div class="casio-note">این گزارش متن سؤال‌ها را نمایش نمی‌دهد؛ نمره‌ها و خوانش لایه‌ها از پاسخ‌های ثبت‌شده آمده‌اند.</div>
  <div class="casio-page-footer">
    <div class="casio-footer-rule"></div>
    <div class="casio-footer-row">
      <div class="casio-footer-profile"><div>PROFILE 02</div><div>RESEARCH</div></div>
      <div class="casio-footer-seal">{{{logos.seal}}}</div>
      <div class="casio-footer-page">گزارش تفسیر پاسخ‌ها</div>
    </div>
  </div>
</section>

{{#hasPatterns}}
<section class="doc-page casio-page">
  <div class="casio-pagehead">
    <div class="casio-runhead">
      <div class="casio-runhead-profile">PROFILE 02 · RESEARCH</div>
      <div class="casio-runhead-title">گزارش ماتریسی شکاف · پروفایل پژوهش</div>
    </div>
    <div class="casio-head-kicker">خوانش بین‌لایه</div>
    <h1 class="casio-head-title">الگوهای مشترک</h1>
    <div class="casio-head-hairline"></div>
  </div>
  <div class="casio-pagehead-rule"></div>
  <ul class="casio-patterns">
    {{#patterns}}<li><p>{{meaningFa}}</p><p class="casio-muted">{{actionFa}}</p></li>{{/patterns}}
  </ul>
  <div class="casio-page-footer">
    <div class="casio-footer-rule"></div>
    <div class="casio-footer-row">
      <div class="casio-footer-profile"><div>PROFILE 02</div><div>RESEARCH</div></div>
      <div class="casio-footer-seal">{{{logos.seal}}}</div>
      <div class="casio-footer-page">گزارش تفسیر پاسخ‌ها</div>
    </div>
  </div>
</section>
{{/hasPatterns}}

{{#layers}}
<section class="doc-page casio-page">
  <div class="casio-pagehead">
    <div class="casio-runhead">
      <div class="casio-runhead-profile">PROFILE 02 · RESEARCH</div>
      <div class="casio-runhead-title">گزارش ماتریسی شکاف · پروفایل پژوهش</div>
    </div>
    <div class="casio-head-kicker">تفسیر لایه‌ها</div>
    <h1 class="casio-head-title">{{titleFa}}</h1>
    <div class="casio-head-subtitle">وضعیت موجود، وضعیت مطلوب و اقدامات فعال‌شده بر اساس پاسخ‌ها</div>
    <div class="casio-head-hairline"></div>
  </div>
  <div class="casio-pagehead-rule"></div>
  <div class="casio-layer-card">
    <div class="casio-layer-head">
      <div class="casio-layer-badge {{#isBottleneck}}casio-badge-weak{{/isBottleneck}}{{^isBottleneck}}casio-badge-grow{{/isBottleneck}}">{{indexFa}}</div>
      <div>
        <div class="casio-layer-name">{{titleFa}}</div>
        <div class="casio-layer-score">{{scoreFa}} از {{scoreMaxFa}}{{#statusFa}} · {{statusFa}}{{/statusFa}}{{#isBottleneck}} · گلوگاه{{/isBottleneck}}</div>
      </div>
    </div>
    {{#constructFa}}<p class="casio-construct">{{constructFa}}</p>{{/constructFa}}
    <div class="casio-asistobe">
      {{#asIsFa}}<div class="casio-asistobe-box"><div class="casio-asistobe-label">وضعیت موجود · As-Is</div><div class="casio-asistobe-text">{{asIsFa}}</div></div>{{/asIsFa}}
      {{#toBeFa}}<div class="casio-asistobe-box"><div class="casio-asistobe-label">وضعیت مطلوب · To-Be</div><div class="casio-asistobe-text">{{toBeFa}}</div></div>{{/toBeFa}}
    </div>
    <div class="casio-actions-label">اقدامات پیشنهادی فعال‌شده</div>
    {{#actions}}
    <div class="casio-action">
      <div class="casio-action-text"><div class="casio-action-title">{{title}}</div></div>
      <div class="casio-action-badge">{{indexFa}}</div>
    </div>
    {{/actions}}
    {{^actions}}<div class="casio-no-actions">اقدام فعال‌شده‌ای وجود ندارد.</div>{{/actions}}
    <div class="casio-score-strip">
      <div class="casio-score-strip-label">نمرهٔ این لایه</div>
      <div class="casio-score-strip-value">{{scoreFa}} از {{scoreMaxFa}}</div>
    </div>
  </div>
  <div class="casio-page-footer">
    <div class="casio-footer-rule"></div>
    <div class="casio-footer-row">
      <div class="casio-footer-profile"><div>PROFILE 02</div><div>RESEARCH</div></div>
      <div class="casio-footer-seal">{{{logos.seal}}}</div>
      <div class="casio-footer-page">گزارش تفسیر پاسخ‌ها</div>
    </div>
  </div>
</section>
{{/layers}}

<section class="doc-page casio-page">
  <div class="casio-pagehead">
    <div class="casio-runhead">
      <div class="casio-runhead-profile">PROFILE 02 · RESEARCH</div>
      <div class="casio-runhead-title">گزارش ماتریسی شکاف · پروفایل پژوهش</div>
    </div>
    <div class="casio-head-kicker">پایان گزارش</div>
    <h1 class="casio-head-title">یادداشت</h1>
    <div class="casio-head-hairline"></div>
  </div>
  <div class="casio-pagehead-rule"></div>
  <p class="casio-closing">{{closingFa}}</p>
  {{#hasPublicCode}}<p class="casio-muted" dir="ltr">{{publicCode}}</p>{{/hasPublicCode}}
  <p class="casio-muted">نسخه {{version}}</p>
  <div class="casio-page-footer">
    <div class="casio-footer-rule"></div>
    <div class="casio-footer-row">
      <div class="casio-footer-profile"><div>PROFILE 02</div><div>RESEARCH</div></div>
      <div class="casio-footer-seal">{{{logos.seal}}}</div>
      <div class="casio-footer-page">گزارش تفسیر پاسخ‌ها</div>
    </div>
  </div>
</section>
`;

export const CASIO_TEMPLATE_CSS = `@font-face {
  font-family: "Abar Low";
  src: url("/casio-ss/fonts/AbarLow-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
.doc-casio {
  --navy: #0E2841;
  --research-blue: #156082;
  --document-white: #E7EAEC;
  --deep-maroon: #7F0000;
  --cream: #F6F2E9;
  --muted: #5A6C7D;
  --row-alt: #F8F9FA;
  --card-bg: #FFFFFF;
  --card-border: #E1E6EA;
  --hairline: #C9D3DA;
  --bar-track: #E3E9ED;
  --box: #EDEFF2;
  --weak-bg: #F5E8E8;
  --weak-text: #7F0000;
  --grow-bg: #EDEFF2;
  --grow-text: #354B60;
  --cover-card-bg: #1F374E;
  --cover-text-muted: #C3CFDC;
  --cover-subtitle: #D7DFE7;
  --logo-cover-top: 63pt;
  --logo-cover-right: 49pt;
  --logo-cover-width: 85pt;
  --logo-seal-width: 14pt;
  --logo-seal-bottom: 56pt;
  font-family: "Abar Low", Vazirmatn, sans-serif;
  color: var(--navy);
  background: var(--document-white);
}
.doc-casio .casio-page {
  position: relative;
  background: #fff;
  min-height: 297mm;
  padding: 12pt 44pt 88pt;
  box-sizing: border-box;
  overflow: hidden;
}
.doc-casio .casio-cover { background: var(--navy); color: var(--cream); padding: 0 49pt 88pt; min-height: 297mm; }
.doc-casio .casio-cover-logo {
  position: absolute;
  top: var(--logo-cover-top);
  right: var(--logo-cover-right);
  width: var(--logo-cover-width);
}
.doc-casio .casio-cover-logo svg,
.doc-casio .casio-footer-seal svg { width: 100%; height: auto; display: block; }
.doc-casio .casio-cover-tag {
  position: absolute; top: 74pt; left: 49pt;
  font-size: 8.2pt; font-weight: 600; letter-spacing: 2.6pt; color: var(--cover-text-muted);
}
.doc-casio .casio-cover-title-block { padding-top: 220pt; text-align: right; }
.doc-casio .casio-cover-eyebrow { font-size: 11pt; color: var(--cover-text-muted); }
.doc-casio .casio-cover-title {
  margin: 8pt 0 0; font-size: 30pt; font-weight: 700; line-height: 1.4; color: var(--cream);
  max-width: 280pt; margin-inline-start: auto;
}
.doc-casio .casio-cover-subtitle { margin-top: 16pt; font-size: 13pt; color: var(--cover-subtitle); line-height: 1.5; }
.doc-casio .casio-cover-rule { margin-top: 18pt; margin-inline-start: auto; width: 127pt; height: 2pt; background: var(--research-blue); }
.doc-casio .casio-cover-cards { display: flex; gap: 10pt; margin-top: 20pt; }
.doc-casio .casio-cover-card {
  flex: 1; background: var(--cover-card-bg); border: 0.9pt solid rgba(246,242,233,0.28);
  border-radius: 8pt; padding: 15pt 17pt; min-height: 120pt;
}
.doc-casio .casio-cover-card-label { font-size: 10pt; color: var(--cover-text-muted); }
.doc-casio .casio-cover-card-value { margin-top: 10pt; font-size: 20pt; font-weight: 700; color: var(--cream); }
.doc-casio .casio-cover-score-number { font-size: 28pt; font-weight: 700; color: var(--cream); }
.doc-casio .casio-cover-score-of { font-size: 11.5pt; color: var(--cover-text-muted); margin-inline-start: 4pt; }
.doc-casio .casio-cover-card-note { margin-top: 8pt; font-size: 10.5pt; color: var(--cover-text-muted); }
.doc-casio .casio-cover-footer { position: absolute; right: 49pt; left: 49pt; bottom: 80pt; }
.doc-casio .casio-cover-footer-rule { height: 1pt; background: rgba(246,242,233,0.32); }
.doc-casio .casio-cover-footer-row { margin-top: 13pt; display: flex; justify-content: space-between; align-items: center; }
.doc-casio .casio-cover-footer-text { font-size: 8.8pt; color: var(--cover-text-muted); }
.doc-casio .casio-cover-badge {
  background: var(--deep-maroon); color: var(--cream); font-size: 7.6pt; font-weight: 600;
  letter-spacing: 1.1pt; padding: 6pt 11pt; border-radius: 3pt;
}
.doc-casio .casio-runhead { display: flex; justify-content: space-between; align-items: baseline; }
.doc-casio .casio-runhead-profile { font-size: 7.8pt; font-weight: 600; letter-spacing: 1.4pt; color: var(--deep-maroon); }
.doc-casio .casio-runhead-title { font-size: 8.8pt; color: var(--navy); }
.doc-casio .casio-head-kicker { margin-top: 16pt; font-size: 9pt; color: var(--deep-maroon); }
.doc-casio .casio-head-title { margin: 4pt 0 0; font-size: 22pt; font-weight: 700; color: var(--navy); }
.doc-casio .casio-head-subtitle { margin-top: 5pt; font-size: 10.5pt; color: var(--muted); }
.doc-casio .casio-head-hairline { margin-top: 11pt; height: 1pt; background: var(--research-blue); }
.doc-casio .casio-pagehead-rule { margin-top: 9pt; height: 2pt; display: flex; justify-content: space-between; }
.doc-casio .casio-pagehead-rule::before, .doc-casio .casio-pagehead-rule::after { content: ""; width: 47.5%; }
.doc-casio .casio-pagehead-rule::before { background: var(--deep-maroon); }
.doc-casio .casio-pagehead-rule::after { background: var(--research-blue); }
.doc-casio .casio-summary-cards { display: flex; gap: 10pt; margin-top: 12pt; }
.doc-casio .casio-card { flex: 1; background: var(--card-bg); border: 0.9pt solid var(--card-border); border-radius: 8pt; padding: 13pt 16pt; }
.doc-casio .casio-card-label { font-size: 10pt; color: var(--muted); }
.doc-casio .casio-card-score-number { font-size: 24pt; font-weight: 700; }
.doc-casio .casio-card-score-of { font-size: 11pt; color: var(--muted); margin-inline-start: 4pt; }
.doc-casio .casio-card-value { margin-top: 4pt; font-size: 18pt; font-weight: 700; }
.doc-casio .casio-card-note { margin-top: 3pt; font-size: 10.5pt; color: var(--muted); }
.doc-casio .casio-radar { margin: 14pt auto 4pt; text-align: center; }
.doc-casio .casio-radar svg { max-width: 100%; height: auto; }
.doc-casio .casio-radar figcaption { margin-top: 4pt; font-size: 9pt; color: var(--muted); }
.doc-casio .casio-context { display: grid; grid-template-columns: 1fr 1fr; gap: 8pt 16pt; margin-top: 12pt; font-size: 10.5pt; }
.doc-casio .casio-context dt { color: var(--muted); }
.doc-casio .casio-table-title { margin: 14pt 0 6pt; font-size: 13pt; font-weight: 700; }
.doc-casio .casio-summary-table { width: 100%; border-collapse: collapse; }
.doc-casio .casio-summary-table thead th {
  background: var(--navy); color: var(--cream); font-size: 9pt; font-weight: 600;
  padding: 6.5pt 10pt; text-align: right;
}
.doc-casio .casio-summary-table tbody tr:nth-child(even) td { background: var(--row-alt); }
.doc-casio .casio-summary-table tbody td {
  border-bottom: 0.9pt solid var(--card-border); padding: 6pt 9pt; font-size: 10.5pt; vertical-align: middle;
}
.doc-casio .casio-cell-layer { font-weight: 600; }
.doc-casio .casio-gap-mark { margin-inline-start: 6pt; font-size: 8pt; color: var(--deep-maroon); font-weight: 400; }
.doc-casio .casio-cell-score, .doc-casio .casio-cell-status { text-align: center; }
.doc-casio .casio-bar { margin-top: 4pt; height: 3.4pt; background: var(--bar-track); border-radius: 2pt; overflow: hidden; }
.doc-casio .casio-bar-fill { height: 3.4pt; background: var(--navy); }
.doc-casio .casio-pill { display: inline-block; padding: 2.4pt 6.5pt; border-radius: 7pt; font-size: 8.4pt; }
.doc-casio .casio-pill-weak { background: var(--weak-bg); color: var(--weak-text); }
.doc-casio .casio-pill-grow { background: var(--grow-bg); color: var(--grow-text); }
.doc-casio .casio-note {
  margin-top: 12pt; background: var(--row-alt); border-inline-start: 3pt solid var(--deep-maroon);
  border-radius: 3pt; padding: 10pt 12pt; font-size: 9.6pt; color: var(--grow-text); line-height: 1.65;
}
.doc-casio .casio-layer-card {
  margin-top: 12pt; background: var(--card-bg); border: 0.9pt solid var(--card-border);
  border-radius: 8pt; padding: 12pt 15pt;
}
.doc-casio .casio-layer-head { display: flex; align-items: center; }
.doc-casio .casio-layer-badge {
  width: 24pt; height: 24pt; border-radius: 50%; color: var(--cream); font-size: 11.5pt; font-weight: 700;
  text-align: center; line-height: 24pt; margin-inline-end: 10pt; flex: none;
}
.doc-casio .casio-badge-weak { background: var(--deep-maroon); }
.doc-casio .casio-badge-grow { background: var(--navy); }
.doc-casio .casio-layer-name { font-size: 16pt; font-weight: 700; }
.doc-casio .casio-layer-score { font-size: 9.6pt; color: var(--muted); }
.doc-casio .casio-construct { margin-top: 8pt; font-size: 10pt; color: var(--muted); line-height: 1.6; }
.doc-casio .casio-asistobe { display: flex; gap: 8pt; margin-top: 10pt; }
.doc-casio .casio-asistobe-box { flex: 1; background: var(--box); border-radius: 6pt; padding: 8pt 11pt; }
.doc-casio .casio-asistobe-label { font-size: 8.8pt; font-weight: 600; }
.doc-casio .casio-asistobe-text { margin-top: 3pt; font-size: 9.8pt; color: var(--grow-text); line-height: 1.5; }
.doc-casio .casio-actions-label { margin: 10pt 0 3pt; font-size: 9.4pt; color: var(--muted); }
.doc-casio .casio-action {
  display: flex; align-items: center; border: 0.9pt solid #E4E9ED; border-radius: 6pt;
  padding: 6pt 10pt; margin-top: 5pt;
}
.doc-casio .casio-action-title { font-size: 11pt; line-height: 1.4; }
.doc-casio .casio-action-badge {
  flex: none; width: 14.5pt; height: 14.5pt; border-radius: 50%; background: var(--navy); color: var(--cream);
  font-size: 8.4pt; text-align: center; line-height: 14.5pt; margin-inline-start: 10pt;
}
.doc-casio .casio-no-actions {
  border: 1pt dashed #C8D2DA; border-radius: 6pt; padding: 8pt; text-align: center; font-size: 9.4pt; color: var(--muted);
}
.doc-casio .casio-score-strip {
  margin-top: 10pt; background: var(--navy); border-radius: 4pt; padding: 6pt 12pt;
  display: flex; justify-content: space-between; color: var(--cream);
}
.doc-casio .casio-score-strip-value { font-weight: 700; }
.doc-casio .casio-page-footer { position: absolute; left: 44pt; right: 44pt; bottom: var(--logo-seal-bottom); }
.doc-casio .casio-footer-rule { height: 1pt; background: var(--hairline); }
.doc-casio .casio-footer-row { margin-top: 8pt; display: flex; justify-content: space-between; align-items: center; }
.doc-casio .casio-footer-profile {
  font-size: 7.4pt; font-weight: 600; letter-spacing: 0.6pt; color: var(--deep-maroon); text-align: center; line-height: 1.4;
}
.doc-casio .casio-footer-seal { width: var(--logo-seal-width); }
.doc-casio .casio-footer-page { font-size: 8.8pt; color: var(--muted); }
.doc-casio .casio-muted { color: var(--muted); font-size: 10pt; margin-top: 8pt; }
.doc-casio .casio-patterns { margin-top: 16pt; padding: 0; list-style: none; }
.doc-casio .casio-patterns li { margin-bottom: 14pt; font-size: 11pt; line-height: 1.7; }
.doc-casio .casio-closing { margin-top: 18pt; font-size: 12pt; line-height: 1.8; }
@media print {
  .doc-casio, .doc-casio .casio-page, .doc-casio .casio-cover, .doc-casio .casio-bar-fill,
  .doc-casio .casio-score-strip, .doc-casio .casio-cover-card, .doc-casio .casio-pill {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
`;
