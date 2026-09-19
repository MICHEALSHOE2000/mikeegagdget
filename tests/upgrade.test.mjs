import test from 'node:test';
import assert from 'node:assert/strict';
import { choices, estimateSwap, financePlan } from '../commerce/upgrade-core.mjs';
import { priceList } from '../commerce/price-list.mjs';
const phone = id => choices.find(p => p.id === id);
const current = phone('iphone-x|64GB'), target = phone('iphone-11|64GB');
const base = {current,target};
test('the merchant’s cumulative deductions use the original price every time', () => {
  const cases = [[{},84000,40],[{screenChanged:true},70000,50],[{screenChanged:true,batteryChanged:true},63000,55],[{screenChanged:true,batteryChanged:true,backChanged:true},60200,57],[{screenChanged:true,batteryChanged:true,backChanged:true,faceIdBroken:true},49000,65]];
  for (const [changes,value,deductionPercent] of cases) {
    const quote = estimateSwap({...base,...changes}); assert.equal(quote.value,value); assert.equal(quote.deductionPercent,deductionPercent); assert.equal(quote.topUp,target.price-value);
  }
});
test('phones without Face ID or glass backs never receive those deductions', () => {
  for(const id of ['iphone-6|16GB','iphone-7|32GB','iphone-8|64GB','iphone-se-2|64GB']) {
    const p=phone(id); assert.equal(estimateSwap({current:p,target,faceIdBroken:true}).value,p.basePrice*.6);
  }
  assert.equal(estimateSwap({current:phone('iphone-6|16GB'),target,backChanged:true}).value,15000);
  assert.equal(estimateSwap({...base,backChanged:true}).value,81200);
});
test('cracks share one deduction with changed parts; missing prices require a quote', () => {
  assert.equal(estimateSwap({...base,screenCracked:true,screenChanged:true,backCracked:true,backChanged:true}).value,67200);
  assert.equal(estimateSwap({...base,screenCracked:true}).value,70000);
  assert.equal(estimateSwap({...base,current:phone('iphone-13-pro-max|128GB')}).manual,true);
  assert.equal(estimateSwap({...base,target:phone('samsung-s23|128GB')}).manual,true);
});
test('a higher-value trade-in shows zero top-up and a separately agreed surplus', () => {
  const q=estimateSwap({current:phone('iphone-17-pro-max|512GB'),target:current});
  assert.equal(q.topUp,0); assert.equal(q.surplus,951000);
});
test('both financing options charge interest on the balance after the deposit', () => {
  const credit=financePlan({amount:140000,platform:'credit',duration:1});
  assert.equal(credit.deposit,56000); assert.equal(credit.balance,84000); assert.equal(credit.interest,6300); assert.equal(credit.totalPayable,146300);
  const noCredit=financePlan({amount:140000,platform:'noCredit',duration:3});
  assert.equal(noCredit.interest,50400); assert.equal(noCredit.totalPayable,190400);
});
test('swap credit comes off before the deposit and financing interest', () => {
  const swap=estimateSwap(base); assert.equal(swap.topUp,136500);
  const plan=financePlan({amount:swap.topUp,platform:'credit',duration:3});
  assert.equal(plan.deposit,54600); assert.equal(plan.balance,81900); assert.equal(plan.interest,18428); assert.equal(plan.totalPayable,154928);
});
test('rounded schedules reconcile for every priced variant, duration and platform', () => {
  for(const p of choices.filter(p=>p.price)) for(const duration of [1,2,3]) for(const platform of ['credit','noCredit']) {
    const plan=financePlan({amount:p.price,duration,platform});
    assert.equal(plan.payments.reduce((a,b)=>a+b,0),plan.repaymentTotal);
    assert.equal(plan.totalPayable,plan.deposit+plan.repaymentTotal);
    assert.ok(plan.payments.every(Number.isInteger));
  }
});
test('invalid inputs are rejected and a full upfront deposit has zero interest', () => {
  for(const changes of [{amount:NaN},{amount:-1},{duration:4},{platform:'unknown'},{deposit:0},{deposit:NaN},{deposit:-5},{deposit:999999},{deposit:60000.1}]) assert.throws(()=>financePlan({amount:140000,...changes}));
  assert.equal(financePlan({amount:140000,deposit:140000}).interest,0);
});
test('supplied price corrections, old phones and colour groups are preserved', () => {
  const checks={'iphone-6|16GB':25000,'iphone-6|128GB':38000,'iphone-6s-plus|128GB':75000,'iphone-7-plus|256GB':103000,'iphone-xs-max|64GB':198000,'iphone-x|64GB':140000,'iphone-11|64GB':210000,'iphone-12-pro-max|128GB':435000,'iphone-13|256GB — Pink / White':400000,'iphone-13|256GB — Other colours':390000,'iphone-14-plus|256GB':520000,'iphone-15-plus|512GB':715000,'iphone-15-pro|256GB':860000,'iphone-16-pro|128GB':1020000,'iphone-17-air|1TB':1260000,'iphone-17-pro-max|512GB':1830000};
  for(const [id,value] of Object.entries(checks)) assert.equal(phone(id)?.basePrice,value,id);
  assert.equal(priceList.length,36); assert.equal(phone('iphone-15-pro|512GB'),undefined);
  assert.equal(new Set(choices.map(p=>p.id)).size,choices.length);
});

test('all supplied prices receive exactly five percent selling markup',()=>{ for(const p of choices.filter(p=>p.basePrice)) assert.equal(p.price,Math.round(p.basePrice*1.05)); assert.equal(current.price,147000); assert.equal(phone('iphone-15-pro-max|256GB').price,1039500); });
