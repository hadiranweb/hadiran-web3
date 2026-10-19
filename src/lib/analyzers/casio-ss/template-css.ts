export const CASIO_TEMPLATE_CSS = `@font-face {
  font-family: Abar;
  src: url("/casio-ss/fonts/AbarLow-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
.doc-casio, .doc-casio * { box-sizing: border-box; }

.doc-casio { counter-reset: layercounter; margin: 0; padding: 0; direction: rtl; font-family: Abar, Tahoma, sans-serif; color: #1f3345; background: #d9dfe3; }
.doc-casio .doc-page { width: 210mm; height: 297mm; min-height: 297mm; margin: 0 auto 8mm; position: relative; overflow: hidden; page-break-after: always; break-after: page; background: #e7ebee; }
.doc-casio .doc-page:last-child { page-break-after: auto; break-after: auto; }
.doc-casio .page-inner { height: 297mm; padding: 13mm 15mm 17mm; position: relative; }
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
.doc-casio .cover-chart-total small { display: block; color: #c6d3dc; font: 7pt Abar, Tahoma, sans-serif; margin-top: 1mm; }
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
.doc-casio .casio-head b { color: #176b89; font: 8pt Abar, Tahoma, sans-serif; letter-spacing: 0; }
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
