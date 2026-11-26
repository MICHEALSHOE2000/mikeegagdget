import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {buildItems,feedXml,productJsonLd,googleCondition,validGtin,itemId,shippingCeiling,feedStats,IMAGE_HOLDS} from '../commerce/merchant.mjs';
import {renderProductPage} from '../commerce/product-render.mjs';
import {cleanStock} from '../commerce/stock.mjs';
import {stockLabel} from '../assets/storefront-ui.mjs';
import {seedRows} from '../commerce/delivery-rates.mjs';
import pages from '../commerce/merchant-products.mjs';
const read=f=>readFileSync(f,'utf8');
const row=(sku,price,data,extra={})=>({sku,price_ngn:price,enabled:true,deal_position:null,product_data:{slug:sku.split('|')[0],brand:'Apple',category:'iphones',stockStatus:'in_stock',...data},...extra});
const PAGES={'iphone-15-pro-max':{route:'/iphone-15-pro-max',model:'iPhone 15 Pro Max',brand:'Apple',category:'iphones',skus:['iphone-15-pro-max|256GB','iphone-15-pro-max|512GB'],photos:['/images/store/15promax-1-720.webp','/images/store/15promax-2-720.webp']},
 'iphone-18-pro':{route:'/iphone-18-pro',model:'iPhone 18 Pro',brand:'Apple',category:'iphones',skus:['iphone-18-pro|256GB · Silver'],photos:['/images/store/18pro-1-720.webp']},
 'samsung-s24':{route:'/samsung-s24',model:'Samsung Galaxy S24',brand:'Samsung',category:'samsung',skus:['samsung-s24|256GB'],photos:['/images/store/samsung/samsung-galaxy-s24-1-720.webp']}};
const RATES=seedRows();

