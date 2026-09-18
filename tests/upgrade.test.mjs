import test from 'node:test';
import assert from 'node:assert/strict';
import { choices, estimateSwap, financePlan } from '../commerce/upgrade-core.mjs';
import { calculatePlan } from '../easy-buy/easy-buy-core.mjs';
const current = choices.find(p => p.id === 'iphone-11|64GB');
const target = choices.find(p => p.id === 'iphone-13|128GB');
const base = { current, target, condition: 'good', battery: 'healthy' };
test('swap quote subtracts the high and low valuations in the correct order', () => {
  assert.deepEqual(estimateSwap(base), { manual: false, low: 126000, high: 149000, addLow: 231000, addHigh: 254000, excess: false });
});
test('battery degradation lowers trade-in value and increases top-up', () => {
  const healthy = estimateSwap(base), weak = estimateSwap({ ...base, battery: 'low' });
  assert.ok(weak.high < healthy.high); assert.ok(weak.addLow > healthy.addLow);
});
test('faults, locks, unknown health and unknown prices require manual quotes', () => {
  for (const extra of [{ issue: 'repaired' }, { unlocked: false }, { battery: 'unknown' }, { target: { ...target, price: null } }, { current: { ...current, price: null } }]) assert.deepEqual(estimateSwap({ ...base, ...extra }), { manual: true });
});
test('downgrades cannot produce negative top-ups', () => {
  const quote = estimateSwap({ ...base, current: target, target: current, condition: 'excellent' });
  assert.equal(quote.addLow,0); assert.equal(quote.addHigh,0); assert.equal(quote.excess,true);
});
test('unconfirmed anomalous price is not used in quotes', () => {
  assert.equal(choices.find(p => p.id === 'iphone-15-pro|512GB').price,null);
});
test('financing matches existing repository terms and includes the deposit in the full cost', () => {
  const plan = financePlan(current,3);
  assert.equal(plan.deposit,92000); assert.equal(plan.balanceRepayment,220800); assert.equal(plan.totalPayable,312800);
});
test('all eligible variants and frequencies reconcile rounded payments exactly', () => {
  for (const phone of choices.filter(p => p.finance && p.price)) for (const months of [1,2,3]) for (const freq of phone.series <= 12 ? ['monthly','weekly','biweekly'] : ['monthly']) {
    const plan = financePlan(phone,months,freq);
    assert.equal(plan.payments.reduce((a,b) => a+b,0),Math.round(plan.balanceRepayment));
    assert.equal(plan.totalPayable,plan.deposit + plan.payments.reduce((a,b) => a+b,0));
    assert.ok(plan.payments.every(value => Number.isInteger(value) && value > 0));
  }
});
test('invalid price, duration, frequency and deposits are rejected', () => {
  for (const change of [{ price:0 },{ price:NaN },{ duration:4 },{ depositRate:NaN },{ depositRate:-.1 },{ depositRate:1.1 },{ frequency:'daily' }]) assert.throws(() => calculatePlan({ price:230000, duration:1, series:11, ...change }));
  assert.throws(() => financePlan(target,1,'weekly'));
  assert.throws(() => financePlan(choices.find(p => p.brand === 'Samsung'),2));
});
