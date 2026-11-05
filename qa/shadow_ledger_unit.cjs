const fs = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports = {}) {
  const loaded = {exports:{}};
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(code,{module:loaded,exports:loaded.exports,require:name=>imports[name],BigInt,Object,JSON,Error},{filename:file}); return loaded.exports;
}
const policy=load('src/lib/commerce/assessment-policy.ts');
const m=load('src/lib/finance/journal.ts',{'@/lib/commerce/assessment-policy':policy});
let cases=0;
const base={priceIRR:1000000n,discountIRR:0n,commissionBasisPoints:2000,buyerWalletIRR:1000000n,creatorNetOpeningIRR:0n,payoutIRR:0n};
for (const price of [10n,100n,1000000n,12345678901234567890n]) for (const discountPct of [0n,25n,50n,100n]) for (const bps of [0,2000,10000]) for (const opening of [-2000000n,0n,2000000n]) {
 const discountIRR=price*discountPct/100n;
 const input={...base,priceIRR:price,discountIRR,commissionBasisPoints:bps,buyerWalletIRR:price,creatorNetOpeningIRR:opening};
 const result=m.simulateAssessmentSale(input);
 for(const stage of result.stages){const totals=m.assertJournal(stage.journal);assert.equal(totals.debitIRR,totals.creditIRR);for(const balance of Object.values(stage.book.balances)) assert.ok(balance>=0n);}
 const b=result.finalBook.balances;
 assert.equal(b.creator_available-b.creator_receivable,opening+result.quote.authorNetIRR);
 assert.equal(b.platform_revenue,result.quote.platformFeeIRR);assert.equal(b.creator_pending,0n);assert.equal(b.platform_deferred,0n);
 assert.equal(b.buyer_wallet,price-result.quote.payableIRR);
 const capture=result.stages.find(s=>s.kind==='capture'); const retried=m.applyShadowJournal(capture.book,capture.journal); assert.equal(retried,capture.book);
 cases++;
}
const free=m.simulateAssessmentSale({...base,discountIRR:1000000n});
assert.equal(free.finalBook.balances.creator_receivable,200000n);assert.equal(free.finalBook.balances.creator_available,0n);assert.equal(free.quote.payableIRR,0n);
const partial=m.simulateAssessmentSale({...base,discountIRR:1000000n,creatorNetOpeningIRR:500000n});assert.equal(partial.finalBook.balances.creator_available,300000n);assert.equal(partial.finalBook.balances.creator_receivable,0n);
const paid=m.simulateAssessmentSale({...base,payoutIRR:800000n});assert.equal(paid.finalBook.balances.creator_available,0n);assert.equal(paid.finalBook.balances.bank,200000n);
assert.throws(()=>m.applyShadowJournal(m.emptyBook(),paid.stages.find(s=>s.kind==='delivery').journal),/missing_prerequisite_event/);
assert.throws(()=>m.applyShadowJournal(paid.stages.find(s=>s.kind==='capture').book,paid.stages.find(s=>s.kind==='payout').journal),/negative_creator_available/);
assert.throws(()=>m.simulateAssessmentSale({...base,priceIRR:0n}),/invalid_price/);
assert.throws(()=>m.simulateAssessmentSale({...base,buyerWalletIRR:0n}),/buyer_wallet_insufficient/);
assert.throws(()=>m.simulateAssessmentSale({...base,payoutIRR:800001n}),/payout_exceeds_available/);
assert.throws(()=>m.simulateAssessmentSale({...base,priceIRR:11n,commissionBasisPoints:2000}),/commission_rounding_required/);
assert.equal(m.simulateAssessmentSale({...base,priceIRR:11n,rounding:'floor'}).quote.platformFeeIRR,2n);
assert.equal(m.simulateAssessmentSale({...base,priceIRR:11n,rounding:'ceil'}).quote.platformFeeIRR,3n);
const journal=paid.stages.find(s=>s.kind==='capture').journal;const old=paid.stages.find(s=>s.kind==='capture').book;
assert.throws(()=>m.applyShadowJournal(old,{...journal,description:'different payload'}),/idempotency_conflict/);
assert.throws(()=>m.applyShadowJournal(m.emptyBook(),{...journal,lines:[{account:'bank',side:'debit',amountIRR:2n},{account:'buyer_wallet',side:'credit',amountIRR:1n}]}),/unbalanced_journal/);
const empty=m.emptyBook();assert.ok(Object.isFrozen(empty));assert.ok(Object.isFrozen(empty.balances));assert.ok(Object.isFrozen(paid.finalBook.events));const bad={kind:'capture',eventKey:'bad:capture',sourceRef:'bad',currency:'IRR',description:'bad',lines:[{account:'buyer_wallet',side:'debit',amountIRR:1n},{account:'bank',side:'credit',amountIRR:1n}]};assert.throws(()=>m.applyShadowJournal(empty,bad),/negative_/);assert.equal(Object.keys(empty.events).length,0);
assert.equal(m.parseTomanInput('۰٫۱'),1n);assert.equal(m.parseTomanInput('-12.3',true),-123n);assert.equal(m.parseTomanInput('−۱۲٫۳',true),-123n);assert.equal(m.parseTomanInput('123456789012345678901234.5'),1234567890123456789012345n);
for (const value of ['1.01','1e8','-1','1,000','NaN','']) assert.throws(()=>m.parseTomanInput(value));
assert.equal(m.parseCommissionPercent('۲۰٫۵۵'),2055);for(const value of ['100.01','1.001','-1','NaN'])assert.throws(()=>m.parseCommissionPercent(value));
console.log(`PASS ${cases} sale scenarios + edge cases: balance, negative creator net, payout, explicit rounding, exact inputs, in-memory retry/conflict and atomic rejection. No database integration asserted.`);
