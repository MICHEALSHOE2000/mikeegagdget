import test from 'node:test';
import assert from 'node:assert/strict';
import { choices, estimateSwap, financePlan } from '../commerce/upgrade-core.mjs';
import {suitableCurrentPhone} from '../commerce/device-hierarchy.mjs';
import {minimumDeposit} from '../easy-buy/easy-buy-core.mjs';
const phone = id => choices.find(p => p.id === id);
const current = phone('iphone-x|64GB'), target = phone('iphone-14-pro-max|256GB');
const base = {current,target};

test('swap deductions are cumulative and use the customer-visible reference every time', () => {
  const reference=current.swapReferencePrice;
  const cases = [[{},40],[{screenChanged:true},50],[{screenChanged:true,batteryChanged:true},55],[{screenChanged:true,batteryChanged:true,backChanged:true},57],[{screenChanged:true,batteryChanged:true,backChanged:true,faceIdBroken:true},65]];
  for (const [changes,deductionPercent] of cases) {
    const quote = estimateSwap({...base,...changes});
    assert.equal(quote.deductionPercent,deductionPercent);
    assert.equal(quote.value,Math.round(reference*(100-deductionPercent)/100));
    assert.equal(quote.topUp,target.price-quote.value);
  }
});
test('models without Face ID or glass backs never receive those deductions', () => {
  const old={brand:'Apple',slug:'iphone-7',swapReferencePrice:100000,hasFaceId:false,hasGlassBack:false};
  assert.equal(estimateSwap({current:old,target,faceIdBroken:true}).value,60000);
  assert.equal(estimateSwap({current:old,target,backChanged:true}).value,60000);
  assert.equal(estimateSwap({...base,backChanged:true}).value,Math.round(current.swapReferencePrice*.58));
});
test('cracks share one deduction with changed parts; missing prices require a quote', () => {
  assert.equal(estimateSwap({...base,screenCracked:true,screenChanged:true,backCracked:true,backChanged:true}).value,Math.round(current.swapReferencePrice*.48));
  assert.equal(estimateSwap({...base,screenCracked:true}).value,Math.round(current.swapReferencePrice*.5));
  assert.equal(estimateSwap({...base,target:phone('iphone-15-pro-uk-used|256GB')}).manual,true);
  assert.equal(estimateSwap({...base,target:phone('samsung-s23|128GB')}).manual,true);
});
test('a higher-value trade-in shows zero top-up and a separately agreed surplus', () => {
  const old=phone('iphone-17-pro-max|512GB');
  const q=estimateSwap({current:old,target:phone('iphone-14-pro-max|256GB')});
  assert.equal(q.topUp,0);assert.equal(q.surplus,Math.max(0,Math.round(old.swapReferencePrice*.6)-phone('iphone-14-pro-max|256GB').price));
});
test('standard Apple and non-Apple plans calculate interest on the remaining balance', () => {
  const apple=financePlan({amount:140000,phone:{slug:'iphone-11',brand:'Apple'},duration:1});
  assert.equal(apple.deposit,70000);assert.equal(apple.balance,70000);assert.equal(apple.interest,14000);assert.equal(apple.totalPayable,154000);
  const other=financePlan({amount:140000,phone:{brand:'Google',slug:'pixel-8'},duration:3});
  assert.equal(other.deposit,56000);assert.equal(other.balance,84000);assert.equal(other.interest,18900);assert.equal(other.totalPayable,163900);
});
test('Apple defaults to 20%; the lower 7.5% plan requires qualification',()=>{
 const apple={brand:'Apple',slug:'iphone-13'};
 const standard=financePlan({amount:500000,phone:apple,duration:2});
 assert.equal(standard.platform,'standard');assert.equal(standard.rate,.2);assert.equal(standard.deposit,300000);assert.equal(standard.balance,200000);assert.equal(standard.interest,80000);
 assert.throws(()=>financePlan({amount:500000,phone:apple,duration:2,platform:'credit'}),/credit check and approval/);
 const approved=financePlan({amount:500000,phone:apple,duration:2,platform:'credit',qualified:true});
 assert.equal(approved.rate,.075);assert.equal(approved.interest,30000);assert.equal(approved.processingFee,5000);
});
test('current-phone choices follow generation and tier, independent of price and storage',()=>{
 const example=slug=>({slug,brand:'Apple',price:1});
 const target=example('iphone-12-pro-max');
 for(const slug of ['iphone-x','iphone-11-pro-max','iphone-12-pro-max','iphone-13-pro-max'])assert.equal(suitableCurrentPhone(example(slug),target),true,slug);
 for(const slug of ['iphone-14','iphone-15-pro-max','iphone-16-pro-max','iphone-17-pro-max','iphone-18-pro-max'])assert.equal(suitableCurrentPhone(example(slug),target),false,slug);
 assert.equal(suitableCurrentPhone(example('iphone-13-pro-max'),example('iphone-12')),false);
 assert.equal(suitableCurrentPhone({slug:'samsung-s25-ultra',brand:'Samsung'},{slug:'samsung-s23-ultra',brand:'Samsung'}),false);
 assert.equal(suitableCurrentPhone({slug:'pixel-9-pro',brand:'Google'},{slug:'pixel-7-pro',brand:'Google'}),false);
});
test('swap credit comes off before the deposit and financing interest', () => {
  const swap=estimateSwap(base);
  const plan=financePlan({amount:swap.topUp,phone:target,duration:3});
  assert.equal(plan.deposit,minimumDeposit(swap.topUp,target));
  assert.equal(plan.balance,swap.topUp-plan.deposit);
});
test('rounded schedules reconcile for every priced sale variant, duration and platform', () => {
  for(const p of choices.filter(p=>p.forSale!==false&&p.price)) for(const duration of [1,2,3]) {
    const plan=financePlan({amount:p.price,phone:p,duration});
    assert.equal(plan.payments.reduce((a,b)=>a+b,0),plan.repaymentTotal);
    assert.equal(plan.totalPayable,plan.deposit+plan.repaymentTotal+plan.processingFee);
    if(p.brand!=='Apple')assert.ok(plan.balance<=250000);
    assert.ok(plan.payments.every(Number.isInteger));
  }
});
test('invalid inputs are rejected and full upfront deposits carry no interest', () => {
  for(const changes of [{amount:NaN},{amount:-1},{duration:7},{platform:'unknown'},{deposit:0},{deposit:NaN},{deposit:-5},{deposit:999999},{deposit:60000.1}]) assert.throws(()=>financePlan({amount:140000,...changes}));
  assert.equal(financePlan({amount:140000,deposit:140000}).interest,0);
  for(const [amount,required] of [[150000,60000],[300000,120000],[500000,250000],[1000000,750000]]) {
    assert.equal(minimumDeposit(amount),required);
    assert.equal(financePlan({amount}).deposit,required);
    assert.throws(()=>financePlan({amount,deposit:required-1}));
  }
});