test('condition mapping: UK Used and Open Box are "used", Brand New is "new", unconfirmed is not sent',()=>{
 assert.equal(googleCondition('UK Used'),'used');assert.equal(googleCondition('Open Box'),'used');assert.equal(googleCondition('Pre-Owned'),'used');
 assert.equal(googleCondition('Brand New'),'new');assert.equal(googleCondition('Confirm condition'),null);assert.equal(googleCondition(''),null);
});
test('GTINs are only accepted with a correct check digit; IDs are stable and Google-safe',()=>{
 assert.equal(validGtin('4006381333931'),true);assert.equal(validGtin('4006381333932'),false);assert.equal(validGtin('12345'),false);
 assert.equal(itemId('iphone-15-pro-max|256GB','Black'),itemId('iphone-15-pro-max|256GB','Black'));assert.notEqual(itemId('a|1','Black'),itemId('a|1','White'));
 assert.match(itemId('iphone-17-pro-max|256GB · Blue/Orange · Brand New','Deep Blue'),/^MG-[0-9a-f]{16}$/);
});
test('shipping: one Nigeria-wide amount equal to the highest delivery fee, so Google never understates; unpriced areas ignored',()=>{
 const fees=RATES.filter(r=>r.enabled&&r.fee_ngn!==null).map(r=>r.fee_ngn);
 assert.equal(shippingCeiling(RATES),Math.max(...fees));assert.equal(shippingCeiling(RATES),15000);
 for(const f of fees)assert.ok(shippingCeiling(RATES)>=f);
 assert.equal(shippingCeiling([]),null);assert.equal(shippingCeiling([{fee_ngn:null,enabled:false}]),null);
});
test('feed items: one per colour, used vs new, deal sale price, availability, held photos and missing data are excluded with reasons',()=>{
 const rows=[
  row('iphone-15-pro-max|256GB',940000,{model:'iPhone 15 Pro Max',condition:'UK Used',capacity:'256GB',storage:'256GB',colors:['Black Titanium','Natural Titanium'],connectivity:'Physical SIM + eSIM'}),
  row('iphone-15-pro-max|512GB',1100000,{model:'iPhone 15 Pro Max',condition:'UK Used',capacity:'512GB',storage:'512GB',colors:[],stockStatus:'preorder',availabilityDate:'2026-12-10'},{deal_position:1}),
  row('iphone-18-pro|256GB · Silver',2000000,{model:'iPhone 18 Pro',condition:'Brand New',capacity:'256GB',storage:'256GB · Silver',colors:['Silver']}),
  row('samsung-s24|256GB',500000,{model:'Samsung Galaxy S24',brand:'Samsung',category:'samsung',condition:'Confirm condition',capacity:'256GB',storage:'256GB',colors:[]}),
  row('samsung-s24|512GB',0,{model:'Samsung Galaxy S24',brand:'Samsung',category:'samsung',condition:'Brand New',capacity:'512GB',storage:'512GB',colors:[]}),
  row('iphone-15-pro-max|1TB',1300000,{model:'iPhone 15 Pro Max',condition:'UK Used',capacity:'1TB',storage:'1TB',colors:[]}),
  row('iphone-15-pro-max|128GB',800000,{model:'iPhone 15 Pro Max',condition:'UK Used',capacity:'128GB',storage:'128GB',colors:[],stockStatus:''}),
  {...row('iphone-15-pro-max|64GB',700000,{model:'iPhone 15 Pro Max',condition:'UK Used'}),enabled:false},
 ];
 // 256GB is listed on the page; 1TB is not; 128GB has no availability.
 PAGES['iphone-15-pro-max'].skus.push('iphone-15-pro-max|128GB');
 const {items,excluded}=buildItems(rows,{pages:PAGES,rates:RATES});
 const byTitle=Object.fromEntries(items.map(i=>[i.title,i]));
 assert.deepEqual(Object.keys(byTitle).sort(),['Apple iPhone 15 Pro Max 256GB Black Titanium – UK Used','Apple iPhone 15 Pro Max 256GB Natural Titanium – UK Used','Apple iPhone 15 Pro Max 512GB – UK Used']);
 const black=byTitle['Apple iPhone 15 Pro Max 256GB Black Titanium – UK Used'];
 assert.equal(black.googleCondition,'used');assert.equal(black.availability,'in_stock');assert.equal(black.price,940000);assert.equal(black.salePrice,null);assert.equal(black.colour,'Black Titanium');
 assert.equal(black.url,'https://www.mikeegadget.com.ng/iphone-15-pro-max?sku=iphone-15-pro-max%7C256GB&color=Black%20Titanium');
 assert.equal(black.image,'https://www.mikeegadget.com.ng/images/store/15promax-1-720.webp');assert.deepEqual(black.additionalImages,['https://www.mikeegadget.com.ng/images/store/15promax-2-720.webp']);
 assert.equal(black.shippingPrice,15000);assert.equal(black.gtin,'');assert.equal(black.itemGroupId,'iphone-15-pro-max-used');assert.equal(black.size,'256GB');
 const pre=byTitle['Apple iPhone 15 Pro Max 512GB – UK Used'];assert.equal(pre.availability,'preorder');assert.equal(pre.availabilityDate,'2026-12-10');assert.equal(pre.price,1100000);assert.equal(pre.salePrice,990000);
 const reasons=Object.fromEntries(excluded.map(e=>[e.sku,e.reasons.join('; ')]));
 assert.match(reasons['iphone-18-pro|256GB · Silver'],/Photo needs approval in admin: Phones are shown inside cases/);
 assert.match(reasons['samsung-s24|256GB'],/Condition not confirmed/);assert.match(reasons['samsung-s24|512GB'],/No valid price/);
 assert.match(reasons['iphone-15-pro-max|1TB'],/not on the product page/);assert.match(reasons['iphone-15-pro-max|128GB'],/Availability not set/);
 assert.ok(!items.concat(excluded).some(i=>i.sku==='iphone-15-pro-max|64GB'),'hidden variants are not part of the catalogue');
 const stats=feedStats({items,excluded,warnings:[]},7);assert.equal(stats.eligibleItems,3);assert.equal(stats.eligibleVariants,2);assert.equal(stats.missingPrice,1);
});
test('pre-order/backorder without a date, out of stock, approved photos per colour',()=>{
 const base={model:'iPhone 15 Pro Max',condition:'UK Used',capacity:'256GB',storage:'256GB'};
 const r1=buildItems([row('iphone-15-pro-max|256GB',940000,{...base,colors:[],stockStatus:'backorder'})],{pages:PAGES,rates:RATES});assert.match(r1.excluded[0].reasons.join(),/expected availability date/);
 const r2=buildItems([row('iphone-15-pro-max|256GB',940000,{...base,colors:[],stockStatus:'out_of_stock'})],{pages:PAGES,rates:RATES});assert.equal(r2.items[0].availability,'out_of_stock');
 const r3=buildItems([row('iphone-18-pro|256GB · Silver',2000000,{model:'iPhone 18 Pro',condition:'Brand New',capacity:'256GB',colors:['Silver'],images:[{url:'/images/own/18pro-silver.webp',approved:true,source:'own',licence:'Our photo',color:'Silver'}],gtin:'4006381333931'})],{pages:PAGES,rates:RATES});
 assert.equal(r3.items.length,1,'an approved photo releases a held product');assert.equal(r3.items[0].image,'https://www.mikeegadget.com.ng/images/own/18pro-silver.webp');assert.equal(r3.items[0].gtin,'4006381333931');assert.equal(r3.items[0].googleCondition,'new');
});
test('XML feed: valid structure, escaped text, NGN prices, required Google attributes on every item',()=>{
 const rows=[row('iphone-15-pro-max|256GB',940000,{model:'iPhone 15 Pro Max <"&>',condition:'UK Used',capacity:'256GB',colors:['Black']})];
 const {items}=buildItems(rows,{pages:PAGES,rates:RATES});const xml=feedXml(items,{generatedAt:'2026-11-21T00:00:00Z'});
 assert.match(xml,/^<\?xml version="1\.0" encoding="UTF-8"\?>\n<rss version="2\.0" xmlns:g="http:\/\/base\.google\.com\/ns\/1\.0">/);
 assert.equal((xml.match(/<item>/g)||[]).length,1);assert.match(xml,/&lt;&quot;&amp;&gt;/);assert.doesNotMatch(xml,/<"&>/);
 for(const t of ['g:id','title','description','link','g:image_link','g:availability','g:price','g:brand','g:condition','g:shipping'])assert.match(xml,new RegExp(`<${t}>`),t);
 assert.match(xml,/<g:price>940000\.00 NGN<\/g:price>/);assert.match(xml,/<g:condition>used<\/g:condition>/);assert.match(xml,/<g:google_product_category>267</);
 assert.doesNotMatch(xml,/supplier|service_role|SUPABASE/i);
});
test('structured data uses the same price, availability and condition as the feed',()=>{
 const rows=[row('iphone-15-pro-max|256GB',940000,{model:'iPhone 15 Pro Max',condition:'UK Used',capacity:'256GB',colors:['Black','White']},{deal_position:2})];
 const {items}=buildItems(rows,{pages:PAGES,rates:RATES});const ld=productJsonLd('iphone-15-pro-max',items);
 assert.equal(ld['@type'],'ProductGroup');assert.equal(ld.hasVariant.length,2);assert.deepEqual(ld.variesBy,['https://schema.org/color']);
 for(const [i,v] of ld.hasVariant.entries()){assert.equal(v.sku,items[i].id);assert.equal(v.offers.price,846000);assert.equal(v.offers.priceCurrency,'NGN');assert.equal(v.offers.availability,'https://schema.org/InStock');assert.equal(v.offers.itemCondition,'https://schema.org/UsedCondition');assert.equal(v.offers.shippingDetails.shippingRate.value,15000);assert.ok(!('aggregateRating' in v)&&!('review' in v));}
 assert.equal(productJsonLd('nothing',items),null);
});
test('product page render: live structured data and live prices replace build-time values; nothing else changes',()=>{
 const html=read('iphone-16-pro-max/index.html');
 const rows=[row('iphone-16-pro-max|256GB',1234000,{model:'iPhone 16 Pro Max',condition:'UK Used',capacity:'256GB',storage:'256GB',colors:[]})];
 const {items}=buildItems(rows,{pages,rates:RATES});
 const out=renderProductPage(html,{slug:'iphone-16-pro-max',items,variants:rows.map(r=>({...r.product_data,sku:r.sku,price:r.price_ngn}))});
 assert.match(out,/data-storage="256GB"\s*data-price="1234000"/);assert.match(out,/<span class="storage-price">₦1,234,000<\/span>/);assert.match(out,/<strong data-product-price>₦1,234,000<\/strong>/);
 const ld=JSON.parse(out.match(/<script type="application\/ld\+json" data-product-schema>([\s\S]*?)<\/script>/)[1]);assert.equal(ld['@type'],'Product','one variant is a plain Product');assert.equal(ld.offers.price,1234000);assert.ok(ld.image?.length);
 assert.equal(out.length-html.length<4000,true);assert.ok(out.includes('<footer'));
});
test('feed endpoint: XML with the right headers; a database outage or an empty result never replaces a good feed',async()=>{
 const {default:handler}=await import('../api/shop/catalog.mjs');const prev={...process.env};Object.assign(process.env,{SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'secret-key-not-in-output'});const old=globalThis.fetch;
 const run=async fetcher=>{globalThis.fetch=fetcher;const out={headers:{}};const res={status(n){out.status=n;return this},setHeader(k,v){out.headers[k.toLowerCase()]=v;return this},send(b){out.body=b;return this},json(b){out.body=b;return this}};await handler({method:'GET',query:{format:'google'}},res);return out;};
 const catalogue=[row('iphone-16-pro-max|256GB',1220000,{model:'iPhone 16 Pro Max',condition:'UK Used',capacity:'256GB',storage:'256GB',colors:[]})];
 let saved=null;
 try{
  const ok=await run(async(url,opts)=>url.includes('rpc/shop_deal_catalogue')?{ok:true,status:200,json:async()=>catalogue}:url.includes('shop_delivery_rates')?{ok:true,status:200,json:async()=>RATES}:url.includes('shop_merchant_feed_status')?(saved=JSON.parse(opts.body),{ok:true,status:201,json:async()=>null}):{ok:false,status:404,json:async()=>({})});
  assert.equal(ok.status,200);assert.match(ok.headers['content-type'],/application\/xml/);assert.match(ok.headers['cache-control'],/s-maxage=3600/);assert.match(ok.body,/<g:price>1220000\.00 NGN<\/g:price>/);assert.doesNotMatch(ok.body,/secret-key/);
  assert.equal(saved.id,'google');assert.equal(saved.stats.eligibleItems,1);
  const down=await run(async()=>{throw Error('down');});assert.equal(down.status,503);assert.equal(down.headers['cache-control'],'no-store');assert.doesNotMatch(String(down.body),/<rss/);
  const empty=await run(async url=>url.includes('rpc/')?{ok:true,status:200,json:async()=>[]}:{ok:true,status:200,json:async()=>RATES});assert.equal(empty.status,503);
 }finally{globalThis.fetch=old;for(const k of ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'])if(prev[k]===undefined)delete process.env[k];else process.env[k]=prev[k];}
 const v=JSON.parse(read('vercel.json'));assert.ok(v.rewrites.some(r=>r.source==='/google-merchant-feed.xml'&&r.destination==='/api/shop/catalog?format=google'));
 assert.match(read('robots.txt'),/Allow: \//);
});
test('middleware renders product pages from live data and falls back to the static page on any problem',async()=>{
 const {default:middleware}=await import('../middleware.js');const prev={...process.env};Object.assign(process.env,{SUPABASE_URL:'https://db.test',SUPABASE_SERVICE_ROLE_KEY:'k'});const old=globalThis.fetch;
 const page=read('iphone-16-pro-max/index.html');
 try{
  globalThis.fetch=async url=>{url=String(url);if(url.startsWith('https://shop.test/'))return new Response(page,{headers:{'content-type':'text/html'}});
   if(url.includes('checkout_inventory'))return Response.json([row('iphone-16-pro-max|256GB',1220000,{model:'iPhone 16 Pro Max',condition:'UK Used',capacity:'256GB',storage:'256GB',colors:[]})]);
   if(url.includes('shop_delivery_rates'))return Response.json(RATES);if(url.includes('shop_deal_settings'))return Response.json([{skus:[]}]);return new Response('',{status:404});};
  const res=await middleware(new Request('https://shop.test/iphone-16-pro-max'));assert.equal(res.headers.get('x-mg-render'),'product');const html=await res.text();assert.match(html,/"@type":"Product"/);assert.match(html,/InStock/);
  assert.equal((await middleware(new Request('https://shop.test/checkout/'))).headers.get('x-middleware-next'),'1');
  assert.equal((await middleware(new Request('https://shop.test/not-a-product'))).headers.get('x-middleware-next'),'1');
  globalThis.fetch=async()=>{throw Error('down');};assert.equal((await middleware(new Request('https://shop.test/iphone-16-pro-max'))).headers.get('x-middleware-next'),'1');
 }finally{globalThis.fetch=old;for(const k of ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'])if(prev[k]===undefined)delete process.env[k];else process.env[k]=prev[k];}
});
test('availability: admin can choose in stock, out of stock, pre-order (with date) or backorder; customers see the same words',()=>{
 assert.throws(()=>cleanStock({stockStatus:'preorder'}),/expected availability date/);
 assert.deepEqual(cleanStock({stockStatus:'preorder',availabilityDate:'2026-12-10'}),{stockStatus:'preorder',stockQty:null,availabilityDate:'2026-12-10'});
 assert.equal(cleanStock({stockStatus:'in_stock',availabilityDate:'2026-12-10'}).availabilityDate,'');
 assert.equal(stockLabel({stockStatus:'in_stock'}),'In stock');assert.equal(stockLabel({stockStatus:'out_of_stock'}),'Out of stock');assert.match(stockLabel({stockStatus:'preorder',availabilityDate:'2026-12-10'}),/^Pre-order — expected 10 Dec 2026$/);assert.match(stockLabel({stockStatus:'backorder',availabilityDate:'2026-12-10'}),/^Backorder/);
 const admin=read('assets/admin-extras.mjs');for(const s of ['in_stock','out_of_stock','preorder','backorder','availabilityDate','name="gtin"','name="mpn"'])assert.ok(admin.includes(s),s);
 assert.match(read('assets/shopping.js'),/mg-line-stock/);
});
test('admin: GTINs are validated, availability changes record who confirmed them, and the Google Shopping report exists',async()=>{
 const {validateProductEdit}=await import('../commerce/admin-catalogue.mjs');
 const current={slug:'iphone-15-pro-max',capacity:'256GB',storage:'256GB',condition:'UK Used',colors:[],stockStatus:'in_stock',availabilitySource:'owner-confirmed'};
 assert.throws(()=>validateProductEdit(current,{condition:'UK Used',colors:[],stockStatus:'in_stock',gtin:'123'}),/GTIN/);
 const out=validateProductEdit(current,{condition:'UK Used',colors:[],stockStatus:'out_of_stock',gtin:'4006381333931',mpn:'MU773ZD/A'});
 assert.equal(out.stockStatus,'out_of_stock');assert.equal(out.availabilitySource,'admin');assert.equal(out.gtin,'4006381333931');assert.equal(out.mpn,'MU773ZD/A');
 const html=read('admin/index.html');assert.match(html,/data-tab="merchant"/);assert.match(html,/google-merchant-feed\.xml/);assert.match(read('api/admin/manage.mjs'),/kind==='merchant'/);
});
test('migration: additive, only fills variants with no availability, logs every change, keeps a rollback',()=>{
 const sql=read('supabase/migrations/20261121130000_merchant_center.sql').replace(/--.*$/gm,'');
 assert.doesNotMatch(sql,/drop |rename|delete from|truncate/i);
 assert.match(sql,/coalesce\(product_data->>'stockStatus',''\)=''/);assert.match(sql,/enabled and price_ngn>0/);assert.match(sql,/insert into public\.shop_availability_changes/);
 assert.match(read('supabase/merchant-center-rollback.sql'),/availabilitySource'='owner-confirmed'/);
 assert.ok(Object.keys(IMAGE_HOLDS).length>0);
});
test('merchant-listing markup meets Google rules: images, group description, variesBy, no made-up colours',()=>{
 const mk=(cap,price,colors)=>row(`iphone-16-pro-max|${cap}`,price,{model:'iPhone 16 Pro Max',condition:'UK Used',capacity:cap,storage:cap,colors});
 const group=rows=>productJsonLd('iphone-16-pro-max',buildItems(rows,{pages,rates:RATES}).items);
 const a=group([mk('256GB',1500000,['Desert Titanium','Black Titanium']),mk('512GB',1700000,['Desert Titanium']),mk('1TB',1900000,[])]);
 assert.equal(a['@type'],'ProductGroup');assert.ok(a.description&&a.image);
 assert.deepEqual(a.variesBy,['https://schema.org/size','https://schema.org/color']);
 assert.equal(a.hasVariant.length,3,'the 1TB with no colour is left out of a colour group');
 for(const v of a.hasVariant){assert.ok(v.image?.[0]&&v.color&&v.size&&v.offers.price>0);}
 const b=group([mk('256GB',1500000,[]),mk('512GB',1700000,[])]);
 assert.deepEqual(b.variesBy,['https://schema.org/size']);assert.ok(b.hasVariant.every(v=>!('color' in v)));
});
