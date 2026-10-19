export const CASIO_TEMPLATE_HTML = `<section class="doc-page casio-cover">
    <div class="casio-brand">
      <div class="casio-logo">{{{logos.light}}}</div>
      <p>کاسیو · گزارش ماتریسی شکاف</p>
    </div>
    <h1>{{packNameFa}}</h1>
    <p class="casio-lead">تفسیر پاسخ‌های ثبت‌شده. متن سؤال در این سند نیست.</p>
    <dl class="casio-meta">
      <div><dt>نام</dt><dd>{{personNameFa}}</dd></div>
      {{#hasBusiness}}<div><dt>کسب‌وکار</dt><dd>{{businessNameFa}}</dd></div>{{/hasBusiness}}
      <div><dt>تاریخ ثبت</dt><dd>{{submittedFa}}</dd></div>
      {{#hasPublicCode}}<div><dt>شناسه</dt><dd dir="ltr">{{publicCode}}</dd></div>{{/hasPublicCode}}
    </dl>
    <div class="casio-cover-main">
      <div class="cover-chart-wrap">
        <div class="cover-chart-svg">{{{overallChartSvg}}}</div>
        {{#hasTotal}}<div class="cover-chart-total">{{totalFa}}<small>از {{totalMaxFa}}</small></div>{{/hasTotal}}
      </div>
      <div class="casio-cards">
        {{#hasBottleneck}}
        <div class="casio-card">
          <p class="casio-k">گلوگاه</p>
          <p class="casio-v">{{bottleneckFa}}</p>
          {{#bottleneckScoreFa}}<p class="casio-s">{{bottleneckScoreFa}} از ۲۰</p>{{/bottleneckScoreFa}}
        </div>
        {{/hasBottleneck}}
        {{#hasTotal}}
        <div class="casio-card">
          <p class="casio-k">جمع‌بندی</p>
          <p class="casio-v">{{totalFa}} از {{totalMaxFa}}</p>
          {{#maturityFa}}<p class="casio-s">بلوغ: {{maturityFa}}</p>{{/maturityFa}}
        </div>
        {{/hasTotal}}
      </div>
    </div>
    {{#hasLayers}}
    <div class="cover-layer-scores">
      {{#layers}}<div class="cover-layer-score"><span>{{titleFa}}</span><b>{{scoreFa}} / {{scoreMaxFa}}</b></div>{{/layers}}
    </div>
    {{/hasLayers}}
    <div class="cover-foot"><span>{{packNameFa}}</span>{{#hasPublicCode}}<span dir="ltr">{{publicCode}}</span>{{/hasPublicCode}}</div>
  </section>

  <section class="doc-page casio-sheet">
    <div class="page-inner">
      <header class="casio-head"><span>CASIO · INTERPRETATION</span><span>خلاصهٔ گزارش</span><b>۰۲</b></header>
      <p class="casio-kicker">خلاصه</p>
      <h2>{{summaryTitleFa}}</h2>
      {{#hasContext}}
      <dl class="casio-context">{{#context}}<div><dt>{{labelFa}}</dt><dd>{{valueFa}}</dd></div>{{/context}}</dl>
      {{/hasContext}}
      {{#hasSummary}}
      <div class="summary-copy">{{#summaryParagraphsFa}}<p>{{.}}</p>{{/summaryParagraphsFa}}</div>
      {{/hasSummary}}
      {{#hasKeywordGraph}}
      <section class="keyword-graph">
        <div class="graph-title-row"><h3>شبکهٔ کلیدواژه‌های گلوگاه</h3><span>{{bottleneckFa}}</span></div>
        <div class="keyword-groups">
          {{#keywordGraphGroups}}
          <div class="keyword-group" style="--accent:{{accentColor}}">
            <div class="keyword-parent"><small>{{id}}</small><strong>{{titleFa}}</strong></div>
            <div class="keyword-children">{{#childrenFa}}<div class="keyword-child"><span class="keyword-dot"></span><span>{{.}}</span></div>{{/childrenFa}}</div>
          </div>
          {{/keywordGraphGroups}}
        </div>
        <div class="keyword-join"><div><span></span></div><div><span></span></div><div><span></span></div></div>
        <div class="current-state-node">
          <h4>{{bottleneckAsIsLabelFa}} · {{bottleneckFa}}</h4>
          <p>{{bottleneckAsIsFa}}</p>
        </div>
        <p class="graph-disclaimer">{{keywordGraphNoteFa}}</p>
      </section>
      {{/hasKeywordGraph}}
      {{^hasKeywordGraph}}<div class="casio-block"><p>برای نمایش شبکهٔ کلیدواژه‌ها، دادهٔ keywordGraphGroups باید در ورودی گزارش موجود باشد.</p></div>{{/hasKeywordGraph}}
      <footer class="foot"><span>{{packNameFa}}</span><span>صفحهٔ ۲</span></footer>
    </div>
  </section>

  {{#layers}}
  <section class="doc-page casio-sheet layer-page">
    <div class="page-inner">
      <header class="casio-head"><span>CASIO · INTERPRETATION</span><span>{{titleFa}}</span><b class="page-num"></b></header>
      {{#isBottleneck}}<p class="casio-gap">گلوگاه</p>{{/isBottleneck}}
      <div class="layer-title">
        <span class="layer-number"></span>
        <h2>{{titleFa}}</h2>
        <div class="layer-score">نمرهٔ لایه<strong>{{scoreFa}} <small>از {{scoreMaxFa}}</small></strong></div>
      </div>
      {{#constructFa}}<p class="layer-construct">{{constructFa}}</p>{{/constructFa}}
      <p class="casio-s">{{scoreFa}} از {{scoreMaxFa}}{{#statusFa}} — {{statusFa}}{{/statusFa}}</p>
      {{#asIsFa}}<div class="casio-block"><p class="casio-k">وضعیت موجود</p><p>{{asIsFa}}</p></div>{{/asIsFa}}
      {{#toBeFa}}<div class="casio-block"><p class="casio-k">وضعیت مطلوب</p><p>{{toBeFa}}</p></div>{{/toBeFa}}
      {{#actionsFa}}<div class="casio-block layer-actions"><p class="casio-k">اقدام پیشنهادی</p><p>{{actionsFa}}</p></div>{{/actionsFa}}
      <footer class="foot"><span>{{packNameFa}}</span><span>لایهٔ {{titleFa}}</span></footer>
    </div>
  </section>
  {{/layers}}

  <section class="doc-page casio-sheet casio-end">
    <div class="page-inner">
      <header class="casio-head"><span>CASIO · INTERPRETATION</span><span>پایان گزارش</span><b>۰۸</b></header>
      {{#hasPatterns}}
      <p class="casio-kicker">خوانش بین‌لایه</p>
      <h2>الگوهای بین‌لایه‌ای</h2>
      <ul class="casio-patterns">{{#patterns}}<li><p>{{meaningFa}}</p><p class="casio-s">{{actionFa}}</p></li>{{/patterns}}</ul>
      {{/hasPatterns}}
      <p class="casio-end-copy">{{closingFa}}</p>
      <div class="casio-foot">
        <span>کاسیو · نسخه {{version}}</span>
        {{#contactFa}}<span class="casio-footer-contact">{{contactFa}}</span>{{/contactFa}}
        {{#hasQr}}<div class="casio-qr">{{{qrSvg}}}</div>{{/hasQr}}
      </div>
    </div>
  </section>
`;
