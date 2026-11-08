// Presentation assets adapted from 7c3703a; no legacy assessment/scoring imports.
export const CASIO_MATRIX_TEMPLATE_HTML = `<section class="doc-page casio-cover">
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
          {{#bottleneckScoreFa}}<p class="casio-s">{{bottleneckScoreFa}} از {{bottleneckScoreMaxFa}}</p>{{/bottleneckScoreFa}}
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
      <header class="casio-head"><span>CASIO · INTERPRETATION</span><span>پایان گزارش</span><b>{{closingPageFa}}</b></header>
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

export const CASIO_MATRIX_TEMPLATE_CSS = `.doc-casio, .doc-casio * { box-sizing: border-box; }

.doc-casio { counter-reset: layercounter; margin: 0; padding: 0; direction: rtl; font-family: var(--font-iran-sharp, Tahoma), sans-serif; color: #1f3345; background: #d9dfe3; }
.doc-casio .doc-page { width: 210mm; height: auto; min-height: 297mm; margin: 0 auto 8mm; position: relative; overflow: visible; page-break-after: always; break-after: page; background: #e7ebee; }
.doc-casio .doc-page:last-child { page-break-after: auto; break-after: auto; }
.doc-casio .page-inner { min-height: 297mm; padding: 13mm 15mm 17mm; position: relative; }
.doc-casio .casio-cover { background: #102a43; color: #fff; text-align: center; padding: 11mm 17mm 15mm; }
.doc-casio .casio-brand { text-align: center; color: #d6e1e8; font-size: 8pt; letter-spacing: .3px; }
.doc-casio .casio-logo { width: 29mm; height: 37mm; flex: 0 0 37mm; overflow: hidden; margin: 0 auto 2mm; display: flex; align-items: center; justify-content: center; }
.doc-casio .casio-logo svg { width: 100% !important; height: auto !important; max-width: 100% !important; max-height: 100% !important; display: block; }
.doc-casio .casio-cover h1 { color: #fff; font-size: 24pt; line-height: 1.5; margin: 3mm 0 1mm; }
.doc-casio .casio-lead { color: #cbd7df; font-size: 9pt; margin: 0 0 5mm; }
.doc-casio .casio-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm 7mm; text-align: right; max-width: 160mm; margin: 4mm auto; padding: 3mm 5mm; border-top: 1px solid #ffffff40; border-bottom: 1px solid #ffffff40; }
.doc-casio .casio-meta div { display: grid; grid-template-columns: 23mm 1fr; gap: 2mm; align-items: baseline; min-width: 0; }
.doc-casio .casio-meta dt { color: #aebdca; font-size: 7pt; }
.doc-casio .casio-meta dd { color: #fff; font-size: 9pt; margin: 0; overflow-wrap: anywhere; }
.doc-casio .casio-cover-main { display: grid; grid-template-columns: 1fr 1.15fr; gap: 5mm; align-items: center; margin: 4mm auto 0; max-width: 168mm; }
.doc-casio .cover-chart-wrap { position: relative; width: 83mm; height: 83mm; margin: auto; display: grid; place-items: center; }
.doc-casio .cover-chart-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.doc-casio .cover-chart-total { position: relative; z-index: 1; color: #fff; font: 20pt Arial, sans-serif; }
.doc-casio .cover-chart-total small { display: block; color: #c6d3dc; font: 7pt var(--font-iran-sharp, Tahoma), sans-serif; margin-top: 1mm; }
.doc-casio .casio-cards { display: grid; grid-template-columns: 1fr; gap: 3mm; }
.doc-casio .casio-card { text-align: right; border: 1px solid #ffffff45; border-right: 3px solid #c73843; border-radius: 2mm; padding: 4mm 5mm; background: #183a56; }
.doc-casio .casio-k { color: #aebdca; font-size: 7.5pt; margin: 0 0 1mm; }
.doc-casio .casio-v { color: #fff; font-size: 15pt; line-height: 1.5; margin: 0; }
.doc-casio .casio-s { color: #cbd7df; font-size: 8pt; line-height: 1.6; margin: 1.5mm 0 0; }
.doc-casio .casio-sheet .casio-s { color: #63798a; }
.doc-casio .cover-layer-scores { max-width: 168mm; margin: 3mm auto 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.4mm 5mm; text-align: right; color: #d6e1e8; font-size: 7pt; }
.doc-casio .cover-layer-score { display: flex; justify-content: space-between; gap: 2mm; border-bottom: 1px solid #ffffff20; padding: 1mm 0; }
.doc-casio .cover-layer-score b { font-weight: 400; color: #d9b56d; white-space: nowrap; }
.doc-casio .cover-foot { position: absolute; bottom: 8mm; right: 17mm; left: 17mm; border-top: 1px solid #ffffff55; padding-top: 2mm; display: flex; justify-content: space-between; color: #cbd6dd; font-size: 7pt; }
.doc-casio .casio-sheet .page-inner { padding-top: 13mm; }
.doc-casio .casio-head { height: 10mm; border-bottom: 1.5px solid #176b89; display: flex; justify-content: space-between; align-items: flex-start; color: #a71925; font: 7pt Arial, sans-serif; letter-spacing: .3px; }
.doc-casio .casio-head b { color: #176b89; font: 8pt var(--font-iran-sharp, Tahoma), sans-serif; letter-spacing: 0; }
.doc-casio .casio-kicker { color: #a71925; font-size: 9pt; margin: 5mm 0 1mm; }
.doc-casio .casio-sheet h2 { color: #102a43; font-size: 21pt; line-height: 1.5; margin: 1mm 0 3mm; }
.doc-casio .casio-subtitle { color: #63798a; font-size: 8.5pt; margin: 0 0 3mm; }
.doc-casio .casio-context { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2mm 4mm; background: #f8fafb; border: 1px solid #ccd7df; border-radius: 2mm; padding: 3mm 4mm; margin: 2mm 0 3mm; }
.doc-casio .casio-context div { display: grid; grid-template-columns: 27mm 1fr; gap: 2mm; }
.doc-casio .casio-context dt { color: #63798a; font-size: 7pt; }
.doc-casio .casio-context dd { color: #1f3345; font-size: 7.5pt; margin: 0; }
.doc-casio .summary-copy { background: #f9fbfc; border: 1px solid #cad5dc; border-top: 3px solid #a71925; border-radius: 2mm; padding: 3mm 4mm; margin: 2mm 0 3mm; font-size: 8.7pt; line-height: 1.7; }
.doc-casio .summary-copy p { margin: 0; }
.doc-casio .summary-copy p + p { margin-top: 1.5mm; }
.doc-casio .keyword-graph { background: #fff; border: 1px solid #cbd6df; border-radius: 2mm; padding: 3.5mm; margin: 3mm 0; }
.doc-casio .graph-title-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e1e7eb; padding-bottom: 2mm; margin-bottom: 2.5mm; }
.doc-casio .graph-title-row h3 { color: #102a43; font-size: 9pt; margin: 0; }
.doc-casio .graph-title-row span { color: #a71925; font-size: 7.5pt; }
.doc-casio .keyword-groups { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2.5mm; direction: rtl; align-items: stretch; }
.doc-casio .keyword-group { min-width: 0; border: 1px solid #d5dee4; border-radius: 2mm; padding: 2mm; background: #fbfcfd; }
.doc-casio .keyword-parent { min-height: 14mm; border: 1px solid var(--accent); border-top: 2px solid var(--accent); border-radius: 1.5mm; padding: 1.7mm 2mm; background: #f4f7f9; }
.doc-casio .keyword-parent small { display: block; direction: ltr; text-align: right; color: var(--accent); font: 6pt Arial, sans-serif; }
.doc-casio .keyword-parent strong { display: block; color: #102a43; font-size: 7.3pt; line-height: 1.35; margin-top: .6mm; }
.doc-casio .keyword-children { display: grid; gap: 1.2mm; margin: 2.5mm 0 0; padding: 0 4mm 0 0; border-right: 1px solid var(--accent); }
.doc-casio .keyword-child { position: relative; min-height: 7mm; display: flex; align-items: center; gap: 1.2mm; border: 1px solid #e0e6ea; border-radius: 1.3mm; background: #fff; padding: 1mm 1.2mm; color: #1f3345; font-size: 7pt; line-height: 1.35; }
.doc-casio .keyword-child:before { content: ""; position: absolute; right: -4mm; top: 50%; width: 3.4mm; border-top: 1px solid var(--accent); opacity: .7; }
.doc-casio .keyword-dot { width: 1.3mm; height: 1.3mm; flex: 0 0 1.3mm; border-radius: 50%; background: var(--accent); }
.doc-casio .keyword-join { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.5mm; margin: 0 0 1.5mm; }
.doc-casio .keyword-join span { display: block; height: 4mm; width: 0; margin: auto; border-right: 1px solid #7895aa; }
.doc-casio .current-state-node { position: relative; border: 1.3px solid #176b89; border-right: 4px solid #a71925; border-radius: 2mm; background: #f3f7f9; padding: 2.5mm 3.5mm; }
.doc-casio .current-state-node h4 { color: #176b89; font-size: 8pt; margin: 0 0 1mm; }
.doc-casio .current-state-node p { color: #1f3345; font-size: 7.7pt; line-height: 1.55; margin: 0; }
.doc-casio .graph-disclaimer { color: #63798a; border-top: 1px solid #e6ebef; padding-top: 1.5mm; margin: 1.8mm 0 0; font-size: 6.7pt; line-height: 1.45; }
.doc-casio .casio-table { width: 100%; border-collapse: collapse; margin: 3mm 0; background: #fff; border: 1px solid #cbd6df; font-size: 8pt; }
.doc-casio .casio-table th { background: #102a43; color: #fff; text-align: right; padding: 2.3mm 3mm; font-size: 7.5pt; }
.doc-casio .casio-table td { border-bottom: 1px solid #e0e6ea; padding: 2.2mm 3mm; vertical-align: middle; }
.doc-casio .casio-table tr:nth-child(even) td { background: #f8fafb; }
.doc-casio .casio-gap { display: inline-block; color: #a71925; border: 1px solid #e2b8bc; background: #fbf0f1; border-radius: 10mm; font-size: 6.5pt; padding: .5mm 2mm; white-space: nowrap; }
.doc-casio .casio-patterns { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; list-style: none; margin: 3mm 0; padding: 0; }
.doc-casio .casio-patterns li { border: 1px solid #cbd6df; border-right: 3px solid #c99b53; border-radius: 2mm; padding: 3mm 4mm; background: #fff; break-inside: avoid; }
.doc-casio .casio-patterns li p { font-size: 8pt; line-height: 1.6; margin: 0; }
.doc-casio .casio-patterns li .casio-s { font-size: 7pt; color: #63798a; margin-top: 1.5mm; }
.doc-casio .layer-title { display: flex; align-items: center; gap: 3mm; background: #fff; border: 1px solid #cbd6df; border-right: 4px solid #a71925; padding: 3.5mm 4mm; border-radius: 2mm; margin: 4mm 0; }
.doc-casio .layer-title h2 { color: #102a43; font-size: 18pt; margin: 0; }
.doc-casio .layer-number { display: none; }
.doc-casio .layer-score { margin-right: auto; text-align: left; color: #63798a; font-size: 7pt; }
.doc-casio .layer-score strong { display: block; color: #176b89; font: bold 15pt Arial, sans-serif; }
.doc-casio .layer-construct { color: #63798a; font-size: 9pt; line-height: 1.7; margin: 2mm 0 3mm; }
.doc-casio .casio-block { border: 1px solid #d1d9df; border-radius: 2mm; padding: 4mm; margin: 3mm 0; background: #f2f5f7; }
.doc-casio .casio-block .casio-k { color: #176b89; font-size: 7pt; margin: 0 0 1.5mm; }
.doc-casio .casio-block p:last-child { color: #1f3345; font-size: 9pt; line-height: 1.75; margin: 0; }
.doc-casio .layer-actions { border-right: 3px solid #176b89; background: #f8fafb; }
.doc-casio .casio-end { background: #102a43; color: #fff; }
.doc-casio .casio-end .page-inner { padding-top: 14mm; }
.doc-casio .casio-end .casio-head { border-color: #5f94a6; color: #d6e0e6; }
.doc-casio .casio-end .casio-head b { color: #d6e0e6; }
.doc-casio .casio-end h2 { color: #fff; }
.doc-casio .casio-end-copy { text-align: center; font-size: 20pt; line-height: 1.8; max-width: 160mm; margin: 10mm auto; color: #fff; }
.doc-casio .casio-foot { position: absolute; bottom: 10mm; left: 17mm; right: 17mm; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #ffffff45; padding-top: 4mm; color: #d6e1e8; font-size: 8pt; }
.doc-casio .casio-foot p { margin: 0; }
.doc-casio .casio-footer-contact { color: #d2ae70; font-size: 8pt; }
.doc-casio .casio-qr { width: 16mm; height: 16mm; padding: 1mm; background: #fff; border-radius: 1mm; }
.doc-casio .casio-qr svg { width: 100%; height: 100%; display: block; }
.doc-casio .casio-end .casio-s { color: #d6e1e8; }
.doc-casio .page-number { position: absolute; top: 13mm; left: 15mm; color: #a71925; font-size: 7pt; }
.doc-casio .foot { position: absolute; bottom: 8mm; right: 15mm; left: 15mm; border-top: 1px solid #84a0ae; padding-top: 2mm; color: #a71925; font-size: 7pt; display: flex; justify-content: space-between; }
.doc-casio .layer-page { counter-increment: layercounter; }
.doc-casio .layer-number:before { content: counter(layercounter); }
.doc-casio .layer-page .page-num:before { content: counter(layercounter); }
.doc-casio .cover-chart-svg svg { width: 100%; height: 100%; display: block; }
@media print {
  .doc-casio { background: #fff; }
  .doc-casio .doc-page { margin: 0; box-shadow: none; }
  .doc-casio, .doc-casio .doc-page, .doc-casio .casio-cover, .doc-casio .casio-end, .doc-casio .casio-card, .doc-casio .casio-head {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
`;

export const CASIO_RESEARCH_TEMPLATE_CSS = `
.doc-casio-research {
  --navy: #0E2841;
  --research-blue: #156082;
  --document-white: #E7EAEC;
  --deep-maroon: #7F0000;
  --cream: #F6F2E9;
  --muted: #5A6C7D;
  --soft: #F5F7F8;
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
  font-family: var(--font-iran-sharp, Tahoma), sans-serif;
  color: var(--navy);
  background: var(--document-white);
}
.doc-casio-research .casio-page {
  position: relative;
  background: #fff;
  min-height: 297mm;
  padding: 12pt 44pt 88pt;
  box-sizing: border-box;
  overflow: hidden;
}
.doc-casio-research .casio-cover {
  background: var(--navy);
  color: var(--cream);
  padding: 0 49pt 88pt;
  min-height: 297mm;
}
.doc-casio-research .casio-cover-logo {
  position: absolute;
  top: 63pt;
  right: 49pt;
  width: 85pt;
}
.doc-casio-research .casio-cover-tag {
  position: absolute;
  top: 74pt;
  left: 49pt;
  font-size: 8.2pt;
  font-weight: 600;
  letter-spacing: 2.6pt;
  color: var(--cover-text-muted);
}
.doc-casio-research .casio-cover-title-block { padding-top: 220pt; text-align: right; }
.doc-casio-research .casio-cover-eyebrow { font-size: 11pt; color: var(--cover-text-muted); }
.doc-casio-research .casio-cover-title {
  margin: 8pt 0 0;
  font-size: 30pt;
  font-weight: 700;
  line-height: 1.4;
  color: var(--cream);
  max-width: 280pt;
  margin-inline-start: auto;
}
.doc-casio-research .casio-cover-subtitle {
  margin-top: 16pt;
  font-size: 13pt;
  color: var(--cover-subtitle);
  line-height: 1.5;
}
.doc-casio-research .casio-cover-rule {
  margin-top: 18pt;
  margin-inline-start: auto;
  width: 127pt;
  height: 2pt;
  background: var(--research-blue);
}
.doc-casio-research .casio-cover-cards { display: flex; gap: 10pt; margin-top: 20pt; }
.doc-casio-research .casio-cover-card {
  flex: 1;
  background: var(--cover-card-bg);
  border: 0.9pt solid rgba(246,242,233,0.28);
  border-radius: 8pt;
  padding: 15pt 17pt;
  min-height: 120pt;
}
.doc-casio-research .casio-cover-card-label { font-size: 10pt; color: var(--cover-text-muted); }
.doc-casio-research .casio-cover-card-value {
  margin-top: 10pt;
  font-size: 20pt;
  font-weight: 700;
  color: var(--cream);
  line-height: 1.35;
}
.doc-casio-research .casio-cover-card-score { margin-top: 6pt; }
.doc-casio-research .casio-cover-score-number { font-size: 28pt; font-weight: 700; color: var(--cream); }
.doc-casio-research .casio-cover-score-of { font-size: 11.5pt; color: var(--cover-text-muted); margin-inline-start: 4pt; }
.doc-casio-research .casio-cover-card-note { margin-top: 8pt; font-size: 10.5pt; color: var(--cover-text-muted); }
.doc-casio-research .casio-cover-footer { position: absolute; right: 49pt; left: 49pt; bottom: 80pt; }
.doc-casio-research .casio-cover-footer-rule { height: 1pt; background: rgba(246,242,233,0.32); }
.doc-casio-research .casio-cover-footer-row {
  margin-top: 13pt;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.doc-casio-research .casio-cover-footer-text { font-size: 8.8pt; color: var(--cover-text-muted); }
.doc-casio-research .casio-cover-badge {
  background: var(--deep-maroon);
  color: var(--cream);
  font-size: 7.6pt;
  font-weight: 600;
  letter-spacing: 1.1pt;
  padding: 6pt 11pt;
  border-radius: 3pt;
}
.doc-casio-research .casio-runhead { display: flex; justify-content: space-between; align-items: baseline; }
.doc-casio-research .casio-runhead-profile {
  font-size: 7.8pt;
  font-weight: 600;
  letter-spacing: 1.4pt;
  color: var(--deep-maroon);
}
.doc-casio-research .casio-runhead-title { font-size: 8.8pt; color: var(--navy); }
.doc-casio-research .casio-head-kicker { margin-top: 16pt; font-size: 9pt; color: var(--deep-maroon); }
.doc-casio-research .casio-head-title { margin: 4pt 0 0; font-size: 22pt; font-weight: 700; color: var(--navy); }
.doc-casio-research .casio-head-subtitle { margin-top: 5pt; font-size: 10.5pt; color: var(--muted); }
.doc-casio-research .casio-head-hairline { margin-top: 11pt; height: 1pt; background: var(--research-blue); }
.doc-casio-research .casio-pagehead-rule { margin-top: 9pt; height: 2pt; display: flex; justify-content: space-between; }
.doc-casio-research .casio-pagehead-rule::before,
.doc-casio-research .casio-pagehead-rule::after { content: ""; width: 47.5%; }
.doc-casio-research .casio-pagehead-rule::before { background: var(--deep-maroon); }
.doc-casio-research .casio-pagehead-rule::after { background: var(--research-blue); }
.doc-casio-research .casio-summary-cards { display: flex; gap: 10pt; margin-top: 12pt; }
.doc-casio-research .casio-card {
  flex: 1;
  background: var(--card-bg);
  border: 0.9pt solid var(--card-border);
  border-radius: 8pt;
  padding: 13pt 16pt;
}
.doc-casio-research .casio-card-label { font-size: 10pt; color: var(--muted); }
.doc-casio-research .casio-card-score-number { font-size: 24pt; font-weight: 700; }
.doc-casio-research .casio-card-score-of { font-size: 11pt; color: var(--muted); margin-inline-start: 4pt; }
.doc-casio-research .casio-card-value { margin-top: 4pt; font-size: 18pt; font-weight: 700; }
.doc-casio-research .casio-card-note { margin-top: 3pt; font-size: 10.5pt; color: var(--muted); }
.doc-casio-research .casio-radar { margin: 14pt auto 4pt; text-align: center; }
.doc-casio-research .casio-radar svg { display: block; margin: auto; max-width: 100%; width: auto; height: auto; max-height: 66mm; }
.doc-casio-research .casio-radar figcaption { margin-top: 4pt; font-size: 9pt; color: var(--muted); }
.doc-casio-research .casio-radar-scale { margin-inline-start: 6pt; }
.doc-casio-research .casio-context {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8pt 16pt;
  margin-top: 12pt;
  font-size: 10.5pt;
}
.doc-casio-research .casio-context dt { color: var(--muted); }
.doc-casio-research .casio-table-title { margin: 14pt 0 6pt; font-size: 13pt; font-weight: 700; }
.doc-casio-research .casio-summary-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.doc-casio-research .casio-summary-table thead th {
  background: var(--navy);
  color: var(--cream);
  font-size: 9pt;
  font-weight: 600;
  padding: 6.5pt 10pt;
  text-align: right;
}
.doc-casio-research .casio-summary-table tbody tr:nth-child(even) td { background: var(--row-alt); }
.doc-casio-research .casio-summary-table tbody td {
  border-bottom: 0.9pt solid var(--card-border);
  padding: 6pt 9pt;
  font-size: 10.5pt;
  vertical-align: middle;
}
.doc-casio-research .casio-cell-layer { font-weight: 600; }
.doc-casio-research .casio-gap-mark { margin-inline-start: 6pt; font-size: 8pt; color: var(--deep-maroon); font-weight: 400; }
.doc-casio-research .casio-cell-score, .doc-casio-research .casio-cell-status { text-align: center; }
.doc-casio-research .casio-score-line { text-align: center; }
.doc-casio-research .casio-bar { margin-top: 4pt; height: 3.4pt; background: var(--bar-track); border-radius: 2pt; overflow: hidden; }
.doc-casio-research .casio-bar-fill { height: 3.4pt; background: var(--navy); }
.doc-casio-research .casio-pill {
  display: inline-block;
  padding: 2.4pt 6.5pt;
  border-radius: 7pt;
  font-size: 8.4pt;
}
.doc-casio-research .casio-pill-weak { background: var(--weak-bg); color: var(--weak-text); }
.doc-casio-research .casio-pill-grow { background: var(--grow-bg); color: var(--grow-text); }
.doc-casio-research .casio-note {
  margin-top: 12pt;
  background: var(--row-alt);
  border-inline-start: 3pt solid var(--deep-maroon);
  border-radius: 3pt;
  padding: 10pt 12pt;
  font-size: 9.6pt;
  color: var(--grow-text);
  line-height: 1.65;
}
.doc-casio-research .casio-layer-card {
  margin-top: 12pt;
  background: var(--card-bg);
  border: 0.9pt solid var(--card-border);
  border-radius: 8pt;
  padding: 12pt 15pt;
}
.doc-casio-research .casio-layer-head { display: flex; align-items: center; }
.doc-casio-research .casio-layer-badge {
  width: 24pt;
  height: 24pt;
  border-radius: 50%;
  color: var(--cream);
  font-size: 11.5pt;
  font-weight: 700;
  text-align: center;
  line-height: 24pt;
  margin-inline-end: 10pt;
  flex: none;
}
.doc-casio-research .casio-badge-weak { background: var(--deep-maroon); }
.doc-casio-research .casio-badge-grow { background: var(--navy); }
.doc-casio-research .casio-layer-name { font-size: 16pt; font-weight: 700; }
.doc-casio-research .casio-layer-score { font-size: 9.6pt; color: var(--muted); }
.doc-casio-research .casio-construct { margin-top: 8pt; font-size: 10pt; color: var(--muted); line-height: 1.6; }
.doc-casio-research .casio-asistobe { display: flex; gap: 8pt; margin-top: 10pt; }
.doc-casio-research .casio-asistobe-box {
  flex: 1;
  background: var(--box);
  border-radius: 6pt;
  padding: 8pt 11pt;
}
.doc-casio-research .casio-asistobe-label { font-size: 8.8pt; font-weight: 600; }
.doc-casio-research .casio-asistobe-text { margin-top: 3pt; font-size: 9.8pt; color: var(--grow-text); line-height: 1.5; }
.doc-casio-research .casio-actions-label { margin: 10pt 0 3pt; font-size: 9.4pt; color: var(--muted); }
.doc-casio-research .casio-action {
  display: flex;
  align-items: center;
  border: 0.9pt solid #E4E9ED;
  border-radius: 6pt;
  padding: 6pt 10pt;
  margin-top: 5pt;
}
.doc-casio-research .casio-action-title { font-size: 11pt; line-height: 1.4; }
.doc-casio-research .casio-action-badge {
  flex: none;
  width: 14.5pt;
  height: 14.5pt;
  border-radius: 50%;
  background: var(--navy);
  color: var(--cream);
  font-size: 8.4pt;
  text-align: center;
  line-height: 14.5pt;
  margin-inline-start: 10pt;
}
.doc-casio-research .casio-no-actions {
  border: 1pt dashed #C8D2DA;
  border-radius: 6pt;
  padding: 8pt;
  text-align: center;
  font-size: 9.4pt;
  color: var(--muted);
}
.doc-casio-research .casio-score-strip {
  margin-top: 10pt;
  background: var(--navy);
  border-radius: 4pt;
  padding: 6pt 12pt;
  display: flex;
  justify-content: space-between;
  color: var(--cream);
}
.doc-casio-research .casio-score-strip-value { font-weight: 700; }
.doc-casio-research .casio-page-footer {
  position: absolute;
  left: 44pt;
  right: 44pt;
  bottom: 56pt;
}
.doc-casio-research .casio-footer-rule { height: 1pt; background: var(--hairline); }
.doc-casio-research .casio-footer-row {
  margin-top: 8pt;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.doc-casio-research .casio-footer-profile {
  font-size: 7.4pt;
  font-weight: 600;
  letter-spacing: 0.6pt;
  color: var(--deep-maroon);
  text-align: center;
  line-height: 1.4;
}
.doc-casio-research .casio-footer-seal { width: 14pt; }
.doc-casio-research .casio-footer-page { font-size: 8.8pt; color: var(--muted); }
.doc-casio-research .casio-muted { color: var(--muted); font-size: 10pt; margin-top: 8pt; }
.doc-casio-research .casio-patterns { margin-top: 16pt; padding: 0; list-style: none; }
.doc-casio-research .casio-patterns li { margin-bottom: 14pt; font-size: 11pt; line-height: 1.7; }
.doc-casio-research .casio-closing { margin-top: 18pt; font-size: 12pt; line-height: 1.8; }
.doc-casio-research .casio-score-list { margin-top: 12pt; font-size: 11pt; }
@media print {
  .doc-casio-research, .doc-casio-research .casio-page, .doc-casio-research .casio-cover, .doc-casio-research .casio-bar-fill,
  .doc-casio-research .casio-score-strip, .doc-casio-research .casio-cover-card, .doc-casio-research .casio-pill {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .doc-casio-research .casio-page { min-height: 297mm; }
}

.doc-casio-research { counter-reset: research-page; direction: rtl; }
.doc-casio-research .doc-page { counter-increment: research-page; break-after: page; }
.doc-casio-research .doc-page:last-child { break-after: auto; }
.doc-casio-research .research-page-number::before { content: counter(research-page); }
.doc-casio-research .research-logo svg, .doc-casio-research .research-seal svg { width:100%; height:auto; }
.doc-casio-research .casio-cover-logo { display:block; }
.doc-casio-research .casio-page { overflow:visible; }
`;

export const CASIO_RESEARCH_TEMPLATE_HTML = `<section class="doc-page casio-page casio-cover">
<div class="casio-cover-logo research-logo">{{{logos.light}}}</div><div class="casio-cover-tag">PROFILE 02 · RESEARCH</div>
<div class="casio-cover-title-block"><div class="casio-cover-eyebrow">{{personNameFa}}</div><h1 class="casio-cover-title">{{packNameFa}}</h1>{{#hasBusiness}}<div class="casio-cover-subtitle">{{businessNameFa}}</div>{{/hasBusiness}}<div class="casio-cover-rule"></div></div>
<div class="casio-cover-cards">{{#hasBottleneck}}<div class="casio-cover-card"><div class="casio-cover-card-label">گلوگاه</div><div class="casio-cover-card-value">{{bottleneckFa}}</div>{{#bottleneckScoreFa}}<div class="casio-cover-card-note">{{bottleneckScoreFa}} از {{bottleneckScoreMaxFa}}</div>{{/bottleneckScoreFa}}</div>{{/hasBottleneck}}
{{#hasTotal}}<div class="casio-cover-card"><div class="casio-cover-card-label">نمرهٔ کل</div><div class="casio-cover-card-score"><span class="casio-cover-score-number">{{totalFa}}</span><span class="casio-cover-score-of">از {{totalMaxFa}}</span></div><div class="casio-cover-card-note">{{maturityFa}}</div></div>{{/hasTotal}}</div>
<div class="casio-cover-footer"><div class="casio-cover-footer-rule"></div><div class="casio-cover-footer-row"><div class="casio-cover-badge">PROFILE 02 · RESEARCH</div><div class="casio-cover-footer-text">گزارش پاسخ‌ها و تفسیرها · {{submittedFa}}</div></div></div>
</section>
{{#researchSummaryPages}}<section class="doc-page casio-page"><div class="casio-pagehead"><div class="casio-runhead"><div class="casio-runhead-profile">PROFILE 02 · RESEARCH</div><div class="casio-runhead-title">گزارش تفسیر · قالب پژوهش</div></div><div class="casio-head-kicker">خلاصهٔ مدیریتی{{^first}} · ادامه{{/first}}</div><h1 class="casio-head-title">{{summaryTitleFa}}</h1><div class="casio-head-subtitle">{{personNameFa}}</div><div class="casio-head-hairline"></div></div><div class="casio-pagehead-rule"></div>
{{#first}}{{#hasRadar}}<div class="casio-radar">{{{radarSvg}}}</div>{{/hasRadar}}
{{#hasContext}}<dl class="casio-context">{{#context}}<div><dt>{{labelFa}}</dt><dd>{{valueFa}}</dd></div>{{/context}}</dl>{{/hasContext}}{{/first}}
{{#hasLayers}}<div class="casio-table-title">جدول خلاصه</div><table class="casio-summary-table"><thead><tr><th>لایه</th><th>نمره / سقف</th><th>وضعیت</th></tr></thead><tbody>{{#summaryLayers}}<tr><td>{{titleFa}}{{#isBottleneck}} <span class="casio-gap-mark">گلوگاه</span>{{/isBottleneck}}</td><td><div class="casio-score-line">{{scoreFa}} / {{scoreMaxFa}}</div><div class="casio-bar"><div class="casio-bar-fill" style="width:{{ratio}}%"></div></div></td><td>{{statusFa}}</td></tr>{{/summaryLayers}}</tbody></table>{{/hasLayers}}
{{^hasLayers}}<ul class="casio-score-list">{{#scores}}<li>{{titleFa}}: {{valueFa}}</li>{{/scores}}</ul>{{/hasLayers}}
<div class="casio-note">این سند تفسیر پاسخ‌های ثبت‌شده است؛ متن سؤال‌ها را نمایش نمی‌دهد.</div><div class="casio-page-footer"><div class="casio-footer-rule"></div><div class="casio-footer-row"><div class="casio-footer-profile">PROFILE 02 · RESEARCH</div><div class="casio-footer-seal research-seal">{{{logos.seal}}}</div><div class="casio-footer-page">صفحهٔ <span class="research-page-number"></span> از {{totalPagesFa}} · {{packNameFa}}</div></div></div></section>
{{/researchSummaryPages}}
{{#hasPatterns}}<section class="doc-page casio-page"><div class="casio-pagehead"><div class="casio-runhead"><div class="casio-runhead-profile">PROFILE 02 · RESEARCH</div><div class="casio-runhead-title">گزارش تفسیر · قالب پژوهش</div></div><div class="casio-head-kicker">خوانش بین‌لایه</div><h1 class="casio-head-title">الگوهای مشترک</h1><div class="casio-head-hairline"></div></div><div class="casio-pagehead-rule"></div><ul class="casio-patterns">{{#patterns}}<li><p>{{meaningFa}}</p><p class="casio-muted">{{actionFa}}</p></li>{{/patterns}}</ul><div class="casio-page-footer"><div class="casio-footer-rule"></div><div class="casio-footer-row"><div class="casio-footer-profile">PROFILE 02 · RESEARCH</div><div class="casio-footer-seal research-seal">{{{logos.seal}}}</div><div class="casio-footer-page">صفحهٔ <span class="research-page-number"></span> از {{totalPagesFa}} · {{packNameFa}}</div></div></div></section>{{/hasPatterns}}
{{#layers}}<section class="doc-page casio-page"><div class="casio-pagehead"><div class="casio-runhead"><div class="casio-runhead-profile">PROFILE 02 · RESEARCH</div><div class="casio-runhead-title">گزارش تفسیر · قالب پژوهش</div></div><div class="casio-head-kicker">تفسیر لایه‌ها</div><h1 class="casio-head-title">{{titleFa}}</h1><div class="casio-head-hairline"></div></div><div class="casio-pagehead-rule"></div>
<div class="casio-layer-card"><div class="casio-layer-head"><div class="casio-layer-badge">{{indexFa}}</div><div><div class="casio-layer-name">{{titleFa}}</div><div class="casio-layer-score">{{scoreFa}} از {{scoreMaxFa}}{{#statusFa}} · {{statusFa}}{{/statusFa}}{{#isBottleneck}} · گلوگاه{{/isBottleneck}}</div></div></div>
{{#constructFa}}<p class="casio-construct">{{constructFa}}</p>{{/constructFa}}<div class="casio-asistobe">{{#asIsFa}}<div class="casio-asistobe-box"><div class="casio-asistobe-label">وضعیت موجود · As-Is</div><div class="casio-asistobe-text">{{asIsFa}}</div></div>{{/asIsFa}}{{#toBeFa}}<div class="casio-asistobe-box"><div class="casio-asistobe-label">وضعیت مطلوب · To-Be</div><div class="casio-asistobe-text">{{toBeFa}}</div></div>{{/toBeFa}}</div>
<div class="casio-actions-label">اقدامات پیشنهادی</div>{{#actions}}<div class="casio-action"><div class="casio-action-text"><div class="casio-action-title">{{title}}</div></div><div class="casio-action-badge">{{indexFa}}</div></div>{{/actions}}{{^actions}}<div class="casio-no-actions">اقدام ثبت‌شده‌ای وجود ندارد.</div>{{/actions}}
<div class="casio-score-strip"><div class="casio-score-strip-label">نمرهٔ این لایه</div><div class="casio-score-strip-value">{{scoreFa}} از {{scoreMaxFa}}</div></div></div><div class="casio-page-footer"><div class="casio-footer-rule"></div><div class="casio-footer-row"><div class="casio-footer-profile">PROFILE 02 · RESEARCH</div><div class="casio-footer-seal research-seal">{{{logos.seal}}}</div><div class="casio-footer-page">صفحهٔ <span class="research-page-number"></span> از {{totalPagesFa}} · {{packNameFa}}</div></div></div></section>{{/layers}}
<section class="doc-page casio-page"><div class="casio-pagehead"><div class="casio-runhead"><div class="casio-runhead-profile">PROFILE 02 · RESEARCH</div><div class="casio-runhead-title">گزارش تفسیر · قالب پژوهش</div></div><div class="casio-head-kicker">پایان گزارش</div><h1 class="casio-head-title">یادداشت</h1><div class="casio-head-hairline"></div></div><div class="casio-pagehead-rule"></div><p class="casio-closing">{{closingFa}}</p>{{#hasPublicCode}}<p class="casio-muted" dir="ltr">{{publicCode}}</p>{{/hasPublicCode}}<p class="casio-muted">نسخه {{version}}</p><div class="casio-page-footer"><div class="casio-footer-rule"></div><div class="casio-footer-row"><div class="casio-footer-profile">PROFILE 02 · RESEARCH</div><div class="casio-footer-seal research-seal">{{{logos.seal}}}</div><div class="casio-footer-page">صفحهٔ <span class="research-page-number"></span> از {{totalPagesFa}} · {{packNameFa}}</div></div></div></section>`;
