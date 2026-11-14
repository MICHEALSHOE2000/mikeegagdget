import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateHome,validateDeals,dealPrice,DEAL_LIMIT} from '../commerce/deals.mjs';
import {storeSettings} from '../commerce/store-settings.mjs';
import {storeItems} from '../commerce/storefront-data.mjs';
import {card} from '../assets/storefront-ui.mjs';
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
 assert.deepEqual([...grid.matchAll(/data-model="([^"]+)"/g)].map(m=>m[1]),storeSettings.homeFeaturedProducts);
 assert.equal((html.match(/class="benefit-card"/g)||[]).length,6);
 assert.doesNotMatch(html,/24\/7|1-Day Cancellation/);
 for(const href of ['href="/iphones"','href="/shop/watches/"','href="/shop/airpods/"'])assert.ok(html.slice(at('id="collections"'),at('id="ways"')).includes(href));
});
test('a product without a verified price keeps View Details and has no Buy Now',()=>{
 const html=card({slug:'x',route:'/x/',model:'Test — WiFi Only',image:'',conditions:['UK Used','Brand New'],variants:[{storage:'256GB',price:null,condition:'UK Used'}]});
 assert.match(html,/Price coming soon/);assert.match(html,/View Details/);assert.doesNotMatch(html,/Buy Now/);
 assert.match(html,/<p class="store-condition">UK Used<\/p>/);
});
