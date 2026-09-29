import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {products} from '../commerce/catalog.mjs';
import {storeItems} from '../commerce/storefront-data.mjs';
import {featuredDeals,offerProduct,promotion,HOT_DEALS_LIMIT} from '../commerce/offers.mjs';
import {choices,financePlan} from '../commerce/upgrade-core.mjs';
import {selectedCondition} from '../commerce/conditions.mjs';

test('homepage promotes exactly five unique phones, including both 18 Pro models at 8% off',async()=>{
 const deals=featuredDeals(storeItems);
 assert.equal(deals.length,HOT_DEALS_LIMIT);
 assert.equal(new Set(deals.map(phone=>phone.slug)).size,HOT_DEALS_LIMIT);
 for(const slug of ['iphone-18-pro','iphone-18-pro-max'])assert.ok(deals.some(phone=>phone.slug===slug));
 for(const item of deals){
  const base=products.find(product=>product.slug===item.slug);
  const offered=offerProduct(base);
  for(const variant of offered.variants.filter(v=>v.regularPrice)){
   assert.equal(variant.price,Math.round(variant.regularPrice*.92));
   assert.equal(item.variants.find(v=>v.storage===variant.storage).price,variant.price);
  }
 }
 assert.equal(promotion.discount,.08);
 const dom=new JSDOM(await readFile('index.html','utf8'));
 const cards=[...dom.window.document.querySelectorAll('#hotDeals > article')];
 assert.equal(cards.length,5);
 assert.deepEqual(cards.map(card=>card.dataset.model),deals.map(phone=>phone.slug));
 assert.doesNotMatch(dom.window.document.getElementById('deals').textContent,/\d+%\s*(?:off|discount)/i);
 dom.window.close();
});

test('iPhone 11–15 pages label UK Used without a selector; later models expose only recorded choices',async()=>{
 for(const slug of ['iphone-x','iphone-xr','iphone-xs-max','iphone-se-2',...Array.from({length:5},(_,i)=>`iphone-${i+11}`)]){
  const product=products.find(phone=>phone.slug===slug);
  assert.deepEqual(product.conditions,['UK Used']);
  assert.equal(selectedCondition(product,'Brand New'),'UK Used');
  const dom=new JSDOM(await readFile(`${product.slug}/index.html`,'utf8'));
  assert.equal(dom.window.document.querySelector('[data-condition-select]'),null);
  assert.equal(dom.window.document.querySelector('.condition-badge')?.textContent,'UK Used');
  assert.doesNotMatch(dom.window.document.querySelector('.condition-panel').textContent,/Brand New/);
  dom.window.close();
 }
 const sixteen=new JSDOM(await readFile('iphone-16/index.html','utf8'));
 assert.equal(sixteen.window.document.querySelector('[data-condition-select]'),null);
 assert.match(sixteen.window.document.querySelector('.condition-badge').textContent,/Confirm available condition/);
 sixteen.window.close();
 const eighteen=new JSDOM(await readFile('iphone-18-pro/index.html','utf8'));
 assert.equal(eighteen.window.document.querySelector('[data-condition-select]'),null);
 assert.match(eighteen.window.document.querySelector('.condition-badge').textContent,/Confirm condition/);
 eighteen.window.close();
});

test('each iPhone bracket carries its required down payment into the default 20% monthly plan',()=>{
 for(const [slug,rate] of [['iphone-11',.5],['iphone-12-pro-max',.5],['iphone-13',.6],['iphone-15-pro-max',.6],['iphone-16',.7],['iphone-18-pro-max',.7]]){
  const phone=choices.find(choice=>choice.slug===slug&&choice.price>0);
  assert.ok(phone,slug);
  const plan=financePlan({amount:phone.price,phone,duration:3});
  assert.equal(plan.deposit,Math.round(phone.price*rate),slug);
  assert.equal(plan.rate,.2);
  assert.equal(plan.payments.reduce((total,payment)=>total+payment,0),plan.repaymentTotal);
  assert.throws(()=>financePlan({amount:phone.price,phone,duration:3,platform:'credit'}),/credit check and approval/);
  const qualified=financePlan({amount:phone.price,phone,duration:3,platform:'credit',qualified:true});
  assert.equal(qualified.rate,.075);
  assert.equal(qualified.deposit,plan.deposit);
 }
});

test('generated landing copy uses model-specific iPhone deposits and UK Used-only older series',async()=>{
 const financing=await readFile('easy-buy/iphone/index.html','utf8');
 assert.match(financing,/iPhone 11–12: 50%, iPhone 13–15: 60%, iPhone 16–18: 70%/);
 assert.doesNotMatch(financing,/starting deposit is 40% of the confirmed device price/);
 for(const series of [11,12,13,14,15]){
  const html=await readFile(`iphone/iphone-${series}-series/index.html`,'utf8');
  assert.doesNotMatch(html,new RegExp(`Can I compare new and UK-used iPhone ${series} series phones`));
  assert.match(html,/UK Used only/);
 }
});

test('product action and storage colors have readable contrast with mobile navigation clearance',async()=>{
 const css=await readFile('assets/sales.css','utf8');
 const html=await readFile('iphone-15/index.html','utf8');
 const luminance=hex=>{
  const channels=hex.match(/[\da-f]{2}/gi).map(value=>parseInt(value,16)/255);
  const [r,g,b]=channels.map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);
  return .2126*r+.7152*g+.0722*b;
 };
 const contrast=(a,b)=>{const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (values[0]+.05)/(values[1]+.05);};
 assert.ok(contrast('#ffffff','#143b2a')>=4.5,'Swap CTA');
 assert.ok(contrast('#e5e8db','#111712')>=4.5,'unselected storage price');
 assert.ok(contrast('#15321e','#e1bd70')>=4.5,'selected storage price');
 assert.match(css,/\.commerce-button-ghost\{background:#143b2a!important;[^}]*color:#fff!important\}/);
 assert.match(css,/\.selector-pills button\.is-active \.storage-price\{color:#15321e!important\}/);
 assert.match(css,/body\[data-page-type="product"\]\{padding-bottom:calc\(110px \+ env\(safe-area-inset-bottom\)\)\}/);
 assert.ok(html.indexOf('/assets/sales.css')>html.indexOf('/assets/commerce.css'));
 assert.match(html,/Swap to this phone →/);
});
