import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {media,card,listable,featuredCard,hotDealsHtml,stockLabel,optionLabel,money,fallbackKind} from '../assets/storefront-ui.mjs';
import {eligibleDeals,dealPrice,pricedVariant,DEAL_LIMIT} from '../commerce/deals.mjs';
import {injectDeals,skuFilter,DEALS_OPEN,DEALS_CLOSE} from '../commerce/home-render.mjs';
import {cleanStock,stockProblem} from '../commerce/stock.mjs';
import {cleanPhotos,primaryPhoto,photoFor} from '../commerce/product-photos.mjs';
import {validateReview,publicReview,validGoogleReviewsUrl} from '../commerce/reviews.mjs';
import {readWishlist,toggleWishlist} from '../commerce/wishlist.mjs';
import {validateProductEdit} from '../commerce/admin-catalogue.mjs';
import {productMeta,productSchema,applyExperience} from '../scripts/apply-experience.mjs';
import {retailInventory} from '../commerce/retail-inventory.mjs';
import {dealsHealth} from '../assets/admin-extras.mjs';
const read=f=>readFileSync(f,'utf8');
const pages=()=>{const out=[];const walk=d=>{for(const e of readdirSync(d,{withFileTypes:true})){if(e.isDirectory()){if(!['node_modules','.git','docs','tests','supabase','templates','landing-pages'].includes(e.name))walk(d+'/'+e.name);}else if(e.name==='index.html')out.push(d+'/'+e.name);}};walk('.');return out;};
const deal=(sku,price,extra={})=>pricedVariant({sku,price_ngn:price,enabled:true,product_data:{slug:sku.split('|')[0],model:'Phone '+sku,storage:'256GB',condition:'UK Used',image:'/images/x-720.webp',...extra}},true);

