// Failures below are injected; they are not production outage tests.
const fs=require('fs'),path=require('path'),ts=require('typescript'),Module=require('module'),assert=require('node:assert/strict');
const resolve=Module._resolveFilename,load=Module._load;let calls=0;
Module._resolveFilename=function(request,parent,...args){return resolve.call(this,request.startsWith('@/')?path.join(process.cwd(),'src',request.slice(2)):request,parent,...args)};
Module._load=function(request,parent,...args){if(request==='server-only')return {};if(request==='@/db')return {db:{transaction:async()=>{calls++;throw Error('Injected failure')}}};return load.call(this,request,parent,...args)};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);
const {loadPersonalSnapshot}=require('../src/lib/account/overview.ts'),{loadAnalyzerSnapshot}=require('../src/lib/workspace/analyzer-overview.ts');
const {personalKind,deskFilter}=require('../src/lib/workspace/role-home-types.ts');const checks=[];
function pass(name){checks.push(name);console.log('PASS',name)}
(async()=>{
 for(const v of [null,{},'__proto__','bad','mine;delete']){assert.equal(personalKind(v),null);assert.equal(deskFilter(v),'all')};assert.equal(personalKind('reports'),'reports');assert.equal(deskFilter('drafts'),'drafts');pass('Only explicit personal and author filters are accepted');
 const original=process.env.DATABASE_URL;delete process.env.DATABASE_URL;
 for(const fn of [loadPersonalSnapshot,loadAnalyzerSnapshot]){const data=await fn({id:1,role:'owner'});assert.equal(data.source,'unavailable');assert.equal(data.asOf,null);assert(Object.values(data.counts).every(n=>n===null));assert.deepEqual(data.items,[])}assert.equal(calls,0);pass('Missing DB means unknown counts and time, without sample substitution');
 process.env.DATABASE_URL='local-unit-placeholder';
 for(const fn of [loadPersonalSnapshot,loadAnalyzerSnapshot]){const demo=await fn({id:0,role:'owner'});assert.equal(demo.source,'preview');assert.equal(demo.asOf,null);assert.deepEqual(demo.items,[])}assert.equal(calls,0);pass('Preview account never touches DB or fabricates live rows');
 for(const fn of [loadPersonalSnapshot,loadAnalyzerSnapshot]){await assert.rejects(()=>fn({id:-1,role:'owner'}),/invalid_account/);await assert.rejects(()=>fn({id:1.5,role:'author'}),/invalid_account/)}assert.equal(calls,0);pass('Invalid account identifiers are rejected before DB access');
 for(const fn of [loadPersonalSnapshot,loadAnalyzerSnapshot]){const data=await fn({id:1,role:'member'});assert.equal(data.source,'error');assert.equal(data.asOf,null);assert(Object.values(data.counts).every(n=>n===null));assert.deepEqual(data.items,[])}assert.equal(calls,2);pass('Injected transaction failure cannot claim a successful snapshot');
 if(original===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=original;
 fs.writeFileSync('qa/role-home-unit-results.json',JSON.stringify({passed:true,checks},null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
