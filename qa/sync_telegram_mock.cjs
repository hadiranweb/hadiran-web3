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
 const enc=secret.sealSecret('fake-private-token');assert.equal(secret.openSecret(enc),'fake-private-token');assert(!enc.includes('fake-private-token'));const bytes=Buffer.from(enc,'base64url');bytes[15]^=1;assert.throws(()=>secret.openSecret(bytes.toString('base64url')));assert(secret.secretsMatch('same','same'));assert(!secret.secretsMatch('bad','same'));assert(!secret.secretsMatch(null,'same'));check('AES-GCM roundtrip/tamper rejection and webhook secret comparison');
 process.env.TELEGRAM_API_BASE='http://unsafe.invalid';assert.equal(telegram.telegramApiBase(),'https://api.telegram.org');process.env.TELEGRAM_API_BASE='https://proxy.example.test/telegram/';assert.equal(telegram.telegramApiBase(),'https://proxy.example.test/telegram');delete process.env.TELEGRAM_API_BASE;check('HTTPS-only optional Telegram proxy normalization and safe fallback');
 const {rows:packs}=await pool.query("SELECT slug FROM analyzer_packs WHERE slug LIKE 'sync-qa-%' AND status='open' ORDER BY slug DESC LIMIT 1");assert(packs.length);const slug=packs[0].slug;
 const {rows:owners}=await pool.query("SELECT id FROM accounts WHERE phone='09121234567'");const botId=secret.newBotId();await pool.query("INSERT INTO bots(id,owner_id,title_fa,analyzer_slug,status) VALUES($1,$2,'ربات تست محلی',$3,'disconnected')",[botId,owners[0].id,slug]);
 const uid=88000000+Math.floor(Math.random()*99999),from={id:uid,first_name:'تست',last_name:'تلگرام'},chat={id:uid,type:'private'};
 const msg=(body)=>({message:{message_id:calls.length+1,from,chat,...body}});const cb=(data)=>({callback_query:{id:'callback-'+calls.length,from,data,message:{message_id:1,chat}}});
 const run=update=>handleTelegramUpdate({botId,analyzerSlug:slug,token:'QA-FAKE',update});
 await run(null);await run({message:{from,chat:{...chat,type:'group'},text:'/start'}});assert.equal(sent.length,0);check('Malformed updates and group chats ignored');
 await run(msg({text:'/help@qa_bot'}));assert(sent.at(-1).text.includes('راهنما'));
 await run(msg({text:'/start@qa_bot'}));assert(sent.at(-1).reply_markup.inline_keyboard[0][0].callback_data==='ok');
 await run(cb('ok'));assert(sent.at(-1).reply_markup.keyboard[0][0].request_contact);check('Conversation consent before verified phone request');
 await run(msg({contact:{phone_number:'09121110004',first_name:'تست'}}));assert(sent.at(-1).text.includes('فقط شماره'));let rows=await pool.query('SELECT id FROM accounts WHERE telegram_user_id=$1',[String(uid)]);assert.equal(rows.rowCount,0);
 await run(msg({contact:{phone_number:'09121110004',first_name:'تست',user_id:uid+1}}));assert(sent.at(-1).text.includes('فقط شماره'));check('Missing/mismatched contact user_id rejected before linking an account');
 const phone='0912'+String(uid).slice(-7);await run(msg({contact:{phone_number:phone,first_name:'تست',last_name:'تلگرام',user_id:uid}}));assert(sent.at(-1).text.includes('کد معرف'));await run(msg({text:'/help@qa_bot'}));assert(sent.at(-1).text.includes('راهنما'));await run(cb('skipref'));assert(sent.at(-1).reply_markup.inline_keyboard);check('Own Telegram contact links local account and optional referral skip starts quiz');
 await run(cb('q:999:7'));assert(sent.at(-1).text.includes('معتبر نیست'));await run(cb('q:0:7'));
 rows=await pool.query('SELECT a.status,a.results FROM analyzer_attempts a JOIN accounts u ON u.id=a.account_id WHERE u.telegram_user_id=$1 AND a.slug=$2',[String(uid),slug]);assert.equal(rows.rows[0].status,'submitted');assert.equal(rows.rows[0].results.scores['qa-mean'],7);check('Mocked Telegram range callback persists answer, computes score and submits real local attempt');
 const submittedCount=(await pool.query('SELECT COUNT(*) FROM analyzer_attempts a JOIN accounts u ON u.id=a.account_id WHERE u.telegram_user_id=$1 AND a.slug=$2',[String(uid),slug])).rows[0].count;
 await run(cb('q:0:4'));await run(msg({text:'/help@qa_bot'}));assert(sent.at(-1).text.includes('راهنما'));
 await run(msg({text:'/start@qa_bot'}));assert.equal((await pool.query('SELECT COUNT(*) FROM analyzer_attempts a JOIN accounts u ON u.id=a.account_id WHERE u.telegram_user_id=$1 AND a.slug=$2',[String(uid),slug])).rows[0].count,submittedCount);check('Replayed callback/start resumes submitted report without creating another attempt');
 await pool.query('DELETE FROM bots WHERE id=$1',[botId]);fs.writeFileSync('qa/sync-telegram-mock-results.json',JSON.stringify({passed:true,checks,telegram_http:'fully mocked',database:'local disposable PostgreSQL',real_telegram_tested:false},null,2));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>pool.end());
