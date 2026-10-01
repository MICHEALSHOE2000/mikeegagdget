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

test('Group 1 final prices reach product pages, cards and calculator choices unchanged',async()=>{
 const expected={
  'iphone-18-pro':{'256GB · Burgundy':1970000,'256GB · Glacier':1920000,'512GB':2290000},
  'iphone-18-pro-max':{'256GB · Burgundy':2540000,'256GB · Silver/Blue':2340000,'512GB · Burgundy':2690000,'512GB · Glacier':2590000,'1TB':3590000}
 };
 for(const [slug,variants] of Object.entries(expected)){
  const product=products.find(p=>p.slug===slug),item=storeItems.find(p=>p.slug===slug);
  assert.deepEqual(product.conditions,['Brand New']);
  assert.ok(product.images[0]);assert.equal(product.listingPending,false);assert.equal(product.easyBuyEligible,true);
  const html=await readFile(`${slug}/index.html`,'utf8');
  for(const [storage,price] of Object.entries(variants)){
   assert.equal(product.variants.find(v=>v.storage===storage).price,price);
   assert.equal(item.variants.find(v=>v.storage===storage).price,price);
   const phone=choices.find(p=>p.id===`${slug}|${storage}`);
   assert.equal(phone.price,price);
   assert.ok(html.includes(price.toLocaleString('en-NG')));
   const swap=estimateSwap({current:{brand:'Apple',swapReferencePrice:100000,hasFaceId:true,hasGlassBack:true},target:phone});
   assert.equal(swap.topUp,price-60000);
  }
 }
});
test('three-month standard and approved plans share the same down-payment policy',()=>{
 const phone={slug:'iphone-18-pro',brand:'Apple'};
 const standard=financePlan({amount:100000,duration:3,phone});
 assert.equal(standard.deposit,70000);assert.equal(standard.interest,18000);assert.equal(standard.processingFee,0);
 assert.deepEqual(standard.payments,[16000,16000,16000]);
 assert.throws(()=>financePlan({amount:100000,duration:3,phone,platform:'credit'}),/credit check and approval/);
 const approved=financePlan({amount:100000,duration:3,phone,platform:'credit',qualified:true});
 assert.equal(approved.deposit,70000);assert.equal(approved.interest,6750);assert.equal(approved.processingFee,5000);
 const legacy=calculatePlan({price:100000,duration:3,phone});
 assert.equal(legacy.additionalCost,standard.interest);assert.equal(legacy.installment,standard.payments[0]);
 for(const duration of [0,4,7,1.5,NaN])assert.throws(()=>financePlan({amount:100000,duration,phone}));
});
