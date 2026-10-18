// Existing TypeScript compiler only. Real disposable PostgreSQL; all Telegram HTTP is mocked.
const fs=require('fs'),path=require('path'),ts=require('typescript'),Module=require('module'),assert=require('assert');
const url=new URL(process.env.DATABASE_URL||'http://missing');
assert(['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/hadiran_integration_qa','Local QA DB only');
const originalResolve=Module._resolveFilename,originalLoad=Module._load;
Module._resolveFilename=function(request,parent,...args){if(request.startsWith('@/'))request=path.join(process.cwd(),'src',request.slice(2));return originalResolve.call(this,request,parent,...args)};
Module._load=function(request,parent,...args){if(request==='server-only')return {};return originalLoad.call(this,request,parent,...args)};
require.extensions['.ts']=function(m,f){m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f)};
const {pool}=require('../src/db/index.ts');const secret=require('../src/lib/bots/secret.ts');const telegram=require('../src/lib/bots/telegram.ts');
const {handleTelegramUpdate}=require('../src/lib/bots/chat.ts');const sent=[],calls=[],checks=[];
global.fetch=async (url,options)=>{assert(String(url).startsWith('https://api.telegram.org/botQA-FAKE/'),'Unexpected outbound URL');const method=String(url).split('/').pop();const body=JSON.parse(options.body);calls.push(method);if(method==='sendMessage')sent.push(body);return {ok:true,json:async()=>({ok:true,result:method==='sendMessage'?{message_id:calls.length}:true})}};
function check(name){checks.push(name);console.log('PASS',name)}
(async()=>{
 const enc=secret.sealSecret('fake-private-token');assert.equal(secret.openSecret(enc),'fake-private-token');const bytes=Buffer.from(enc,'base64url');bytes[15]^=1;assert.throws(()=>secret.openSecret(bytes.toString('base64url')));check('AES-GCM roundtrip and tamper rejection');
 const {rows:packs}=await pool.query("SELECT slug FROM analyzer_packs WHERE slug LIKE 'sync-qa-%' AND status='open' ORDER BY slug DESC LIMIT 1");assert(packs.length);const slug=packs[0].slug;
 const {rows:owners}=await pool.query("SELECT id FROM accounts WHERE phone='09121234567'");const botId=secret.newBotId();await pool.query("INSERT INTO bots(id,owner_id,title_fa,analyzer_slug,status) VALUES($1,$2,'ربات تست محلی',NULL,'disconnected')",[botId,owners[0].id]);
 const uid=88000000+Math.floor(Math.random()*99999),from={id:uid,first_name:'تست',last_name:'تلگرام'},chat={id:uid,type:'private'};
 const msg=body=>({message:{message_id:calls.length+1,from,chat,...body}});const cb=data=>({callback_query:{id:'callback-'+calls.length,from,data,message:{message_id:1,chat}}});
 const script={service:'analyzers',flow:{askPolicy:true,askNames:false,askReferral:true,askDiscount:false,sendPasswordLink:false}};
 const run=update=>handleTelegramUpdate({botId,token:'QA-FAKE',update,script});
 await run(null);await run({message:{from,chat:{...chat,type:'group'},text:'/start'}});assert.equal(sent.length,0);
 await run(msg({text:'/help@qa_bot'}));assert(sent.at(-1).text.includes('راهنما'));
 await run(msg({text:'/start@qa_bot'}));assert(sent.at(-1).reply_markup.keyboard.flat().some(key=>key.request_contact));check('Independent hub ignores malformed/group updates and requests contact on start');
 for(const user_id of [undefined,uid+1]){await run(msg({contact:{phone_number:'09121110004',first_name:'تست',user_id}}));assert(sent.at(-1).text.includes('فقط شماره'));assert.equal((await pool.query('SELECT id FROM accounts WHERE telegram_user_id=$1',[String(uid)])).rowCount,0)}check('Contact without matching Telegram user ID cannot link an account');
 const jwt=process.env.HADIRAN_JWT_SECRET;delete process.env.HADIRAN_JWT_SECRET;
 const phone='0912'+String(uid).slice(-7);await run(msg({contact:{phone_number:phone,first_name:'تست',last_name:'تلگرام',user_id:uid}}));assert.equal(sent.at(-1).reply_markup.inline_keyboard[0][0].callback_data,'policyok');
 await run(cb('policyok'));assert(sent.at(-1).text.includes('کد معرف'));await run(msg({text:'/help@qa_bot'}));assert(sent.at(-1).text.includes('راهنما'));await run(cb('skipref'));
 assert(sent.at(-1).reply_markup.inline_keyboard.flat().some(key=>key.callback_data==='exam:'+slug));check('Contact registration and policy work without web JWT; hub lists available exams');
 await run(cb('exam:'+slug));assert.equal(sent.at(-1).reply_markup.inline_keyboard[0][0].callback_data,'packok');await run(cb('packok'));
 await run(cb('g:0:0'));assert(calls.includes('editMessageText'));
 await run(cb('q:999:7'));assert(sent.at(-1).text.includes('معتبر نیست'));await run(cb('q:0:7'));
 let rows=await pool.query('SELECT a.status,a.results FROM analyzer_attempts a JOIN accounts u ON u.id=a.account_id WHERE u.telegram_user_id=$1 AND a.slug=$2 ORDER BY a.created_at',[String(uid),slug]);assert.equal(rows.rows[0].status,'submitted');assert.equal(rows.rows[0].results.scores['qa-mean'],7);check('Pack consent, question guide and range callback submit scored attempt');
 await run(cb('q:0:4'));assert.equal((await pool.query('SELECT COUNT(*) FROM analyzer_attempts a JOIN accounts u ON u.id=a.account_id WHERE u.telegram_user_id=$1 AND a.slug=$2',[String(uid),slug])).rows[0].count,'1');
 await run(msg({text:'/restart'}));await run(cb('packok'));rows=await pool.query('SELECT a.status,a.results FROM analyzer_attempts a JOIN accounts u ON u.id=a.account_id WHERE u.telegram_user_id=$1 AND a.slug=$2 ORDER BY a.created_at',[String(uid),slug]);assert.equal(rows.rows.length,2);assert.equal(rows.rows[0].status,'submitted');assert.equal(rows.rows[1].status,'in_progress');check('Replay is immutable and restart creates a separate clean attempt');
 await run(msg({text:'/clear'}));assert(calls.includes('deleteMessages'));assert.equal((await pool.query('SELECT COUNT(*) FROM analyzer_attempts a JOIN accounts u ON u.id=a.account_id WHERE u.telegram_user_id=$1 AND a.slug=$2',[String(uid),slug])).rows[0].count,'2');check('Clear chat invokes Telegram deletion without deleting assessment history');
 const {defaultScript,parseBotScript}=require('../src/lib/bots/script.ts');const custom=defaultScript('custom');custom.flow.askPolicy=false;custom.flow.askNames=false;custom.flow.askReferral=false;
 await handleTelegramUpdate({botId,token:'QA-FAKE',update:msg({text:'/start'}),script:custom});const state=(await pool.query('SELECT step FROM bot_chat_sessions WHERE bot_id=$1 AND telegram_user_id=$2',[botId,String(uid)])).rows[0];assert.equal(state.step,'idle');assert(!parseBotScript({flow:{sendPasswordLink:true}}).flow.sendPasswordLink);check('Custom service runs without an exam or automatic password links');
 process.env.HADIRAN_JWT_SECRET=jwt;await pool.query('DELETE FROM bots WHERE id=$1',[botId]);fs.writeFileSync('qa/workspace-telegram-mock-results.json',JSON.stringify({passed:true,checks,telegram_http:'fully mocked',database:'local disposable PostgreSQL',real_telegram_tested:false},null,2));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>pool.end());
