import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { SYSTEM_DOCUMENT_TEMPLATES, templatesForPack, resolveDocumentTemplateId, templateAllowedForPack, attemptKindOf } from '../src/lib/analyzers/document-templates.ts';
import { defaultChrome, mergeChrome } from '../src/lib/analyzers/document-template-defaults.ts';
import { renderChromeDocument, sampleInterpretationDocument, documentTemplateContext } from '../src/lib/analyzers/document-chrome.ts';
import { codePacks } from '../src/lib/analyzers/registry.ts';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const ts = createRequire(import.meta.url)('typescript');
const layered = {slug:'custom-layered', findings:[{id:'L1',kind:'layer'}]};
const flat = {slug:'custom-flat',findings:[{id:'D1',kind:'dimension'}]};

test('all template designs are registered independently; no retired assessment is resurrected', () => {
  assert.deepEqual(SYSTEM_DOCUMENT_TEMPLATES.map(t=>t.id),['hadiran','casio-ss','casio-research','system-diagnosis']);
  assert.deepEqual(codePacks().map(p=>p.slug),['mindset-gate','system-diagnosis']);
  for (const slug of ['custom-layered','casio-ss','casio-research']) assert.equal(attemptKindOf(slug),'analyzer');
  assert.equal(existsSync('src/lib/analyzers/casio-ss'),false);
  assert.equal(existsSync('src/app/analyzers/casio-ss'),false);
  assert.equal(existsSync('src/app/api/analyzers/casio-ss'),false);
});

test('compatibility is capability-based, not the legacy assessment slug', () => {
  assert.deepEqual(templatesForPack(layered).map(t=>t.id),['hadiran','casio-ss','casio-research']);
  assert.deepEqual(templatesForPack(flat).map(t=>t.id),['hadiran']);
  assert.equal(templateAllowedForPack(flat,'casio-ss'),false);
  assert.equal(templateAllowedForPack(layered,'unknown'),false);
  assert.equal(templateAllowedForPack(layered,'constructor'),false);
  assert.equal(resolveDocumentTemplateId({...layered,report:{documentTemplateId:'casio-research'}}),'casio-research');
  assert.equal(resolveDocumentTemplateId(layered,'casio-ss'),'casio-ss');
  assert.equal(resolveDocumentTemplateId(flat,'casio-research'),'hadiran');
  const diagnosis = codePacks().find(p=>p.slug==='system-diagnosis');
  assert.equal(resolveDocumentTemplateId(diagnosis),'system-diagnosis');
});

for (const template of SYSTEM_DOCUMENT_TEMPLATES) test(`shared renderer, assets and no leftover template tokens: ${template.id}`, () => {
  const doc=sampleInterpretationDocument(template.id);const copy=JSON.stringify(doc);
  const chrome=defaultChrome(template.id);const output=renderChromeDocument(chrome,doc);
  assert.ok(chrome.logos.light.includes('<svg'));
  assert.ok(chrome.logos.dark.includes('<svg'));
  assert.ok(chrome.logos.seal.includes('<svg'));
  assert.ok(output.html.includes(doc.personNameFa));
  assert.ok(!output.html.includes('{{'));
  assert.ok(output.className.includes(`doc-${template.layoutKey}`));
  assert.ok(!output.css.includes('/casio-ss/'));
  assert.ok(!output.css.includes('Abar'));
  assert.ok(!output.html.includes('/casio-ss/'));
  assert.equal(JSON.stringify(doc),copy,'rendering must not mutate report/scoring data');
});

test('matrix and research really have different markup and visual systems', () => {
  const a=defaultChrome('casio-ss');const b=defaultChrome('casio-research');
  assert.notEqual(a.html,b.html);assert.notEqual(a.css,b.css);
  assert.ok(b.html.includes('PROFILE 02'));assert.ok(a.html.includes('overallChartSvg'));
});

