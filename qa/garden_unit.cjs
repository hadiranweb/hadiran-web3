const fs=require('fs'),path=require('path'),ts=require('typescript'),Module=require('module'),assert=require('node:assert/strict');
const resolve=Module._resolveFilename,load=Module._load;let calls=0;
Module._resolveFilename=function(r,p,...a){return resolve.call(this,r.startsWith('@/')?path.join(process.cwd(),'src',r.slice(2)):r,p,...a)};
Module._load=function(r,p,...a){if(r==='server-only')return{};if(r==='@/db')return{db:{transaction:async()=>{calls++;throw Error('Injected garden failure')}}};return load.call(this,r,p,...a)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const {nextGardenIndex}=require('../src/lib/garden/types.ts'),{loadPublicGarden}=require('../src/lib/garden/public.ts');
(async()=>{const checks=[];function pass(s){checks.push(s);console.log('PASS',s)}
 for(const n of [0,-1,NaN,Infinity,1.5])assert.equal(nextGardenIndex(n,null,.5),null);assert.equal(nextGardenIndex(1,0,.7),0);pass('Empty/single-note pools handled without invented fallback');
 for(let n=2;n<=12;n++)for(let last=0;last<n;last++){const out=new Set();for(let j=0;j<100;j++){const i=nextGardenIndex(n,last,j/100);assert(i>=0&&i<n&&i!==last);out.add(i);}assert.equal(out.size,n-1);}pass('All other public notes are reachable, no immediate repeat across sizes 2–12');
 for(const r of [-3,0,1,2,NaN,Infinity])assert(nextGardenIndex(3,null,r)>=0&&nextGardenIndex(3,null,r)<3);pass('Random helper clamps invalid entropy without leaving pool bounds');
 const old=process.env.DATABASE_URL;delete process.env.DATABASE_URL;const none=await loadPublicGarden();assert.equal(none.source,'unavailable');assert.equal(none.total,null);assert.equal(calls,0);
 process.env.DATABASE_URL='injected-only';const failed=await loadPublicGarden();assert.equal(failed.source,'error');assert.equal(failed.total,null);assert.equal(failed.asOf,null);assert.deepEqual(failed.notes,[]);assert.equal(calls,1);pass('Injected failure and absent DB never fabricate successful reads or counts');
 if(old===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=old;fs.writeFileSync('qa/garden-unit-results.json',JSON.stringify({passed:true,checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
