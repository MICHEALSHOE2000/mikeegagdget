import test from 'node:test';
import assert from 'node:assert/strict';
import {products} from '../commerce/catalog.mjs';
import {choices,estimateSwap,financePlan} from '../commerce/upgrade-core.mjs';
import {offerProduct,promotion,HOT_DEALS_LIMIT,featuredDeals} from '../commerce/offers.mjs';
import {storeItems} from '../commerce/storefront-data.mjs';
import {readFile} from 'node:fs/promises';
import {minimumDeposit} from '../easy-buy/easy-buy-core.mjs';
import {retailInventory} from '../commerce/retail-inventory.mjs';

test('retail selling prices stay final across product, store and calculator data',async()=>{
 assert.deepEqual(promotion.models,[]);
 assert.equal(HOT_DEALS_LIMIT,5);
 assert.deepEqual(featuredDeals(storeItems),[]);
 for(const base of products){
  assert.ok(base.variants.length>0);
  const display=offerProduct(base),item=storeItems.find(p=>p.slug===base.slug);
  assert.ok(item);
  for(const v of base.variants){
   const p=display.variants.find(option=>option.storage===v.storage);
   const store=item.variants.find(option=>option.storage===v.storage);
   const choice=choices.find(option=>option.id===`${base.slug}|${v.storage}`);
   assert.equal(p.price,v.price);
   assert.equal(store.price,v.price);
   assert.equal(choice.price,v.price);
   if(v.price!==null)assert.equal(choice.swapReferencePrice,v.price);
   assert.equal(Object.hasOwn(v,'basePrice'),false);
   assert.equal(Object.hasOwn(v,'sellingPrice'),false);
  }
 }
 const serialized=JSON.stringify({products,storeItems,choices});
 assert.doesNotMatch(serialized,/"(?:supplierPrice|supplierCost|basePrice|markup|profit|sellingPrice)"/i);
 const publicCatalog=JSON.parse(await readFile('assets/store-catalog.json','utf8'));
 assert.equal(publicCatalog.length,retailInventory.length);
 assert.doesNotMatch(JSON.stringify(publicCatalog),/"(?:supplierPrice|supplierCost|basePrice|markup|profit|sellingPrice)"/i);
 const legacy=choices.find(phone=>phone.id==='iphone-x|64GB');
 assert.equal(legacy.forSale,false);assert.equal(legacy.price,null);assert.equal(legacy.swapReferencePrice,147000);
 assert.ok(legacy.swapReferencePrice>0);
});
test('Easy Buy and Swap continue to use final listed target prices',()=>{
 const target=choices.find(p=>p.id==='iphone-18-pro|256GB · Burgundy');
 const plan=financePlan({amount:target.price,duration:3,phone:target});
 assert.equal(plan.deposit,Math.round(target.price*.7));
 assert.equal(plan.totalPayable,plan.deposit+plan.repaymentTotal+plan.processingFee);
 const old=choices.find(p=>p.id==='iphone-x|64GB');
 const swap=estimateSwap({current:old,target});
 assert.equal(swap.value,Math.round(old.swapReferencePrice*.6));
 assert.equal(swap.topUp,target.price-swap.value);
});
test('homepage keeps its buying and enquiry routes without applying stale discounts',async()=>{
 const html=await readFile('index.html','utf8');
 assert.ok(html.indexOf('hot-deals')<html.indexOf('id="categories"'));
 assert.ok(html.includes('data-model="iphone-18-pro-max"'));
 assert.match(html,/Contact Mikee to ask about current offers/);
 for(const route of ['easybuy','swap','deals','iphone-14-pro-max','iphone-13','pixel-11','samsung-s23']){
  const page=await readFile(`${route}/index.html`,'utf8');
  assert.ok(page.includes('<h1>'),route);
  assert.ok(page.includes('/assets/sales.js'),route);
 }
});