test('layer counts, maxima and research page totals are data-driven', () => {
  for (const count of [1,3,5,7,12]) {
    const doc=sampleInterpretationDocument('casio-research');
    doc.layers=Array.from({length:count},(_,i)=>({...doc.layers[0],id:`layer-${i}`,titleFa:`لایه ${i}`,scoreMax:50,scoreMaxFa:'۵۰',isBottleneck:i===0}));
    doc.patterns=[];const chrome=defaultChrome(doc.templateId);let ctx=documentTemplateContext(doc,chrome);
    assert.equal(ctx.totalPagesFa,String(count+Math.ceil(count/5)+2).replace(/\d/g,n=>'۰۱۲۳۴۵۶۷۸۹'[+n]));
    assert.equal(ctx.bottleneckScoreMaxFa,'۵۰');
    assert.deepEqual(ctx.researchSummaryPages.flatMap(p=>p.summaryLayers.map(l=>l.id)),doc.layers.map(l=>l.id));
    assert.ok(ctx.researchSummaryPages.every(p=>p.summaryLayers.length<=5));
    const rendered=renderChromeDocument(chrome,doc);
    assert.equal((rendered.html.match(/class="doc-page /g)||[]).length,count+Math.ceil(count/5)+2);
    assert.ok(rendered.html.includes('۵۰'));
    doc.patterns=[{meaningFa:'نمونه',actionFa:'اقدام'}];ctx=documentTemplateContext(doc,chrome);
    assert.equal(ctx.totalPagesFa,String(count+Math.ceil(count/5)+3).replace(/\d/g,n=>'۰۱۲۳۴۵۶۷۸۹'[+n]));
  }
});

test('report text remains escaped and unsafe HTML is not executable', () => {
  for (const id of ['hadiran','casio-ss','casio-research']) {
    const doc=sampleInterpretationDocument(id);doc.personNameFa='<script>alert(1)</script>';
    const rendered=renderChromeDocument(defaultChrome(id),doc);
    assert.ok(!rendered.html.includes('<script>'));
    assert.ok(rendered.html.includes('&lt;script&gt;'));
  }
});

test('current report chrome snapshot remains preferred over changed defaults', () => {
  const snapshot=mergeChrome('casio-research',{html:'<section>قالب محفوظ {{personNameFa}}</section>',css:'.saved{color:red}'});
  const doc=sampleInterpretationDocument('casio-research');doc.chromeSnapshot=snapshot;
  assert.ok(renderChromeDocument(mergeChrome(doc.templateId,doc.chromeSnapshot),doc).html.startsWith('<section>قالب محفوظ'));
});

function storeHarness(rows=[],overrides=[]) {
  let n=0;const inserts=[];const tables={analyzerDocumentTemplates:{id:'id'},analyzerDocumentTemplateOverrides:{accountId:'accountId',templateId:'templateId'}};
  const db={select(){const result=n++===0?rows:overrides;const chain={from(){return chain},where(){return chain},orderBy(){return Promise.resolve(result)},then(a,b){return Promise.resolve(result).then(a,b)}};return chain},insert(table){return{values(value){return{async onConflictDoNothing(){inserts.push({table,value})}}}}}};
  const module={exports:{}};
  const deps={'drizzle-orm':{and(){},asc(){},eq(){}},'@/db':{db},'@/db/schema':tables,'./document-template-defaults':{defaultChrome,mergeChrome},'./document-templates':{SYSTEM_DOCUMENT_TEMPLATES,canonicalizeTemplateId:v=>v,documentTemplateDefinition:v=>SYSTEM_DOCUMENT_TEMPLATES.find(t=>t.id===v)},'@/lib/auth/schema-guard':{async ensureInterpretationDocumentsSchema(){}}};
  const source=ts.transpileModule(readFileSync('src/lib/analyzers/document-templates-store.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(source,{module,exports:module.exports,require(id){assert.ok(Object.hasOwn(deps,id),`unapproved dependency: ${id}`);return deps[id]}});
  return {store:module.exports,inserts};
}

test('catalog lists all defaults without materializing template records', async () => {
  const h=storeHarness();const list=await h.store.listDocumentTemplates(42);
  assert.equal(list.length,4);assert.equal(h.inserts.length,0);
});

test('existing base and account override content are not overwritten by code defaults', async () => {
  const row={id:'casio-research',titleFa:'قالب شخصی',layoutKey:'casio-research',brandNameFa:'کاسیو',system:true,chrome:{html:'<p>BASE</p>',css:'p{color:red}'}};
  const h=storeHarness([row],[{templateId:row.id,chrome:{html:'<p>PRIVATE</p>'}}]);
  const list=await h.store.listDocumentTemplates(42);const found=list.find(x=>x.id===row.id);
  assert.equal(found.chrome.html,'<p>PRIVATE</p>');assert.equal(found.chrome.css,'p{color:red}');assert.equal(found.source,'override');assert.equal(h.inserts.length,0);
});

test('explicit materialization requests conflict-safe template metadata only', async () => {
  const h=storeHarness();await h.store.ensureDocumentTemplateRecord('casio-ss');
  assert.equal(h.inserts.length,1);assert.equal(h.inserts[0].value.id,'casio-ss');assert.equal(h.inserts[0].value.layoutKey,'casio');
  await assert.rejects(()=>h.store.ensureDocumentTemplateRecord('not-a-template'),/bad_template/);
  assert.equal(h.inserts.length,1);
});

test('the main report contract and shared routes are retained', () => {
  const source=readFileSync('src/lib/analyzers/persist-report.ts','utf8');
  assert.ok(source.includes('chromeSnapshot: input.chromeSnapshot'));
  assert.ok(!source.includes('casioAttempts'));assert.ok(!source.includes('templateChrome:'));
  assert.ok(source.includes('ensureDocumentTemplateRecord(templateId)'));
  assert.ok(source.indexOf('ensureDocumentTemplateRecord(templateId)')<source.indexOf('await readDocumentChrome(templateId, input.converterAccountId)'));
  const route=readFileSync('src/app/api/workspace/documents/route.ts','utf8');
  assert.ok(route.includes('requireAnalyzerDesk'));assert.ok(route.includes('access.responses'));
  const view=readFileSync('src/components/analyzers/InterpretationDocument.tsx','utf8');assert.ok(view.includes('doc.chromeSnapshot'));
});
