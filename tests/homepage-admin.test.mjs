import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateHome,validateDeals,dealPrice,DEAL_LIMIT} from '../commerce/deals.mjs';
import {storeSettings} from '../commerce/store-settings.mjs';
import {storeItems} from '../commerce/storefront-data.mjs';
import {card,listable} from '../assets/storefront-ui.mjs';
import handler from '../api/admin/deals.mjs';

test('Hot Deals allow four variants and 10% off is exact',()=>{
 assert.equal(DEAL_LIMIT,4);
 assert.equal(dealPrice(1000000),900000);assert.equal(dealPrice(1920000),1728000);
 assert.throws(()=>validateDeals({revision:0,skus:['a','b','c','d','e']}));
});
test('homepage selection accepts up to eight unique slugs and rejects forged input',()=>{
 assert.deepEqual(validateHome({revision:2,slugs:['iphone-18-pro-max','samsung-s26-ultra']}),{slugs:['iphone-18-pro-max','samsung-s26-ultra'],revision:2});
 for(const body of [{revision:0,slugs:['a','a']},{revision:0,slugs:Array.from({length:9},(_,i)=>'p'+i)},{revision:-1,slugs:[]},{revision:0,slugs:['<script>']},{slugs:[]},null])assert.throws(()=>validateHome(body));
});
test('homepage selection endpoint requires an administrator',async()=>{
 for(const method of ['GET','PUT']){const res={status(n){this.code=n;return this;},setHeader(){return this;},json(body){this.body=body;return this;}};await handler({method,headers:{},query:{kind:'home'}},res);assert.equal(res.code,401);}
});
test('default featured mix is real catalogue products across brands and categories',()=>{
 const picks=storeSettings.homeFeaturedProducts.map(slug=>storeItems.find(p=>p.slug===slug));
 assert.equal(picks.length,6);assert.ok(picks.every(Boolean));
 assert.ok(new Set(picks.map(p=>p.brand)).size>=3);assert.ok(new Set(picks.map(p=>p.category)).size>=5);
});
test('built homepage: section order, Hot Deals title, featured grid, one payment section',async()=>{
 const html=await readFile('index.html','utf8'),at=s=>{const i=html.indexOf(s);assert.ok(i>0,s);return i;};
 const order=['id="deals"','id="categories"','id="products"','id="benefits"','id="collections"','id="ways"','id="visit"'].map(at);
 assert.deepEqual(order,[...order].sort((a,b)=>a-b));
 assert.match(html,/<h2>Hot Deals<\/h2>/);assert.doesNotMatch(html,/All Deals|id="payment-plans"/);
 const grid=html.slice(at('id="productGrid"'),at('class="store-grid-end"'));
 // Featured products without an approved price are never listed.
 assert.deepEqual([...grid.matchAll(/data-model="([^"]+)"/g)].map(m=>m[1]),storeSettings.homeFeaturedProducts.filter(slug=>listable(storeItems.find(p=>p.slug===slug))));
 assert.doesNotMatch(grid,/Price coming soon|Price on request/);
 assert.equal((html.match(/class="benefit-card"/g)||[]).length,6);
 assert.doesNotMatch(html,/24\/7|1-Day Cancellation/);
 for(const href of ['href="/iphones"','href="/shop/watches/"','href="/shop/airpods/"'])assert.ok(html.slice(at('id="collections"'),at('id="ways"')).includes(href));
});
test('a product without a verified price keeps View Details and has no Buy Now',()=>{
 const html=card({slug:'x',route:'/x/',model:'Test — WiFi Only',image:'',conditions:['UK Used','Brand New'],variants:[{storage:'256GB',price:null,condition:'UK Used'}]});
 assert.doesNotMatch(html,/Price coming soon|Photo pending verification/);assert.equal(listable({variants:[{storage:'256GB',price:null}]}),false);assert.match(html,/View Details/);assert.doesNotMatch(html,/Buy Now/);
 assert.match(html,/<p class="store-condition">UK Used<\/p>/);
});
test('Pay Small Small never routes to EasyBuy and the footer has no financing item',async()=>{
 const {readdir}=await import('node:fs/promises');
 const pages=['index.html','iphone-17-pro/index.html','checkout/index.html','search/index.html','financing/index.html'];
 for(const file of pages){const html=await readFile(file,'utf8');const footer=html.match(/<footer[\s\S]*?<\/footer>/)?.[0]||'';assert.doesNotMatch(footer,/EasyBuy|Easy Buy|Financing explained|Pay Small Small/i,file);assert.doesNotMatch(html,/data-action="easyBuy" href="\/easybuy/,file);}
 const product=await readFile('iphone-17-pro/index.html','utf8');assert.match(product,/data-action="easyBuy" href="\/financing\/\?sku=/);
 const shop=await readFile('assets/storefront.js','utf8');assert.doesNotMatch(shop,/`\/easybuy\/\?\$\{q\}`/.source==='x'?/x/:/method==='easy'\)q\.set/);
 const fin=await readFile('financing/index.html','utf8');assert.doesNotMatch(fin,/not available online yet|coming soon|on hold/i);assert.match(fin,/apply online/);
 const js=await readFile('assets/shopping.js','utf8');assert.match(js,/const st=await settings;\s*if\(!st\?\.financing\?\.available\)/,'the Credit Direct button always answers: it waits for the check, then continues or explains');assert.match(js,/financing\?\.available/);
});
test('one page per model: condition and SIM are variant choices, not separate pages',async()=>{
 const {resolveVariant}=await import('../commerce/variant-selection.mjs');
 const pixel=storeItems.find(p=>p.slug==='pixel-10-pro');
 assert.deepEqual(pixel.conditions,['Brand New','UK Used']);
 const bn=resolveVariant(pixel.variants,{capacity:'128GB',condition:'Brand New',sim:'Physical SIM + eSIM'});
 const esim=resolveVariant(pixel.variants,{capacity:'128GB',condition:'Brand New',sim:'eSIM only'});
 const uk=resolveVariant(pixel.variants,{capacity:'128GB',condition:'UK Used',sim:'Physical SIM + eSIM'});
 assert.equal(bn.price,1_050_000);assert.equal(esim.price,910_000);assert.equal(uk.price,767_000);
 assert.equal(resolveVariant(pixel.variants,{capacity:'1TB',condition:'Brand New',sim:'Physical SIM + eSIM'}),undefined);
 const ukOnly=storeItems.find(p=>p.slug==='samsung-s22-ultra');assert.deepEqual(ukOnly.conditions,['UK Used']);
 const bnOnly=storeItems.find(p=>p.slug==='pixel-11-pro-xl');assert.deepEqual(bnOnly.conditions,['Brand New']);
 assert.equal(new Set(storeItems.flatMap(p=>p.variants.map(v=>p.slug+'|'+v.storage))).size,storeItems.reduce((n,p)=>n+p.variants.length,0));
});
test('every product page variant can be reached: no two share storage, condition, colour and SIM',async()=>{
 // Mirrors the live price feed: a variant's storage pill is its capacity, else its whole label.
 const {retailInventory}=await import('../commerce/retail-inventory.mjs');
 const colorsOf=v=>(v.color||'').split('/').map(x=>x.trim()).filter(Boolean);
 const clashes=[];
 for(const p of retailInventory){const seen=new Map();for(const v of p.variants){
  const key=[v.capacity||v.storage,v.condition||p.condition,colorsOf(v).sort().join('/'),v.connectivity||''].join('|');
  if(seen.has(key))clashes.push(p.slug+': '+seen.get(key)+' / '+v.storage);else seen.set(key,v.storage);}}
 assert.deepEqual(clashes,[]);
});
