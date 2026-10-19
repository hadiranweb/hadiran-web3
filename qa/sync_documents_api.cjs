/* Destructive fault probes are restricted to the disposable local QA database. */
const {Client}=require('pg'),assert=require('node:assert/strict'),fs=require('node:fs');
const url='postgresql://hadiran_qa:local-qa-only@127.0.0.1:5432/hadiran_integration_qa';assert.equal(new URL(url).pathname,'/hadiran_integration_qa');assert.equal(new URL(url).hostname,'127.0.0.1');
const db=new Client({connectionString:url}),base='http://127.0.0.1:3002',cookies={},checks=[];
const pass=x=>{checks.push(x);console.log('PASS',x)};
async function call(who,path,method='GET',body,status=200){const res=await fetch(base+path,{method,redirect:'manual',headers:{Cookie:cookies[who]||'','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const text=await res.text();assert.equal(res.status,status,[who,path,text.slice(0,250)]);if(res.headers.get('set-cookie'))cookies[who]=res.headers.get('set-cookie').split(';')[0];if(path.startsWith('/api/workspace/doc')&&res.ok)assert(res.headers.get('cache-control').includes('private')&&res.headers.get('cache-control').includes('no-store'));try{return JSON.parse(text)}catch{return text}}
async function money(){return(await db.query("select (select count(*) from shop_orders)::text orders,(select sum(amount) from shop_orders)::text amount,(select count(*) from shop_order_events)::text events,(select count(*) from shop_entitlements)::text grants,(select sum(used_count) from discount_codes)::text uses")).rows[0]}
async function faultOff(){await db.query('drop trigger if exists sync_doc_fault on analyzer_report_layers;drop function if exists sync_doc_fail()')}
(async()=>{await db.connect();await db.query('truncate rate_limit_buckets');await faultOff();await db.query("insert into accounts(phone,role,password_hash,phone_verified_at,policies_accepted_at,policies_version,onboarding_completed_at) select '09121110008','author',password_hash,now(),now(),policies_version,now() from accounts where phone='09121234567' on conflict(phone) do nothing");
for(const [who,phone] of Object.entries({owner:'09121234567',author:'09121110001',other:'09121110008',member:'09121234568',viewer:'09121110005'}))await call(who,'/api/auth/password/login','POST',{phone,password:'Integration-QA-2026'});
for(const path of ['/api/workspace/documents','/api/workspace/document-templates']){await call('anon',path,'GET',undefined,401);await call('member',path,'GET',undefined,403)}
await call('other','/api/workspace/documents?slug=casio-ss','GET',undefined,403);await call('other','/api/workspace/documents','POST',{slug:'casio-ss',templateId:'casio-ss',attemptIds:[1]},403);
assert.deepEqual((await call('viewer','/api/workspace/documents')).items,[]);await call('viewer','/api/workspace/documents?slug=casio-ss','GET',undefined,403);
pass('Anonymous/member denied; unrelated author and view-only delegate cannot read or convert response documents');
const initialOwner=(await call('owner','/api/workspace/document-templates')).templates,initialAuthor=(await call('author','/api/workspace/document-templates')).templates;
const own=initialOwner.find(t=>t.id==='casio-ss'),author=initialAuthor.find(t=>t.id==='casio-ss');
const beforeMoney=await money();let documentId;
try{
 const personal={...author.chrome,html:author.chrome.html+'<p>AUTHOR_PRIVATE_TEMPLATE_PROBE</p>'};await call('author','/api/workspace/document-templates/casio-ss','PUT',{chrome:personal});
 assert((await call('author','/api/workspace/document-templates')).templates.find(t=>t.id==='casio-ss').chrome.html.includes('AUTHOR_PRIVATE_TEMPLATE_PROBE'));
 for(const who of ['owner','other'])assert(!(await call(who,'/api/workspace/document-templates')).templates.find(t=>t.id==='casio-ss').chrome.html.includes('AUTHOR_PRIVATE_TEMPLATE_PROBE'));
 pass('Code editor saves a private account override, never another author or the shared system template');
 const attempt=(await db.query("select id from casio_attempts where account_id=(select id from accounts where phone='09121234568') and status='submitted' order by submitted_at desc limit 1")).rows[0].id;
 const body={slug:'casio-ss',templateId:'casio-ss',attemptIds:[attempt]};
 const results=await Promise.all(Array.from({length:6},()=>call('author','/api/workspace/documents','POST',body)));
 for(const r of results){assert.equal(r.errors.length,0);assert.equal(r.items.length,1)}
 assert.equal(new Set(results.map(r=>r.items[0].id)).size,1);documentId=results[0].items[0].id;
 const rows=(await db.query('select * from analyzer_reports where id=$1',[documentId])).rows;assert.equal(rows.length,1);assert(rows[0].template_chrome.html.includes('AUTHOR_PRIVATE_TEMPLATE_PROBE'));assert(rows[0].converted_by);
 const counts=(await db.query('select count(*)::int n from analyzer_report_layers where report_id=$1',[documentId])).rows[0].n;assert.equal(counts,5);
 pass('Six concurrent conversions serialize to one complete five-layer document with actor and template snapshot');
 await call('author','/api/workspace/document-templates/casio-ss','PUT',{chrome:author.chrome});assert((await db.query('select template_chrome from analyzer_reports where id=$1',[documentId])).rows[0].template_chrome.html.includes('AUTHOR_PRIVATE_TEMPLATE_PROBE'));
 pass('Editing a personal template does not silently rewrite an already converted document');
 const before=(await db.query('select row_to_json(r) doc,(select json_agg(l order by l.id) from analyzer_report_layers l where l.report_id=r.id) layers from analyzer_reports r where r.id=$1',[documentId])).rows;
 await db.query("create function sync_doc_fail() returns trigger language plpgsql as $$ begin raise exception 'QA document rollback probe'; end $$; create trigger sync_doc_fault before insert on analyzer_report_layers for each row execute function sync_doc_fail()");
 const failure=await call('owner','/api/workspace/documents','POST',body);assert.equal(failure.items.length,0);assert.equal(failure.errors.length,1);await faultOff();
 const after=(await db.query('select row_to_json(r) doc,(select json_agg(l order by l.id) from analyzer_report_layers l where l.report_id=r.id) layers from analyzer_reports r where r.id=$1',[documentId])).rows;assert.deepEqual(after,before);
 pass('Injected child-write failure rolls back parent, template, actor and all previous layers together');
 await call('owner','/api/workspace/documents','POST',{...body,attemptIds:Array(51).fill(attempt)},400);
 const retry=await call('owner','/api/workspace/documents','POST',body);assert.equal(retry.items[0].id,documentId);assert.equal(retry.errors.length,0);
 pass('Batch boundary is explicit and retry after rollback regenerates the existing document safely');
 const memberHtml=await call('member','/analyzers/casio-ss/report');assert(!memberHtml.includes('AUTHOR_PRIVATE_TEMPLATE_PROBE'));assert(!memberHtml.includes('data-document-surface'));assert(memberHtml.includes('خلاصهٔ این نوبت'));
 await call('member','/workspace/documents/'+documentId,'GET',undefined,307);await call('other','/workspace/documents/'+documentId,'GET',undefined,404);
 assert((await call('author','/api/workspace/documents?slug=casio-ss')).items.some(r=>r.id===documentId));
 pass('Converted documents stay staff-authorized; free member summary cannot bypass the unimplemented paid grant');
 assert.deepEqual(await money(),beforeMoney);pass('Browsing, template editing and conversion create no payment, discount, shop grant or wallet effect');
 fs.mkdirSync('/home/user/.cache',{recursive:true});fs.writeFileSync('/home/user/.cache/sync-docs-clients.json',JSON.stringify(cookies));fs.writeFileSync('qa/sync-documents-fixture.json',JSON.stringify({local_only:true,documentId,attemptId:attempt},null,2));
}finally{await faultOff();await call('owner','/api/workspace/document-templates/casio-ss','PUT',{chrome:own.chrome});await call('author','/api/workspace/document-templates/casio-ss','PUT',{chrome:author.chrome})}
fs.writeFileSync('qa/sync-documents-api-results.json',JSON.stringify({passed:true,upstream:'ab290dcf7b6998c5994f5bb3cddc3454565444e5',checks,external_payments:false},null,2));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>db.end());
