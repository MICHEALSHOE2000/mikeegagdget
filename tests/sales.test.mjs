import test from 'node:test';
import assert from 'node:assert/strict';
import {products} from '../commerce/catalog.mjs';
import {choices,estimateSwap,financePlan} from '../commerce/upgrade-core.mjs';
import {offerProduct,offerChoice,isComplete,promotion} from '../commerce/offers.mjs';
import {storeItems} from '../commerce/storefront-data.mjs';
import {readFile} from 'node:fs/promises';
test('20% offers agree across products, catalogue and finance without changing valuation references',()=>{
 for(const slug of promotion.models){const base=products.find(p=>p.slug===slug);assert.ok(isComplete(base));const display=offerProduct(base),item=storeItems.find(p=>p.slug===slug);
  for(const v of base.variants.filter(v=>v.price)){const p=display.variants.find(p=>p.storage===v.storage),choice=offerChoice(choices.find(p=>p.id===`${slug}|${v.storage}`));assert.equal(p.price,Math.round(v.price*.8));assert.equal(choice.price,p.price);assert.equal(item.variants.find(p=>p.storage===v.storage).price,p.price);assert.equal(choice.basePrice,v.basePrice);
  const plan=financePlan({amount:p.price,duration:3});assert.equal(plan.deposit,Math.round(p.price*.4));assert.equal(plan.totalPayable,plan.deposit+plan.payments.reduce((a,b)=>a+b,0));
  const swap=estimateSwap({current:choices.find(p=>p.id==='iphone-x|64GB'),target:choice});assert.equal(swap.value,84000);assert.equal(swap.topUp,Math.max(0,p.price-84000));}
 }
});
test('homepage leads with complete models and keeps all direct landing routes',async()=>{
 const html=await readFile('index.html','utf8');assert.ok(html.indexOf('hot-deals')<html.indexOf('id="categories"'));assert.ok(html.includes('data-model="iphone-18-pro-max"'));
 for(const route of ['easybuy','swap','deals','iphone-14-pro-max','iphone-13-pro-max']){const page=await readFile(`${route}/index.html`,'utf8');assert.ok(page.includes('<h1>'));assert.ok(page.includes('/assets/sales.js'));}
});
