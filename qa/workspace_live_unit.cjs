// Existing TypeScript only; DB failures are injected, not claimed as a live outage.
const fs=require('fs'),path=require('path'),ts=require('typescript'),Module=require('module'),assert=require('node:assert/strict');
const resolve=Module._resolveFilename,load=Module._load;let calls=0;
Module._resolveFilename=function(request,parent,...args){if(request.startsWith('@/'))request=path.join(process.cwd(),'src',request.slice(2));return resolve.call(this,request,parent,...args)};
Module._load=function(request,parent,...args){if(request==='server-only')return {};if(request==='@/db')return {db:{transaction:async()=>{calls++;throw Error('Injected DB failure')}}};return load.call(this,request,parent,...args)};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);
const {loadOperationalSnapshot}=require('../src/lib/workspace/operations.ts');
const {parseActionPage,parseActionKind}=require('../src/lib/workspace/operations-types.ts');
const {workspacePreferenceKey}=require('../src/lib/workspace/preferences.ts');const checks=[];
function pass(name){checks.push(name);console.log('PASS',name)}
(async()=>{
 for(const value of [null,'-1','1.5','Infinity','10001',{},'bad'])assert.equal(parseActionPage(value),1);assert.equal(parseActionPage('2'),2);assert.equal(parseActionKind('orders'),'orders');assert.equal(parseActionKind('__proto__'),null);pass('Bounded page and action-kind parsing');
 assert.notEqual(workspacePreferenceKey(1,'sidebar'),workspacePreferenceKey(2,'sidebar'));assert.notEqual(workspacePreferenceKey(0,'locale'),workspacePreferenceKey(1,'locale'));pass('Per-account sidebar and locale keys');
 await assert.rejects(()=>loadOperationalSnapshot({id:1,role:'author'}),/forbidden/);assert.equal(calls,0);pass('Loader rejects non-owner before touching DB');
 const original=process.env.DATABASE_URL;delete process.env.DATABASE_URL;const unavailable=await loadOperationalSnapshot({id:1,role:'owner'});assert.equal(unavailable.source,'unavailable');assert.equal(unavailable.asOf,null);assert(Object.values(unavailable.counts).every(value=>value===null));assert.equal(calls,0);pass('Missing DB is unknown, not zero or fabricated data');
 process.env.DATABASE_URL='local-unit-placeholder';const preview=await loadOperationalSnapshot({id:0,role:'owner'});assert.equal(preview.source,'preview');assert.equal(calls,0);assert.equal(preview.actions.length,0);
 const failed=await loadOperationalSnapshot({id:1,role:'owner'});assert.equal(failed.source,'error');assert.equal(failed.asOf,null);assert(Object.values(failed.counts).every(value=>value===null));assert.deepEqual(failed.actions,[]);assert.equal(calls,1);pass('Injected read failure cannot return a successful timestamp or sample rows');
 if(original===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=original;
 fs.writeFileSync('qa/workspace-live-unit-results.json',JSON.stringify({passed:true,checks,failure_test:'injected DB failure'},null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
