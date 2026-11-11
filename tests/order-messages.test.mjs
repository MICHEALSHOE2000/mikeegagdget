import test from 'node:test';
import assert from 'node:assert/strict';
import {financePlan} from '../commerce/upgrade-core.mjs';
import {financeMessage,outrightMessage} from '../commerce/order-messages.mjs';
const phone={slug:'iphone-11-pro',brand:'Apple',model:'iPhone 11 Pro',storage:'256GB',price:305000};
const customer={name:'Test Buyer',phone:'08012345678',method:'Delivery',state:'Lagos',address:'Test address'};
test('one-month brief example reconciles without a zero-fee line',()=>{
 const plan=financePlan({phone,amount:phone.price,duration:1});
 assert.equal(plan.deposit,152500);assert.equal(plan.balance,152500);assert.equal(plan.interest,30500);assert.equal(plan.repaymentTotal,183000);assert.equal(plan.totalPayable,335500);
 const message=financeMessage({phone,condition:'UK Used',plan,customer});
 for(const expected of ['Pay Now: ₦152,500','Pay Later: ₦183,000','Total Cost: ₦335,500','Payment 1 (Month 1): ₦183,000','Name: Test Buyer'])assert.ok(message.includes(expected));
 assert.doesNotMatch(message,/Processing Fee|balance financed/i);
});
test('flat interest and final installment rounding include upfront credit fees',()=>{
 for(const platform of ['standard','credit'])for(const duration of [1,2,3]){
  const plan=financePlan({phone,amount:305003,duration,platform,qualified:true});
  assert.equal(plan.payments.reduce((a,b)=>a+b,0),plan.repaymentTotal);
  assert.equal(plan.totalPayable,plan.dueUpfront+plan.repaymentTotal);
  assert.equal(plan.interest,Math.round(plan.balance*(1+plan.rate*duration))-plan.balance);
  const message=financeMessage({phone,condition:'UK Used',plan,customer});
  if(platform==='credit'){assert.match(message,/credit approval required/);assert.match(message,/Processing Fee \(paid upfront\): ₦5,000/);}
 }
});
test('outright orders show quantity and quoted delivery without financing or payment claims',()=>{
 const message=outrightMessage({phone,quantity:2,condition:'UK Used',customer,reference:'TEST'});
 assert.match(message,/Product Subtotal: ₦610,000/);assert.match(message,/total pending delivery quotation/);assert.match(message,/Address: Test address/);
 assert.doesNotMatch(message,/interest|deposit|financ|payment completed/i);
 assert.throws(()=>outrightMessage({phone,quantity:1.5,customer}),RangeError);
 assert.throws(()=>outrightMessage({phone,quantity:-1,customer}),RangeError);
});

test('catalogue starting deposit and shortcut match the lowest displayed price',async()=>{
 const {card}=await import('../assets/storefront-ui.mjs');
 const html=card({slug:'iphone-18-pro',model:'iPhone 18 Pro',category:'iphones',brand:'Apple',route:'/iphone-18-pro',conditions:['Brand New'],easy:true,variants:[{storage:'256GB · Burgundy',price:1970000},{storage:'256GB · Glacier',price:1920000}]});
 assert.match(html,/From ₦1,920,000/);assert.match(html,/₦1,344,000 deposit/);assert.match(html,/phone=iphone-18-pro%7C256GB%20%C2%B7%20Glacier/);
});
