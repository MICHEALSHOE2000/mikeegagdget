import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import {storeItems} from '../commerce/storefront-data.mjs';
import {searchCatalogue,priceIntent,normalizeSearch} from '../commerce/search.mjs';
import {suggestionsFor,LIBRARY,provenance,CURRENT_FLAGS} from '../commerce/photo-review.mjs';
import {readList,pushRecent,toggleCompare,compareRows,COMPARE_KEY,RECENT_KEY} from '../commerce/shopper-lists.mjs';
import {DELIVERY_SUMMARY,LAGOS_FEE_RANGE,PARK_FEE_RANGE,UK_USED_STANDARD} from '../commerce/buying-info.mjs';
import {LAGOS_LGA_FEES,STATE_PARKS} from '../commerce/delivery-rates.mjs';
import {cleanPhotos} from '../commerce/product-photos.mjs';
const read=f=>readFileSync(f,'utf8');
const names=q=>searchCatalogue(storeItems,q).map(i=>i.model);
const mem=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))};};

test('search: exact model first, storage narrows, typos and joined words work, wrong models are not exact matches',()=>{
 assert.equal(names('iPhone 15 Pro Max 256GB')[0],'iPhone 15 Pro Max');
 assert.ok(!names('iPhone 15 Pro Max').some(n=>/^iPhone 15( Pro| Plus)?$/.test(n)),'a 15 or 15 Pro must not match a 15 Pro Max search');
 assert.equal(names('iphon 15 pro max')[0],'iPhone 15 Pro Max');
 assert.equal(names('iphone 17pro')[0],'iPhone 17 Pro');
 assert.equal(names('iPhone 15')[0],'iPhone 15');
 assert.equal(names('samsng s24 ultra')[0],'Samsung Galaxy S24 Ultra');
 assert.ok(names('Wi-Fi only').every(n=>/wi-?fi only/i.test(n)||/ipad|tab/i.test(n)));
 assert.ok(names('UK Used iPhone').length>0&&names('UK Used iPhone').every(n=>/iphone/i.test(n)));
 assert.equal(normalizeSearch('iPhone 16ProMax'),'iphone 16 pro max');
});
test('search: "under ₦500k" and similar price searches filter by the cheapest buyable option',()=>{
 assert.deepEqual([priceIntent('under ₦500k').max,priceIntent('below 1.2m').max,priceIntent('between 300k and 500k').min],[500000,1200000,300000]);
 assert.equal(priceIntent('iphone 15 pro max 256gb').active,false,'"max 256" is a model name, not a price');
 const cheap=searchCatalogue(storeItems,'iphone under 500k');assert.ok(cheap.length>0);
 for(const item of cheap){const min=Math.min(...item.variants.map(v=>v.price).filter(p=>p>0));assert.ok(min<=500000,item.model);assert.match(item.model,/iphone/i);}
 assert.equal(searchCatalogue(storeItems,'iphone under 1k').length,0);
});
test('photos: rejected library photos are never suggested; every suggestion records its source note; approval needs source and permission',()=>{
 for(const [slug,list] of Object.entries(LIBRARY)){const s=suggestionsFor(slug);for(const [base,status] of list){const found=s.some(p=>p.url===base+'-720.webp');assert.equal(found,status!=='reject',base);}
  for(const p of s){assert.ok(existsSync('.'+p.url),p.url);assert.ok(p.licence.length>10);}}
 assert.equal(suggestionsFor('iphone-17-air').some(p=>/17air-3/.test(p.url)),false,'concept render rejected');
 assert.match(provenance('/images/store/samsung/x-720.webp').licence,/Neostore/);
 assert.throws(()=>cleanPhotos([{url:'/images/store/11-2-720.webp',approved:true}]),/source and the permission/);
 for(const base of Object.keys(CURRENT_FLAGS))assert.ok(existsSync('.'+base+'-720.webp')||existsSync('.'+base+'.webp'),base);
});
test('photo audit report exists with coverage numbers and one row per published variant',()=>{
 const md=read('docs/product-image-audit.md'),csv=read('docs/product-image-audit.csv').trim().split('\n');
 assert.match(md,/Showing a photo \| \d+ \(\d+\.\d%\)/);assert.match(md,/0% count as approved/);
 assert.match(csv[0],/"product_id","slug","model".*"approval_status"/);assert.ok(csv.length>300);
});
test('recently viewed and compare stay on the device, hold product names only, and compare holds at most 3',()=>{
 const s=mem();for(const slug of ['a','b','c','a'])pushRecent(s,slug);assert.deepEqual(readList(s,RECENT_KEY),['a','c','b']);
 pushRecent(s,'<script>');assert.ok(!readList(s,RECENT_KEY).includes('<script>'));
 for(const slug of ['x','y','z'])toggleCompare(s,slug);assert.equal(toggleCompare(s,'w').full,true);assert.deepEqual(readList(s,COMPARE_KEY),['x','y','z']);
 toggleCompare(s,'y');assert.deepEqual(readList(s,COMPARE_KEY),['x','z']);
});
test('compare shows only recorded data and "—" when something is not recorded',()=>{
 const money=n=>'₦'+n.toLocaleString('en-NG');
 const rows=compareRows([{model:'A',variants:[{storage:'128GB',capacity:'128GB',price:500000,condition:'UK Used',color:'Black'}]},{model:'B',variants:[{storage:'256GB',price:0,condition:'Brand New'}]}],{money});
 const by=Object.fromEntries(rows.map(r=>[r.label,r.values]));
 assert.deepEqual(by['Price from'],['₦500,000','—']);assert.deepEqual(by['Condition'],['UK Used','—']);assert.deepEqual(by['SIM / connectivity'],['—','—']);
});
test('delivery wording on product pages comes from the checkout fee table; no invented delivery times or free delivery',()=>{
 const lagos=Object.values(LAGOS_LGA_FEES),parks=Object.values(STATE_PARKS).map(([,f])=>f).filter(Number.isFinite);
 assert.equal(LAGOS_FEE_RANGE,`₦${Math.min(...lagos).toLocaleString('en-NG')}–₦${Math.max(...lagos).toLocaleString('en-NG')}`);
 assert.equal(PARK_FEE_RANGE,`₦${Math.min(...parks).toLocaleString('en-NG')}–₦${Math.max(...parks).toLocaleString('en-NG')}`);
 assert.match(DELIVERY_SUMMARY,/Free pickup at our store/);
 const js=read('assets/product-selection.js');assert.doesNotMatch(js,/same-day|24–48|24-48/);
 const pages=[];const walk=d=>{for(const n of readdirSync(d)){if(['node_modules','docs','tests','.git'].includes(n)||n.startsWith('.'))continue;const p=d+'/'+n;if(statSync(p).isDirectory())walk(p);else if(n.endsWith('.html'))pages.push(p);}};walk('.');
 const bad=pages.filter(p=>/same-day delivery|free (nationwide )?delivery|free shipping|Nationwide delivery<|neighboring African countries|24–48 hours/i.test(read(p)));assert.deepEqual(bad,[]);
});
test('UK Used standard is shown on UK Used product pages, with the 85% battery rule',()=>{
 assert.ok(UK_USED_STANDARD.some(s=>/85%/.test(s)));
 const h=read('iphone-16-pro-max/index.html');assert.match(h,/Original, non-boosted battery at 85% health or above/);assert.doesNotMatch(h,/above 83%/);
 assert.match(read('assets/product-selection.js'),/data-uk-standard/);assert.match(read('assets/product-selection.js'),/Representative image/);
});
test('product gallery: thumbnails, swipe, full-screen viewer with zoom, and admin-approved photos per variant',()=>{
 const g=read('assets/product-gallery.js');for(const s of ['mountGallery','showModal','dblclick','pointerup','ArrowRight','set(list,active)'])assert.ok(g.includes(s),s);
 assert.match(read('assets/commerce.js'),/mountGallery/);assert.match(read('assets/product-selection.js'),/gallery\.set\(/);
 assert.doesNotMatch(read('iphone-16-pro-max/index.html'),/wa\.me[^"]*buy|Buy (on|via) WhatsApp/i);
});
test('speed: the font is served from our domain on every page; fonts are cached for a year; a branded 404 page exists',()=>{
 assert.ok(existsSync('assets/fonts/inter-latin-wght.woff2'));
 for(const p of ['index.html','iphone-16-pro-max/index.html','checkout/index.html','search/index.html','cart/index.html']){const h=read(p);assert.doesNotMatch(h,/fonts\.googleapis/,p);assert.match(h,/inter-latin-wght\.woff2/,p);}
 const v=JSON.parse(read('vercel.json'));assert.ok(v.headers.some(h=>h.source==='/assets/fonts/(.*)'&&/immutable/.test(h.headers[0].value)));
 const nf=read('404.html');assert.match(nf,/noindex/);assert.match(nf,/action="\/search\/"/);
});
test('reservation abuse limits are enforced in the database and their message reaches the customer',async()=>{
 const sql=read('supabase/migrations/20261121090000_reservation_limits.sql').replace(/--.*$/gm,'');
 assert.doesNotMatch(sql,/drop (table|column)|delete from|truncate/i);assert.match(sql,/>=3 then/);assert.match(sql,/interval '1 hour'\)>=60/);
 const {default:create}=await import('../api/shop/create.mjs');
 const env={SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'x',PAYSTACK_SECRET_KEY:'sk_test_x',SHOP_ORIGIN:'https://shop.example'};const prev={...process.env};Object.assign(process.env,env);const old=globalThis.fetch;
 globalThis.fetch=async url=>url.includes('rpc/shop_create_order_v3')?{ok:false,status:400,json:async()=>({message:'You already have 3 open reservations. Please collect or cancel one first, or contact us on WhatsApp'})}:{ok:true,json:async()=>[{sku:'ip|256',product_data:{model:'iPhone'}}]};
 let status,out;const res={status(n){status=n;return this},setHeader(){return this},json(v){out=v;return this}};
 const {lagosToday}=await import('../commerce/checkout-validation.mjs');
 try{await create({method:'POST',headers:{origin:'https://shop.example'},body:{requestId:'12345678-1234-1234-1234-123456789abc',firstName:'Ada',lastName:'Obi',email:'ada@gmail.com',phone:'08031234567',agreed:true,items:[{sku:'ip|256',quantity:1}],deliveryMethod:'store_pickup',paymentMethod:'pay_at_pickup',pickupDate:lagosToday(),expectedTotalNgn:1}},res);}
 finally{globalThis.fetch=old;for(const k of Object.keys(env))if(prev[k]===undefined)delete process.env[k];else process.env[k]=prev[k];}
 assert.equal(status,429);assert.match(out.error,/3 open reservations/);
});
