/* Isolated local fixtures, not production content. */
const {Client}=require('pg'),fs=require('fs'),assert=require('node:assert/strict');
const url='postgresql://hadiran_qa:local-qa-only@127.0.0.1:5432/hadiran_integration_qa',base='http://127.0.0.1:3002';
const u=new URL(url);assert.equal(u.hostname,'127.0.0.1');assert.equal(u.pathname,'/hadiran_integration_qa');
const db=new Client({connectionString:url}),checks=[];const pass=s=>{checks.push(s);console.log('PASS',s)};
const notes=[
 ['problem','راه‌حلِ خوب، برای کدام مسئله؟','پیش از انتخاب ابزار، صورت‌مسئله را کمی دقیق‌تر ببینیم.','گاهی دنبال ابزار تازه می‌گردیم، در حالی که هنوز اتفاق مشخص را توصیف نکرده‌ایم.\n\n**صورت‌مسئله** را از نتیجه‌ای که می‌خواهیم جدا کنیم. چه اتفاقی افتاده؟ کجا تکرار می‌شود؟ چه چیزی را هنوز نمی‌دانیم؟\n\nاین پرسش‌ها نقطهٔ شروع گفت‌وگو هستند؛ نه نتیجه‌گیری دربارهٔ یک فرد یا کسب‌وکار.'],
 ['experiment','یک آزمایش کوچک، یک سؤال روشن','قرار نیست هر آزمایش، همه‌چیز را حل کند.','قبل از شروع، فقط یک سؤال بنویسیم: از این آزمایش چه می‌خواهیم بفهمیم؟\n\nیک تغییر کوچک، یک بازهٔ مشخص و یک معیار قابل مشاهده کافی است تا ایده‌ای را به محک بگذاریم. نتیجه ممکن است خلاف انتظارمان باشد؛ همان هم بخشی از یادگیری است.'],
 ['flow','کندیِ کار، کجای مسیر پنهان شده؟','گاهی مسئله در فاصلهٔ میان دو کار است، نه در سرعت آدم‌ها.','یک درخواست را از ابتدا تا انتها دنبال کنیم. کجا منتظر می‌ماند؟ چه کسی باید آن را تحویل بگیرد؟ چه چیزی برای ادامه کم است؟\n\nاین نگاه، **احتمالِ گلوگاه** را بررسی می‌کند؛ از یک نشانه، حکم قطعی دربارهٔ آدم‌ها نمی‌سازد.']
];
async function fixture(key,{lifecycle='approved',visibility='public',index=true,linked=true,body='PRIVATE_SENTINEL_'+key,title=key}={}){
 const id='garden-qa-'+key,slug=id;await db.query('insert into memory_items(id,title_fa,lifecycle,visibility) values($1,$2,$3,$4) on conflict(id) do update set lifecycle=excluded.lifecycle,visibility=excluded.visibility',[id,title,lifecycle,visibility]);
 const q=await db.query('insert into knowledge(slug,type,title_fa,summary_fa,body_fa,ai_indexable,memory_item_id) values($1,\'note\',$2,$3,$4,$5,$6) on conflict(slug) do update set title_fa=excluded.title_fa,summary_fa=excluded.summary_fa,body_fa=excluded.body_fa,ai_indexable=excluded.ai_indexable,memory_item_id=excluded.memory_item_id returning id',[slug,title,'متن آزمایشی · '+(notes.find(n=>n[0]===key)?.[2]||title),body,index,linked?id:null]);return q.rows[0].id;
}
(async()=>{await db.connect();await db.query("delete from knowledge where slug like 'garden-qa-%'");await db.query("delete from memory_items where id like 'garden-qa-%'");
 let initial=await(await fetch(base+'/api/garden-preview')).json();assert.equal(initial.source,'live');assert.equal(initial.total,0);assert.deepEqual(initial.notes,[]);pass('Genuine empty published corpus is live/zero, not unavailable or seeded UI');
 const publicSlugs=[];for(const [key,title,summary,body]of notes){await fixture(key,{title,body:'متن آزمایشی برای بازبینی رابط؛ نه یادداشت منتشرشدهٔ محیط اصلی.\n\n'+body});publicSlugs.push('garden-qa-'+key);}
 const hidden=[['private',{visibility:'private'}],['draft',{lifecycle:'draft'}],['rejected',{lifecycle:'rejected'}],['unindexed',{index:false}],['unlinked',{linked:false}]];
 for(const [key,options]of hidden)await fixture(key,options);
 const topic=await db.query("insert into topics(slug,label_fa) values('garden-qa-framing','صورت‌مسئله') on conflict(slug) do update set label_fa=excluded.label_fa returning id");
 await db.query("insert into knowledge_topics(knowledge_id,topic_id) select id,$1 from knowledge where slug in ('garden-qa-problem','garden-qa-flow') on conflict do nothing",[topic.rows[0].id]);
 const response=await fetch(base+'/api/garden-preview'),data=await response.json(),raw=JSON.stringify(data);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(data.total,3);assert.deepEqual(data.notes.map(n=>n.slug).sort(),publicSlugs.sort());for(const [key]of hidden){assert(!raw.includes('garden-qa-'+key));assert(!raw.includes('PRIVATE_SENTINEL'));}assert(!raw.includes('memoryItemId'));assert(!raw.includes('referrer'));assert(data.notes.find(n=>n.slug==='garden-qa-problem').topics[0].label==='صورت‌مسئله');pass('Published+public+approved+indexable+linked intersection only, scoped real topics and no internal IDs');
 for(let i=0;i<15;i++)await fixture('extra-'+i,{body:'الف'.repeat(2500),title:'آزمون کران '+i});
 const bounded=await(await fetch(base+'/api/garden-preview')).json();assert.equal(bounded.total,18);assert.equal(bounded.notes.length,12);assert(bounded.notes.every(n=>n.body.length===4000&&n.excerpted===true));pass('12-note SQL bound, genuine total and 4,000-character excerpts');
 await db.query("delete from knowledge where slug like 'garden-qa-extra-%'");await db.query("delete from memory_items where id like 'garden-qa-extra-%'");
 const missing=await fetch('http://127.0.0.1:3001/api/garden-preview'),none=await missing.json();assert.equal(missing.status,503);assert.equal(none.source,'unavailable');assert.equal(none.total,null);assert.equal(none.asOf,null);assert.deepEqual(none.notes,[]);pass('No DB: 503 plus unknown count/date and no counterfeit notes');
 for(const method of ['POST','PUT','PATCH','DELETE'])assert.equal((await fetch(base+'/api/garden-preview',{method})).status,405);pass('Public snapshot API is read-only');
 fs.writeFileSync('qa/garden-fixture.json',JSON.stringify({local_only:true,slugs:publicSlugs},null,2));fs.writeFileSync('qa/garden-api-results.json',JSON.stringify({passed:true,checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>db.end());
