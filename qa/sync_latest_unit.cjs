// Pure regression checks for cb20276; existing TypeScript only, all outbound HTTP is mocked.
const fs=require('fs'),path=require('path'),ts=require('typescript'),Module=require('module'),assert=require('assert');
const original=Module._resolveFilename;
Module._resolveFilename=function(request,parent,...args){if(request.startsWith('@/'))request=path.join(process.cwd(),'src',request.slice(2));return original.call(this,request,parent,...args)};
require.extensions['.ts']=function(m,f){m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f)};
const {buildCasioAuthoredPack}=require('../src/lib/analyzers/casio-ss/authored-pack.ts');
const {renderUserSummary,summaryVars,interpolateSummary}=require('../src/lib/analyzers/summary-template.ts');
const {sanitizePack}=require('../src/lib/analyzers/sanitize.ts');
const {gateOf}=require('../src/lib/analyzers/gate.ts');
const telegram=require('../src/lib/bots/telegram.ts');
const fixture=JSON.parse(fs.readFileSync('qa/analyzer-fixture.json','utf8')),checks=[];
function check(name){checks.push(name);console.log('PASS',name)}
(async()=>{
 const {workspaceScope,workspaceHome,safeReturnPath}=require('../src/lib/workspace/access.ts');
 for(const [role,analyzerDesk,scope,home] of [['owner',false,'owner','/workspace'],['author',false,'author','/workspace/analyzers'],['member',true,'delegated','/workspace/analyzers'],['member',false,'member','/account']]){assert.equal(workspaceScope({role,analyzerDesk}),scope);assert.equal(workspaceHome({role,analyzerDesk}),home)}
 for(const bad of [null,{},'https://evil.test','//evil.test','/\\evil.test','/signin','/signin?next=/signin','/workspace\n'])assert.equal(safeReturnPath(bad),'/');
 assert.equal(safeReturnPath('/workspace/analyzers?a=1#responses'),'/workspace/analyzers?a=1#responses');check('Four account scopes and safe internal return paths');
 const pack=buildCasioAuthoredPack();const text=renderUserSummary(pack,fixture.answers,fixture.results);assert(text.includes('بلوغ سیستم'));assert(!text.includes('yellow'));assert(!text.includes('وضع مطلوب'));assert(!text.includes('ارزیابی زرد'));check('CASIO member summary renders without full interpretation or gate band');
 const vars=summaryVars(pack,fixture.answers,fixture.results);assert(!Object.hasOwn(vars,'gate-band'));assert.equal(interpolateSummary('{نام} {unknown} {__proto__} {constructor} {gate-band}',vars),pack.nameFa+'    ');assert.equal(interpolateSummary('{total}',{total:'{name}',name:'not recursively expanded'}),'{name}');check('Summary aliases, unknown/prototype keys, hidden band and nonrecursive interpolation');
 const generic={...pack,slug:'qa-generic',report:{userSummaryTemplateFa:'{name}\n{total} {gate-band}'}};const sanitized=sanitizePack(generic,generic.slug);assert(sanitized.ok);assert.equal(sanitized.pack.report.userSummaryTemplateFa,generic.report.userSummaryTemplateFa);assert(renderUserSummary({...generic,report:{}},{},null).includes('پاسخ‌های شما ثبت شد'));check('Multiline custom summary survives sanitization; generic missing template has honest fallback');
 for(const bandId of ['green','yellow','red']){const gate=gateOf(pack,{scores:{...fixture.results.scores,'gate-band':bandId}});assert.equal(gate.bandId,bandId);assert.equal(gate.dimensions.length,3);assert.equal(gate.total,55)}assert.equal(gateOf(pack,null),null);assert.equal(gateOf(pack,{scores:{'gate-band':'unknown'}}),null);check('All gate bands/dimensions and missing/invalid snapshots');
 const oldBase=process.env.TELEGRAM_API_BASE,oldFetch=global.fetch;let last;
 try{
  delete process.env.TELEGRAM_API_BASE;assert(telegram.webhookUrlFor('abc123').endsWith('/api/bots/telegram/abc123/webhook'));
  process.env.TELEGRAM_API_BASE='https://worker.example.test/';assert.equal(telegram.webhookUrlFor('abc123'),'https://worker.example.test/hook/abc123');
  global.fetch=async(url,options)=>{last={url,body:JSON.parse(options.body)};return {json:async()=>({ok:true,result:true})}};
  await telegram.telegramSetWebhook('123456:QA_FAKE',{url:telegram.webhookUrlFor('abc123'),secretToken:'fake-secret'});assert.equal(last.body.drop_pending_updates,false);assert.equal(last.body.secret_token,'fake-secret');assert(last.url.startsWith('https://worker.example.test/bot123456:QA_FAKE/'));check('Direct/proxied webhook URL and reconnect preserves pending updates');
  const worker=(await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('scripts/telegram-proxy-worker.js','utf8')).toString('base64'))).default;
  global.fetch=async(url,init)=>{last={url:String(url),init};return new Response('{"ok":false}',{status:401,headers:{'Content-Type':'application/json'}})};
  const r=await worker.fetch(new Request('https://worker.example.test/hook/abc123',{method:'POST',headers:{'Content-Type':'application/json','X-Telegram-Bot-Api-Secret-Token':'fake-secret'},body:'{"update_id":1}'}));assert.equal(r.status,401);assert.equal(last.url,'https://hadiranweb.ir/api/bots/telegram/abc123/webhook');assert.equal(last.init.headers.get('X-Telegram-Bot-Api-Secret-Token'),'fake-secret');assert.equal(new TextDecoder().decode(last.init.body),'{"update_id":1}');assert.equal(await r.text(),'{"ok":false}');check('Inbound Worker forwards exact body/secret and origin denial status');
  const out=await worker.fetch(new Request('https://worker.example.test/bot123456:QA_FAKE/getMe',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}));assert.equal(last.url,'https://api.telegram.org/bot123456:QA_FAKE/getMe');assert.equal(out.status,401);
  assert.equal((await worker.fetch(new Request('https://worker.example.test/hook/abc123'))).status,405);assert.equal((await worker.fetch(new Request('https://worker.example.test/hook/a/b',{method:'POST',body:'{}'}))).status,404);
  global.fetch=async()=>{throw new Error('Mocked unreachable origin')};assert.equal((await worker.fetch(new Request('https://worker.example.test/hook/abc123',{method:'POST',headers:{'X-Telegram-Bot-Api-Secret-Token':'fake-secret'},body:'{}'}))).status,502);check('Outbound Worker destination, invalid paths/method and upstream failure handling');
 }finally{global.fetch=oldFetch;if(oldBase===undefined)delete process.env.TELEGRAM_API_BASE;else process.env.TELEGRAM_API_BASE=oldBase}
 fs.writeFileSync('qa/workspace-unit-results.json',JSON.stringify({passed:true,upstream:'cb20276e0f82b6d1baa42bf843a5aa5c9ac05231',checks,external_http:'fully mocked'},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
