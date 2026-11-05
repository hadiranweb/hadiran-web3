const fs = require('node:fs'), assert = require('node:assert/strict'), vm = require('node:vm'), ts = require('typescript');
require.extensions['.ts'] = (loaded, file) => loaded._compile(ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const policy = require('../src/lib/commerce/assessment-policy.ts'), m = require('../src/lib/finance/tariffs.ts');
const draft = () => ({...m.emptyPlanDraft(),rounding:'floor',tariffs:[{key:'assessment.interpretation.commission',label:'کارمزد تفسیر',payer:'creator',enabled:true,mode:'percentage',basisPoints:2000,basis:'pre_discount'}]});
let cases = 0;
for (const price of [0n,1n,5n,11n,101n,999999999999999999999999999999n]) for (const bps of [0,1,150,2000,5000,9999,10000]) for (const rounding of ['floor','ceil','half_up']) {
  const value = policy.calculateCommissionFee(price,bps,rounding), numerator=price*BigInt(bps), quotient=numerator/10000n,remainder=numerator%10000n;
  const expected=quotient+(rounding==='ceil'?(remainder?1n:0n):rounding==='half_up'?(remainder*2n>=10000n?1n:0n):0n);
  assert.equal(value,expected); assert.ok(value>=0n&&value<=price); cases++;
}
assert.equal(policy.calculateCommissionFee(5n,1000,'half_up'),1n); assert.equal(policy.calculateCommissionFee(4n,1000,'half_up'),0n);
assert.throws(()=>policy.calculateCommissionFee(1n,1,'reject_fraction'),/rounding_required/);
assert.throws(()=>policy.calculateCommissionFee(1n,1),/rounding_required/);
for(const bps of [NaN,Infinity,-1,0.1,10001]) assert.throws(()=>policy.calculateCommissionFee(100n,bps,'floor'));
const plan = draft(); assert.equal(m.quoteConfiguredTariff(plan,plan.tariffs[0].key,101n).amountIRR,20n);
for (const rounding of policy.FEE_ROUNDING_MODES) assert.equal(m.normalizePlanDraft({...draft(),rounding}).rounding,rounding);
assert.throws(()=>m.quoteConfiguredTariff(plan,'missing.service',100n),/tariff_not_configured/);
assert.throws(()=>m.quoteConfiguredTariff({...plan,tariffs:[{...plan.tariffs[0],enabled:false}]},plan.tariffs[0].key,100n),/tariff_disabled/);
assert.throws(()=>m.quoteConfiguredTariff(plan,plan.tariffs[0].key),/pre_discount_basis_required/);
const free={key:'future.service',label:'خدمت آینده',payer:'creator',enabled:true,mode:'free'};
assert.equal(m.quoteConfiguredTariff({...plan,tariffs:[free]},free.key).amountIRR,0n);
const fixed={...free,mode:'fixed',amountIRR:'999999999999999999999999999999'};
assert.equal(m.quoteConfiguredTariff({...plan,tariffs:[fixed]},fixed.key).amountIRR,999999999999999999999999999999n);
assert.equal(m.serializePlanDraft({...plan,tariffs:[free,...plan.tariffs]}),m.serializePlanDraft({...plan,tariffs:[...plan.tariffs,free]}));
assert.equal(m.emptyPlanDraft().tariffs.length,0);
for (const key of ['__proto__','Upper','bad key','x/'.repeat(50),'x\n','']) assert.throws(()=>m.normalizePlanDraft({...plan,key}));
for (const patch of [{currency:'IRT'},{rounding:undefined},{refundPolicy:'after_delivery'},{tariffs:[free,free]},{extra:1},{tariffs:Array(201).fill(free)}]) assert.throws(()=>m.normalizePlanDraft({...plan,...patch}));
for(const amountIRR of [null,1,1.1,'01','-1','1.1','1e5','9'.repeat(31)]) assert.throws(()=>m.normalizePlanDraft({...plan,tariffs:[{...fixed,amountIRR}]}));
for(const patch of [{basisPoints:1.1},{basis:'after_discount'},{enabled:'true'},{payer:'unknown'},{hiddenFee:1}]) assert.throws(()=>m.normalizePlanDraft({...plan,tariffs:[{...plan.tariffs[0],...patch}]}));
const discounted=policy.quoteAssessmentSale({priceIRR:101n,discountIRR:101n,commissionBasisPoints:5000,rounding:'half_up'});
assert.equal(discounted.platformFeeIRR,51n);assert.equal(discounted.payableIRR,0n);assert.equal(discounted.authorNetIRR,-51n);

function load(file,imports,globals={}) {
  const loaded={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{module:loaded,exports:loaded.exports,require:name=>imports[name],...globals},{filename:file});return loaded.exports;
}
async function storeTests() {
  const crypto=require('node:crypto');
  function mock(options={}) {
    const queries=[]; let released=false, connections=0;
    const client={async query(sql,params){queries.push(sql);
      if(sql.startsWith('SELECT id')) return {rows:options.forbidden?[]:[{id:1}],rowCount:options.forbidden?0:1};
      if(sql.startsWith('SELECT version')) return {rows:[{version:options.headVersion??0}]};
      if(sql.startsWith('INSERT INTO finance_plan_revisions')) {
        if(options.failInsert) throw new Error('injected_failure');
        return {rows:[{config:JSON.parse(params[2]),version:params[1],digest:params[3],created_at:new Date('2026-10-21T00:00:00Z')}]};
      }
      if(sql.startsWith('SELECT r.config')) return {rows:[]};
      return {rows:[],rowCount:1};
    },release(){released=true;}};
    const store=load('src/lib/finance/plan-store.ts',{'node:crypto':crypto,'@/db':{pool:{async connect(){connections++;return client;}},hasDatabaseUrl:()=>!options.noDatabase},'./tariffs':m},{process:{env:{HADIRAN_FINANCE_CONFIG_WRITES:options.disabled?'0':'1'}}});
    return {store,queries,get released(){return released;},get connections(){return connections;}};
  }
  const ok=mock(),saved=await ok.store.saveFinancePlan(1,0,draft());assert.equal(saved.version,1);assert.equal(saved.digest,crypto.createHash('sha256').update(m.serializePlanDraft(draft())).digest('hex'));assert.equal(ok.queries.at(-1),'COMMIT');assert.ok(ok.released);assert.ok(ok.queries.some(q=>q.includes('FOR UPDATE')));assert.ok(ok.queries.some(q=>q.includes("role='owner'")));
  for(const [options,error] of [[{forbidden:true},/forbidden/],[{headVersion:1},/version_conflict/],[{failInsert:true},/injected_failure/]]) {const fail=mock(options);await assert.rejects(()=>fail.store.saveFinancePlan(1,0,draft()),error);assert.equal(fail.queries.at(-1),'ROLLBACK');assert.ok(!fail.queries.includes('COMMIT'));assert.ok(fail.released);}
  for(const options of [{disabled:true},{noDatabase:true}]) {const fail=mock(options);await assert.rejects(()=>fail.store.saveFinancePlan(1,0,draft()));assert.equal(fail.connections,0);}
  const invalid=mock();await assert.rejects(()=>invalid.store.saveFinancePlan(0,0,draft()),/forbidden/);await assert.rejects(()=>invalid.store.saveFinancePlan(1,-1,draft()),/expected_version/);assert.equal(invalid.connections,0);
  assert.deepEqual(JSON.parse(JSON.stringify(await ok.store.listFinancePlans(1))),[]);
}
async function routeTests() {
  let calls=0;
  const auth={account:{id:1,role:'owner'},error:null};
  const route=load('src/app/api/workspace/finance/plans/route.ts',{
    'next/server':{NextResponse:{json:(body,init)=>new Response(JSON.stringify(body),init)}},
    '@/lib/auth/guard':{requireOwner:async()=>auth},'@/lib/finance/plan-store':{saveFinancePlan:async()=>{calls++;return {version:1};},listFinancePlans:async()=>[]},'@/lib/finance/tariffs':m,
  },{URL,TextDecoder,Uint8Array});
  const make=(headers={},body='{}')=>new Request('https://site.example/api/workspace/finance/plans',{method:'POST',headers:{origin:'https://site.example','content-type':'application/json',...headers},body});
  assert.equal((await route.POST(make({origin:'https://evil.example'}))).status,403);
  assert.equal((await route.POST(make({'content-type':'text/plain'}))).status,415);
  assert.equal((await route.POST(make({},'x'.repeat(100001)))).status,413);
  assert.equal((await route.POST(make({},'{broken'))).status,400);
  assert.equal((await route.POST(make({},'{"actorId":123}'))).status,400);
  assert.equal(calls,0);
  assert.equal((await route.POST(make({},JSON.stringify({expectedVersion:0,config:draft()})))).status,201);assert.equal(calls,1);
  auth.account.id=0;assert.equal((await route.POST(make())).status,503);assert.equal((await route.GET()).status,503);assert.equal(calls,1);
  auth.error=new Response(null,{status:403});assert.equal((await route.GET()).status,403);assert.equal((await route.POST(make())).status,403);
}
(async()=>{await storeTests();await routeTests();console.log(`PASS ${cases} exact fee scenarios plus tariff validation, snapshots, coupon debt, mocked transaction rollback/version/owner/write gate and route origin/body/auth checks. PostgreSQL concurrency and migration NOT tested.`);})().catch(error=>{console.error(error);process.exitCode=1;});
