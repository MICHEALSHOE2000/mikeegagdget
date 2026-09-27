import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {products} from '../commerce/catalog.mjs';
import {storeItems} from '../commerce/storefront-data.mjs';
import {choices,financePlan,estimateSwap} from '../commerce/upgrade-core.mjs';
import {calculatePlan} from '../easy-buy/easy-buy-core.mjs';

test('the supplied shop image replaces the illustration with responsive lightweight assets',async()=>{
 const html=await readFile('index.html','utf8');
 assert.ok(!html.includes('{{'),'No unresolved homepage template tokens');
 assert.match(html,/mikee-shop-720\.webp 720w, \/images\/store\/mikee-shop-1280\.webp 1280w/);
 assert.match(html,/loading="lazy" decoding="async" alt="Mikee Gadget Plug shop image supplied by the store"/);
 assert.doesNotMatch(html,/shop-illustration|Illustrative gadget shop/);
 for(const width of [720,1280])assert.ok((await stat(`images/store/mikee-shop-${width}.webp`)).size<1_000_000);
 assert.match(html,/1 Ola Ayeni Street/);
 assert.match(html,/Computer Village, Ikeja/);
 assert.doesNotMatch(html,/shop-concept|Store concept illustration/);
});

test('new merchant prices reach catalogue, product pages and calculator choices exactly',async()=>{
 const expected={
  'iphone-18-pro':{'256GB — Glacier / Black':2450000,'256GB — Burgundy':2490000},
  'iphone-18-pro-max':{'256GB — Glacier / Black':2780000,'256GB — Burgundy':2850000,'512GB — Glacier / Black':3100000,'512GB — Burgundy':3150000}
 };
 for(const [slug,variants] of Object.entries(expected)){
  const product=products.find(p=>p.slug===slug),item=storeItems.find(p=>p.slug===slug);
  assert.ok(product.images[0]);assert.equal(product.listingPending,false);assert.equal(product.easyBuyEligible,true);
  const html=await readFile(`${slug}/index.html`,'utf8');
  for(const [storage,price] of Object.entries(variants)){
   assert.equal(product.variants.find(v=>v.storage===storage).price,price);
   const dealPrice=Math.round(price*.92);
   assert.equal(item.variants.find(v=>v.storage===storage).price,dealPrice);
   const phone=choices.find(p=>p.id===`${slug}|${storage}`);assert.equal(phone.price,price);
   assert.ok(html.includes(dealPrice.toLocaleString('en-NG')));
   const swap=estimateSwap({current:choices.find(p=>p.id==='iphone-x|64GB'),target:{...phone,price:dealPrice}});
   assert.equal(swap.topUp,dealPrice-84000);
  }
 }
});
test('six month plans use simple monthly interest on the post-deposit balance',()=>{
 for(const [platform,interest,total,monthly] of [['credit',13500,113500,7250],['noCredit',36000,136000,11000]]){
  const plan=financePlan({amount:100000,phone:{slug:'iphone-18-pro-max'},duration:6,platform});
  assert.equal(plan.deposit,70000);assert.equal(plan.interest,interest);assert.equal(plan.totalPayable,total);
  assert.deepEqual(plan.payments,Array(6).fill(monthly));
  const legacy=calculatePlan({price:100000,duration:6,platform,series:18});
  assert.equal(Math.round(legacy.additionalCost),interest);assert.equal(Math.round(legacy.installment),monthly);
 }
 for(const duration of [0,7,1.5,NaN])assert.throws(()=>financePlan({amount:100000,duration}));
});