// Fix 1
test('no customer page shows internal photo wording; missing photos get a neutral category placeholder',()=>{
 for(const f of pages())assert.doesNotMatch(read(f),/Photo pending verification|Photo coming soon/,f);
 const html=media('','Apple Watch Ultra 4');assert.match(html,/is-missing/);assert.match(html,/<svg/);assert.doesNotMatch(html,/<img/);
 assert.equal(fallbackKind('Apple Watch Ultra 4'),'watch');assert.equal(fallbackKind('AirPods Pro 3'),'audio');assert.equal(fallbackKind('iPad Air'),'tablet');assert.equal(fallbackKind('iPhone 15'),'phone');
});
// Fix 2
test('Hot Deals: exactly 10% off, at most four, no duplicates, no unpriced, disabled or out-of-stock deals',()=>{
 const rows=[deal('a|1',850000),deal('a|1',850000),deal('b|1',null),deal('c|1',500000,{stockStatus:'out_of_stock'}),{...deal('d|1',400000),enabled:false},deal('e|1',1000000),deal('f|1',700000),deal('g|1',600000),deal('h|1',900000)];
 const ok=eligibleDeals(rows);assert.equal(ok.length,DEAL_LIMIT);assert.deepEqual(ok.map(v=>v.sku),['a|1','e|1','f|1','g|1']);
 for(const v of ok){assert.equal(v.price,dealPrice(v.originalPrice));assert.equal(v.price,Math.round(v.originalPrice*0.9));}
 assert.equal(eligibleDeals([deal('a|1',850000)]).length,1,'never padded to four');
 const cardHtml=featuredCard(ok[0]);assert.match(cardHtml,/<del>.*₦850,000<\/del><strong class="store-price">₦765,000<\/strong>/);assert.match(cardHtml,/-10%/);assert.match(cardHtml,/class="store-phone"/);
});
test('Hot Deals are placed in the HTML on the server, and any failure leaves the static page untouched',async()=>{
 const home=read('index.html');assert.ok(home.includes(DEALS_OPEN)&&home.includes(DEALS_CLOSE));assert.doesNotMatch(home,/Loading current deals/);
 const out=injectDeals(home,hotDealsHtml([deal('a|1',850000),deal('e|1',1000000)]));assert.match(out,/id="hotDeals"[^>]*><!--hot-deals--><article class="store-phone"/);assert.equal((out.match(/data-deal-sku=/g)||[]).length,2);
 assert.equal(injectDeals(home,''),home);assert.equal(injectDeals('<p>no markers</p>','<b>x</b>'),'<p>no markers</p>');
 assert.equal(skuFilter(['a|256GB · Blue/Orange','q"x']),'in.("a|256GB · Blue/Orange","q\\"x")');
 const mw=read('middleware.js');assert.match(mw,/matcher:\['\/','\/deals','\/deals\/',/);assert.match(mw,/catch\{return pass\(\);\}/);assert.doesNotMatch(mw,/console\.log/);
 // run the middleware with a fake network: it must inject deals and never recurse
 const {default:middleware}=await import('../middleware.js');const keep={fetch:globalThis.fetch,u:process.env.SUPABASE_URL,k:process.env.SUPABASE_SERVICE_ROLE_KEY};
 try{process.env.SUPABASE_URL='https://db.test';process.env.SUPABASE_SERVICE_ROLE_KEY='k';
  globalThis.fetch=async(url,o={})=>{url=String(url);if(url.startsWith('https://db.test/rest/v1/shop_deal_settings'))return Response.json([{skus:['a|1']}]);if(url.startsWith('https://db.test/rest/v1/checkout_inventory'))return Response.json([{sku:'a|1',price_ngn:850000,enabled:true,product_data:{slug:'a',model:'Phone A',storage:'256GB',condition:'UK Used'}}]);assert.equal(new Headers(o.headers).get('x-mg-render'),'1');return new Response(home,{headers:{'content-type':'text/html'}});};
  const res=await middleware(new Request('https://shop.test/'));assert.equal(res.headers.get('x-mg-deals'),'server');assert.match(await res.text(),/₦765,000/);
  assert.equal((await middleware(new Request('https://shop.test/',{headers:{'x-mg-render':'1'}}))).headers.get('x-middleware-next'),'1');
  globalThis.fetch=async()=>{throw Error('down');};assert.equal((await middleware(new Request('https://shop.test/'))).headers.get('x-middleware-next'),'1');
 }finally{globalThis.fetch=keep.fetch;if(keep.u===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=keep.u;if(keep.k===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=keep.k;}
});
test('admin is told plainly when fewer than four valid deals are live',()=>{
 const inv=['a','b','c','d','e'].map(s=>({sku:s,enabled:true,price_ngn:1000,product_data:{}}));
 assert.equal(dealsHealth(['a','b','c','d'],inv),'');assert.match(dealsHealth(['a','b','c','d','e'],inv),/publish exactly 4/);assert.match(dealsHealth(['a','b'],inv),/2 of 4/);
});
// Fix 3
test('reviews: real entries only, evidence stays private, verified only for a paid order, photo only with consent',()=>{
 assert.throws(()=>validateReview({displayName:'Ada',body:'Great'}),/where this review came from/);
 assert.throws(()=>validateReview({displayName:'Ada',body:'Great',evidence:'WhatsApp',photoUrl:'https://x.test/a.jpg'}),/permission/);
 assert.throws(()=>validateReview({displayName:'Ada',body:'Great',evidence:'x',rating:6}),/Rating/);
 const row=validateReview({displayName:'Ada O.',body:'Phone was as described.',evidence:'WhatsApp 3 Nov',orderReference:'MGP2-'+'a'.repeat(32),published:true});
 assert.equal(row.rating,null);
 const pub=publicReview(row,new Set());assert.equal(pub.verified,false);assert.doesNotMatch(JSON.stringify(pub),/WhatsApp|MGP2/);
 assert.equal(publicReview(row,new Set([row.order_reference])).verified,true);
 assert.equal(publicReview({...row,photo_url:'https://x.test/a.jpg',photo_consent:false}).photo,null);
 assert.equal(validGoogleReviewsUrl(''),'');assert.throws(()=>validGoogleReviewsUrl('https://evil.example/reviews'));assert.match(validGoogleReviewsUrl('https://g.page/r/abc/review'),/g\.page/);
 const home=read('index.html');assert.match(home,/<section class="store-section reviews-section" id="reviews" data-reviews hidden/);assert.doesNotMatch(home,/aggregateRating|"review"/);
 const sql=read('supabase/migrations/20261115160000_reviews_and_google_link.sql');assert.match(sql,/enable row level security/);assert.doesNotMatch(sql,/\bdrop\b|\btruncate\b|\bdelete\b/i);
});
// Fix 4
test('pricing: one naira format, unpriced products are not listed, year-as-storage is not shown as storage',()=>{
 assert.equal(money(850000),'₦850,000');
 assert.equal(listable({variants:[{price:null},{price:0}]}),false);assert.equal(listable({variants:[{price:5,enabled:false}]}),false);assert.equal(listable({variants:[{price:5}]}),true);
 for(const f of ['index.html','search/index.html','iphones/index.html','shop/watches/index.html'])assert.doesNotMatch(read(f),/Price coming soon|Price being updated|Price on request/,f);
 assert.equal(optionLabel('2026'),'Standard');assert.equal(optionLabel('256GB'),'256GB');
 assert.doesNotMatch(card({slug:'w',route:'/w/',model:'Watch',image:'',conditions:['Brand New'],variants:[{storage:'2026',price:10}]}),/store-storage">2026/);
});
// Fix 5 + 10
test('account icon, wishlist and Quick View exist and never replace the card structure',()=>{
 const ex=read('assets/experience.mjs');for(const t of ['mg-wish','mg-quick','Quick view','View Product','Add to Cart','aria-modal="true"','Escape'])assert.ok(ex.includes(t),t);
 assert.match(read('assets/sales.js'),/experience\.mjs/);assert.ok(existsSync('account/index.html'));assert.match(read('account/index.html'),/id="saved-items"/);assert.match(read('account/index.html'),/id="track-order"/);
 const mem=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};},s=mem();
 assert.equal(toggleWishlist(s,'iphone-15').saved,true);assert.deepEqual(readWishlist(s),['iphone-15']);assert.equal(toggleWishlist(s,'iphone-15').saved,false);assert.deepEqual(readWishlist(s),[]);
 s.setItem('mikee-wishlist-v1','["ok-1","<script>",5]');assert.deepEqual(readWishlist(s),['ok-1']);
});
// Fix 6
test('homepage has quick chips and no visible advanced panel; the Shop page has the full shareable filters',()=>{
 const home=read('index.html'),shop=read('search/index.html');
 assert.match(home,/class="quick-chips"/);assert.match(home,/data-chip-condition="UK Used"/);assert.match(home,/<form id="catalogFilters" class="catalog-filters" hidden>/);assert.match(home,/id="homePhoneSearch"/);
 assert.doesNotMatch(shop,/quick-chips/);assert.match(shop,/<form id="catalogFilters" class="catalog-filters">/);
 for(const id of ['categoryFilter','brandFilter','seriesFilter','budgetFilter','conditionFilter','connectivityFilter','colourFilter','storageFilter'])assert.ok(shop.includes(`id="${id}"`),id);
 const js=read('assets/storefront.js');for(const k of ['brand','series','price','condition','connectivity','colour','storage'])assert.ok(js.includes(`'${k}'`),k);
});
// Fix 7
test('trust strip uses the approved messages and the four policy pages exist and are linked',()=>{
 const home=read('index.html'),product=read('iphone-15/index.html');
 for(const t of ['7-day warranty','Free pickup in Computer Village','Delivery across Lagos and to every state','Secure Paystack payment','Pay Small Small with Credit Direct','Computer Village, Ikeja']){assert.ok(home.includes(t),t);assert.ok(product.includes(t),t);}
 assert.match(home,/100% genuine devices/);assert.doesNotMatch(home,/Test before you pay/); // owner, 23 Nov 2026: removed from the trust strip
 assert.equal((product.match(/class="mg-trust"/g)||[]).length,1);
 for(const p of ['warranty-policy','returns-refunds','delivery-policy','terms','privacy-policy']){assert.ok(existsSync(p+'/index.html'),p);assert.ok(home.includes(`href="/${p}/"`),p);assert.match(read(p+'/index.html'),/Nothing on this page limits any right you have/);}
 assert.match(read('returns-refunds/index.html'),/changed your mind after delivery or collection/);
});
// Fix 8
test('stock: only confirmed states, never an invented number, and checkout re-checks on the server',()=>{
 assert.equal(stockLabel({}),'');assert.equal(stockLabel({stockStatus:'in_stock'}),'In stock');assert.equal(stockLabel({stockStatus:'in_stock',stockQty:3}),'Only 3 left');assert.equal(stockLabel({stockStatus:'in_stock',stockQty:40}),'In stock');
 assert.equal(stockLabel({stockStatus:'out_of_stock'}),'Out of stock');assert.equal(stockLabel({stockStatus:'confirm'}),'Availability to be confirmed');
 assert.deepEqual(cleanStock({stockStatus:'in_stock',stockQty:0}),{stockStatus:'out_of_stock',stockQty:null,availabilityDate:''});assert.deepEqual(cleanStock({stockStatus:'made-up',stockQty:9}),{stockStatus:'',stockQty:null,availabilityDate:''});assert.deepEqual(cleanStock({stockStatus:'confirm',stockQty:4}),{stockStatus:'confirm',stockQty:null,availabilityDate:''});
 const rows=[{sku:'a',product_data:{model:'A',stockStatus:'out_of_stock'}},{sku:'b',product_data:{model:'B',stockStatus:'in_stock',stockQty:1}},{sku:'c',product_data:{model:'C'}}];
 assert.match(stockProblem([{sku:'a',quantity:1}],rows),/out of stock/);assert.match(stockProblem([{sku:'b',quantity:1},{sku:'b',quantity:1}],rows),/Only 1/);assert.equal(stockProblem([{sku:'b',quantity:1},{sku:'c',quantity:5}],rows),'');
 const create=read('api/shop/create.mjs');assert.ok(create.indexOf('stockProblem(')<create.indexOf("rpc/shop_create_order_v3',{method"),'stock is checked before the order is created');
});
// Fix 9
test('catalogue audit report exists with the required columns',()=>{
 const csv=read('docs/catalogue-audit.csv');assert.match(csv.split('\r\n')[0],/"Product ID","Product name","Problem","Existing value","Proposed correction","Confidence","Manual action required"/);
 assert.ok(csv.split('\r\n').length>50);assert.ok(JSON.parse(read('docs/catalogue-audit-summary.json')).products===retailInventory.length);
});
// Fix 11
test('SEO: product pages have unique titles/descriptions, canonical, OG tags and honest structured data',()=>{
 const titles=new Set(),descs=new Set();
 for(const p of retailInventory){const f=p.slug+'/index.html';if(!existsSync(f))continue;const html=read(f),m=productMeta(p);
  assert.ok(html.includes('<link rel="canonical"'),f);for(const og of ['og:title','og:description','og:url','og:type'])assert.ok(html.includes(`property="${og}"`),f+' '+og);
  assert.doesNotMatch(html.match(/<title>[\s\S]*?<\/title>/)[0],/Confirm condition|\| [a-z0-9-]+ \|/,f);
  const photo=p.image&&!p.image.endsWith('.svg');assert.equal((html.match(/data-product-schema/g)||[]).length,photo?1:0,f);titles.add(m.title);descs.add(m.description);
  assert.doesNotMatch(html,/aggregateRating|reviewCount/,f);}
 assert.equal(titles.size,descs.size);
 const priced=retailInventory.find(p=>p.variants.some(v=>v.price>0)),unpriced=retailInventory.find(p=>!p.variants.some(v=>v.price>0));
 assert.equal(productSchema(priced,'https://x/'+priced.slug,''),null,'no product markup without a photo');assert.equal(productSchema(priced,'https://x/'+priced.slug,'https://x/a.svg'),null,'placeholder art is not a photo');
 const s=productSchema(priced,'https://x/'+priced.slug,'https://x/a.webp');assert.ok(s.offers.every(o=>o.price>0&&o.priceCurrency==='NGN'&&!('availability' in o)),'no availability claim without confirmed stock');
 if(unpriced)assert.equal('offers' in productSchema(unpriced,'https://x/u','https://x/u.webp'),false,'no fabricated offer for an unpriced product');
 assert.match(read('cart/index.html'),/<meta name="robots" content="noindex,follow">/);assert.match(read('cart/index.html'),/property="og:url" content="https:\/\/www\.mikeegadget\.com\.ng\/cart\/"/);
 const once=read('iphone-15/index.html');assert.equal(applyExperience(applyExperience(once,'iphone-15/index.html'),'iphone-15/index.html'),applyExperience(once,'iphone-15/index.html'));
});
// Fix 12
test('category carousel still moves one card every four seconds and payment wording is current',async()=>{
 const {CATEGORY_TIMING}=await import('../assets/category-carousel.js');assert.equal(CATEGORY_TIMING.interval,4000);
 const js=read('assets/category-carousel.js');assert.equal((js.match(/setInterval\(/g)||[]).length,1);assert.match(js,/prefers-reduced-motion/);
 for(const f of ['index.html','iphone-15/index.html','cart/index.html'])assert.doesNotMatch(read(f),/EasyBuy Available|Easy Buy calculator|>EasyBuy</,f);
});
// Fix 13
test('photos: nothing is published without approval, source and permission; colour photos never cross variants',()=>{
 assert.throws(()=>cleanPhotos([{url:'https://x.test/a.webp',approved:true}]),/source and the permission/);
 assert.throws(()=>cleanPhotos([{url:'javascript:alert(1)'}]),/local or HTTPS/);
 const list=cleanPhotos([{url:'https://x.test/a.webp',approved:false,source:'supplier'},{url:'/images/b.webp',approved:true,source:'own',licence:'Taken in store',color:'Blue'},{url:'/images/c.webp',approved:true,primary:true,source:'own',licence:'Taken in store'}]);
 assert.equal(primaryPhoto(list),'/images/c.webp');assert.equal(list.filter(p=>p.primary).length,1);
 assert.equal(primaryPhoto(cleanPhotos([{url:'https://x.test/a.webp',approved:false}])),'','an unapproved candidate is never the public photo');
 assert.equal(photoFor({image:'/images/c.webp',images:list},'Blue'),'/images/b.webp');assert.equal(photoFor({image:'/images/c.webp',images:list},'Red'),'/images/c.webp');
 const p=retailInventory.find(x=>!x.isPhone),current={slug:p.slug,sku:p.slug+'|x',storage:'x',image:'/images/old.webp'};
 const saved=validateProductEdit(current,{condition:'Brand New',colors:[],image:'/images/old.webp',capacity:'x',stockStatus:'in_stock',stockQty:2,images:[{url:'https://x.test/new.webp',approved:false}]});
 assert.equal(saved.image,'');assert.equal(saved.stockQty,2);assert.equal(saved.slug,current.slug);
 const admin=read('assets/admin-extras.mjs');for(const t of ['Approved for the website','Main photo','Permission / licence note','Check photos','not connected to any licensed source'])assert.ok(admin.includes(t),t);
});
// Payments untouched
test('payment safety is unchanged: live keys still gated, webhook still signature-checked, Credit Direct intact',()=>{
 const shop=read('api/_shop.mjs');assert.match(shop,/SHOP_LIVE_PAYMENTS/);
 assert.match(read('api/shop/webhook.mjs'),/x-paystack-signature|svix/i);
 const create=read('api/shop/create.mjs');assert.match(create,/credit_direct/);assert.match(create,/expectedTotalNgn!==Number\(result\.amount_ngn\)/);
 for(const f of ['middleware.js','assets/experience.mjs','assets/admin-extras.mjs','assets/storefront-ui.mjs'])assert.doesNotMatch(read(f),/sk_live|sk_test|PAYSTACK_SECRET|CREDIT_DIRECT_PRIVATE/,f);
});
