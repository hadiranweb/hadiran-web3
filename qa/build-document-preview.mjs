import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { SYSTEM_DOCUMENT_TEMPLATES } from '../src/lib/analyzers/document-templates.ts';
import { defaultChrome } from '../src/lib/analyzers/document-template-defaults.ts';
import { renderChromeDocument, sampleInterpretationDocument } from '../src/lib/analyzers/document-chrome.ts';
const outputPath=resolve(process.argv[2]??'qa-artifacts/unified-document-templates-preview.html');
const outputDirectory=dirname(outputPath);
const regular=readFileSync('src/app/fonts/IRANSharp-Regular.woff2').toString('base64');
const bold=readFileSync('src/app/fonts/IRANSharp-Bold.woff2').toString('base64');
const rendered=SYSTEM_DOCUMENT_TEMPLATES.map((t)=>{
 const doc=sampleInterpretationDocument(t.id);doc.packNameFa='گزارش نمونهٔ آزمایشی';doc.personNameFa='پیش‌نمایش · دادهٔ ساختگی';doc.submittedAt='2026-11-01T12:00:00Z';
 const output=renderChromeDocument(defaultChrome(t.id),doc);return{t,doc,output};
});
const css=rendered.map(x=>x.output.css).join('\n');
const html=`<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>پیش‌نمایش قالب‌های سند مشترک</title><style>
@font-face{font-family:IRANSharp;src:url(data:font/woff2;base64,${regular});font-weight:400}@font-face{font-family:IRANSharp;src:url(data:font/woff2;base64,${bold});font-weight:700}
:root{--font-iran-sharp:IRANSharp}*{box-sizing:border-box}body{margin:0;background:#e8ecf0;font-family:IRANSharp,Tahoma,sans-serif;line-height:1.7;color:#172638}button,select{font:inherit}.controls{background:#fff;padding:20px 28px;border-bottom:1px solid #cad3dc;position:relative;z-index:2}.controls h1{font-size:20px;margin:0 0 6px}.controls p{font-size:13px;color:#516476;margin:6px 0}.row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}select,button{padding:8px 14px;border:1px solid #bcc9d4;border-radius:8px;background:#fff}button{background:#172f4b;color:#fff;cursor:pointer}.canvas{overflow:auto;padding:24px}.view{display:none;width:210mm;margin:auto}.view.active{display:block}.doc-root{width:210mm;margin:auto}.demo-label{font-size:12px;color:#516476;margin:0 auto 12px;width:210mm}.notice{color:#805c17!important}
${css}
@media print{@page{size:A4;margin:0}body{background:#fff}.controls,.demo-label{display:none!important}.canvas{overflow:visible;padding:0}.view{display:none!important}.view.active{display:block!important;width:210mm;margin:0}.doc-root{margin:0}}
</style><header class="controls"><h1>یک سند‌ساز، چند قالب</h1><p>نمونهٔ نمایشی با دادهٔ ساختگی؛ آزمون قدیمی Casio فعال نشده و ذخیرهٔ دیتابیس در این نمونه انجام نمی‌شود.</p><div class="row"><label for="template">قالب سند</label><select id="template">${rendered.map(({t})=>`<option value="${t.id}">${t.titleFa}</option>`).join('')}</select><button id="print">چاپ قالب انتخاب‌شده</button></div><p class="notice">برای چاپ/PDF، فایل را دانلود و در مرورگر باز کنید؛ چاپ در پیش‌نمایش داخل چت ممکن است محدود باشد. نام‌ها و نمره‌ها واقعی نیستند.</p></header><main class="canvas"><p class="demo-label">قالب از رجیستری مشترک ← دادهٔ گزارش مشترک ← رندر مشترک؛ بدون مسیر موازی آزمون</p>${rendered.map(({t,output},i)=>`<section class="view${i===0?' active':''}" data-template="${t.id}"><div class="${output.className}" dir="rtl">${output.html}</div></section>`).join('')}</main><script>document.getElementById('template').addEventListener('change',e=>{document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.dataset.template===e.target.value));});document.getElementById('print').addEventListener('click',()=>window.print());</script></html>`;
mkdirSync(outputDirectory,{recursive:true});
writeFileSync(outputPath,html);
writeFileSync(join(outputDirectory,'preview-fixtures.json'),JSON.stringify(rendered.map(({t,doc,output})=>({id:t.id,title:t.titleFa,wrapper:output.className,pages:(output.html.match(/class="doc-page /g)||[]).length,doc})),null,2));
console.log('Preview:',outputPath,Buffer.byteLength(html),'bytes');
