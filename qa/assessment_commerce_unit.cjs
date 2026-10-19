const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const {quoteAssessmentSale:q,assertCreatorCoupon,ASSESSMENT_SERVICES}=require('../src/lib/commerce/assessment-policy.ts');
const checks=[];const pass=s=>{checks.push(s);console.log('PASS',s)};
const normal=q({priceIRR:1000000n,discountIRR:0n,commissionBasisPoints:2000});
assert.equal(normal.payableIRR,1000000n);assert.equal(normal.platformFeeIRR,200000n);assert.equal(normal.authorNetIRR,800000n);
pass('Commission is based on original price, before discount');
const half=q({priceIRR:1000000n,discountIRR:500000n,commissionBasisPoints:2000});
assert.equal(half.payableIRR,500000n);assert.equal(half.platformFeeIRR,200000n);assert.equal(half.authorNetIRR,300000n);
pass('Partial discount is charged to creator, without reducing the base commission');
const free=q({priceIRR:1000000n,discountIRR:1000000n,commissionBasisPoints:2000});
assert.equal(free.payableIRR,0n);assert.equal(free.authorCreditBeforeDiscountIRR,800000n);assert.equal(free.creatorDiscountDebitIRR,1000000n);assert.equal(free.authorNetIRR,-200000n);
pass('100 percent creator coupon leaves buyer at zero and permits signed author debt');
for(const rate of [0,10000]){const x=q({priceIRR:1000000n,discountIRR:1000000n,commissionBasisPoints:rate});assert.equal(x.authorNetIRR,-x.platformFeeIRR)}
pass('Explicit zero/full commission remain balanced with a free purchase');
assert.throws(()=>q({priceIRR:101n,discountIRR:0n,commissionBasisPoints:2000}),/commission_rounding_required/);
assert.equal(q({priceIRR:101n,discountIRR:0n,commissionBasisPoints:2000,rounding:'floor'}).platformFeeIRR,20n);
assert.equal(q({priceIRR:101n,discountIRR:0n,commissionBasisPoints:2000,rounding:'ceil'}).platformFeeIRR,21n);
pass('Fractional rial commission has no implicit rounding; explicit alternatives are exact');
let cases=0;
for(const priceIRR of [1n,2n,9n,11n,999n,1000001n,90071992547409931n,2n**100n]){
 for(const commissionBasisPoints of [0,1,1234,2000,9999,10000]){
  for(const discountIRR of [0n,priceIRR/2n,priceIRR]){
   for(const rounding of ['floor','ceil']){
    const x=q({priceIRR,discountIRR,commissionBasisPoints,rounding});
    assert.equal(x.platformFeeIRR+x.authorNetIRR,x.payableIRR);
    assert.equal(x.authorCreditBeforeDiscountIRR-x.creatorDiscountDebitIRR,x.authorNetIRR);
    assert(x.platformFeeIRR>=0n && x.platformFeeIRR<=priceIRR);
    if(discountIRR===0n)assert(x.authorNetIRR>=0n);
    cases++;
   }
  }
 }
}
pass('288 exact conservation cases, including values above safe Number and both explicit rounding modes');
for(const input of [{priceIRR:0n},{priceIRR:-1n},{priceIRR:100},{discountIRR:-1n},{discountIRR:101n},{discountIRR:10},{commissionBasisPoints:-1},{commissionBasisPoints:10001},{commissionBasisPoints:0.1},{commissionBasisPoints:NaN},{rounding:'other'}])assert.throws(()=>q({priceIRR:100n,discountIRR:0n,commissionBasisPoints:2000,...input}));
pass('Rejects invalid prices/discounts, floating money and unconfigured or invalid commission');
const binding={productId:'assessment-a:interpretation',productCreatorId:7,couponProductId:'assessment-a:interpretation',couponIssuerId:7};
assertCreatorCoupon(binding);
for(const change of [{couponProductId:'assessment-a:document'},{couponProductId:'assessment-b:interpretation'},{couponIssuerId:8},{productCreatorId:0,couponIssuerId:0}])assert.throws(()=>assertCreatorCoupon({...binding,...change}));
assert.deepEqual(ASSESSMENT_SERVICES,['interpretation','document']);
pass('Coupon must bind the exact service product and its creator; authorization still requires trusted server rows');
fs.writeFileSync('qa/assessment-commerce-unit-results.json',JSON.stringify({passed:true,checks,conservationCases:cases,scope:'Pure policy only; no API, wallet ledger, fulfillment, payment or balance mutation implemented'},null,2));
