// Search and AI-search visibility: crawl rules, sitemap, canonicals, structured data, live-price snippets and the
// ChatGPT product feed. Runs against the built site (npm run build first; npm run check does).
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';import {join} from 'node:path';
import {SITE,sitemapUrls,BUYER_FAQS} from '../commerce/seo.mjs';
import {openaiRows,validateRow,money,REQUIRED} from '../commerce/openai-feed.mjs';
import {renderProductPage} from '../commerce/product-render.mjs';
const read=f=>readFileSync(f,'utf8');
const SKIP=new Set(['node_modules','.git','.vercel','supabase','tests','docs','templates','landing-pages','scripts','commerce','api','assets','images']);
const pages=[];(function walk(d){for(const e of readdirSync(d||'.',{withFileTypes:true})){const p=join(d,e.name);if(e.isDirectory()){if(!SKIP.has(e.name)&&!e.name.startsWith('.'))walk(p);}else if(e.name==='index.html')pages.push(p);}})('');
const info=f=>{const h=read(f),path=f.replace(/\/?index\.html$/,'');return {f,path,h,canonical:h.match(/<link rel="canonical" href="([^"]+)"/)?.[1],robots:h.match(/<meta name="robots" content="([^"]+)"/)?.[1]||'',
 title:h.match(/<title>([^<]*)<\/title>/)?.[1],desc:h.match(/<meta name="description" content="([^"]*)"/)?.[1],h1:(h.match(/<h1[\s>]/g)||[]).length};};
const all=pages.map(info),indexable=all.filter(p=>!/noindex/.test(p.robots));
const ld=h=>[...h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));

test('robots.txt lets Google, Bing and AI search crawlers (OAI-SearchBot, ChatGPT-User) read public pages',()=>{
 const r=read('robots.txt');
 assert.match(r,/^User-agent: \*$/m);assert.match(r,/^Allow: \/$/m);assert.doesNotMatch(r,/^Disallow: \/\s*$/m,'the whole site is never blocked');
 assert.doesNotMatch(r,/User-agent: (OAI-SearchBot|ChatGPT-User|GPTBot|Googlebot|Bingbot)/i,'no crawler is singled out');
 for(const p of ['/admin/','/api/','/checkout/','/cart/','/account/'])assert.match(r,new RegExp(`^Disallow: ${p}$`,'m'));
 assert.match(r,/^Sitemap: https:\/\/www\.mikeegadget\.com\.ng\/sitemap\.xml$/m);
 const v=JSON.parse(read('vercel.json'));assert.ok(!(v.headers||[]).some(h=>h.headers.some(x=>/x-robots-tag/i.test(x.key)&&/noindex/i.test(x.value)&&!/feed|api/.test(h.source))),'no site-wide noindex header');
});
test('sitemap.xml lists exactly the indexable, self-canonical, non-redirected pages',()=>{
 const urls=[...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 assert.ok(urls.length>200);assert.equal(new Set(urls).size,urls.length,'no duplicates');
 for(const u of urls){assert.ok(u.startsWith(SITE+'/'),u);const p=all.find(x=>x.canonical===u);assert.ok(p,`sitemap URL without a page whose canonical is it: ${u}`);assert.doesNotMatch(p.robots,/noindex/,u);}
 for(const bad of ['/buy/','/checkout/','/cart/','/account/','/admin/','/swap/','/easybuy/','/easy-buy/'])assert.ok(!urls.includes(SITE+bad),bad);
 for(const good of ['/','/about/','/faq/','/contact/','/financing/','/phone-swap','/iphones','/samsung-phones','/google-pixel-phones','/uk-used-iphones','/iphone-15-pro-max','/privacy-policy/'])assert.ok(urls.includes(SITE+good),good);
 const redirects=JSON.parse(read('vercel.json')).redirects.map(r=>r.source.replace(/\/$/,''));for(const u of urls)assert.ok(!redirects.includes(new URL(u).pathname.replace(/\/$/,'')||'/'),u);
 assert.deepEqual(sitemapUrls([{path:'a',canonical:SITE+'/a',robots:''},{path:'b',canonical:SITE+'/a',robots:''},{path:'c',canonical:SITE+'/c',robots:'noindex,follow'},{path:'d',canonical:SITE+'/d'}],{redirectSources:['/d']}),[SITE+'/a']);
});
test('every indexable page has one canonical (our domain), a title, a description and one H1; alias pages point to the main page',()=>{
 for(const p of indexable){assert.ok(p.canonical?.startsWith(SITE),`${p.f}: canonical`);assert.ok(p.title,`${p.f}: title`);assert.ok(p.desc,`${p.f}: description`);assert.equal(p.h1,1,`${p.f}: H1 count`);
  assert.equal((p.h.match(/<link rel="canonical"/g)||[]).length,1,`${p.f}: one canonical`);}
 assert.equal(all.find(p=>p.path==='swap').canonical,SITE+'/phone-swap');assert.equal(all.find(p=>p.path==='easybuy').canonical,SITE+'/financing/');
 for(const p of ['checkout','cart','account','buy','admin'])assert.match(all.find(x=>x.path===p).robots,/noindex/,p);
 const titles=new Map();for(const p of indexable.filter(p=>p.canonical===SITE+'/'+p.path||p.canonical===SITE+'/'+p.path+'/')){assert.ok(!titles.has(p.title),`duplicate title: ${p.title} (${p.f}, ${titles.get(p.title)})`);titles.set(p.title,p.f);}
});
test('structured data: valid JSON-LD; Organization links the trading name to the registered company; no invented facts',()=>{
 for(const p of all)ld(p.h); // throws on invalid JSON
 const g=ld(read('index.html')).find(x=>x['@graph'])['@graph'],org=g.find(x=>x['@type']==='Organization');
 assert.equal(org.name,'Mikee Gadget Plug');assert.equal(org.legalName,'MIKEEGADGETS & COMMUNICATIONS LIMITED');assert.equal(org.telephone,'+2347086865133');
 assert.equal(org.address.addressLocality,'Ikeja');assert.ok(g.some(x=>x['@type']==='WebSite'&&x.potentialAction));
 const store=g.find(x=>[].concat(x['@type']).includes('MobilePhoneStore'));assert.equal(store.parentOrganization['@id'],org['@id']);
 const text=JSON.stringify(g);assert.doesNotMatch(text,/aggregateRating|review|ratingValue|foundingDate|openingHoursSpecification/i,'no ratings, reviews or guessed hours');
 assert.ok(all.filter(p=>/#localbusiness/.test(p.h)).length===0,'old LocalBusiness block replaced everywhere');
 for(const [path,type] of [['faq','FAQPage'],['about','AboutPage'],['contact','ContactPage']])assert.ok(ld(read(path+'/index.html')).some(x=>x['@type']===type),path);
});
test('category pages: the full range is in the HTML (ItemList + links), not only the first 8 cards',()=>{
 for(const path of ['iphones','samsung-phones','google-pixel-phones','shop/watches']){const h=read(path+'/index.html');
  const list=ld(h).find(x=>x['@type']==='ItemList');assert.ok(list&&list.numberOfItems>=list.itemListElement.length&&list.itemListElement.length>0,path);
  const links=[...h.matchAll(/<section class="store-section all-models"[\s\S]*?<\/section>/g)][0]?.[0]||'';assert.equal((links.match(/<li><a href=/g)||[]).length,list.numberOfItems,path);
  for(const it of list.itemListElement)assert.ok(all.some(p=>p.canonical===it.url),`${path}: ${it.url} is a real page`);}
 assert.ok(ld(read('samsung-phones/index.html')).find(x=>x['@type']==='ItemList').numberOfItems>8);
});
test('buyer facts are the owner’s: battery above 85%, Face ID, opens 10am, Easy Buy options; nothing says 83%',()=>{
 const faq=read('faq/index.html');for(const s of ['battery health above 85%','working Face ID','opens at 10am','50% down payment','MIKEEGADGETS &amp; COMMUNICATIONS LIMITED'])assert.ok(faq.includes(s),s);
 assert.equal(ld(faq).find(x=>x['@type']==='FAQPage').mainEntity.length,BUYER_FAQS.length);
 for(const p of all)assert.doesNotMatch(p.h,/above 83%/,p.f);
 for(const p of ['about','contact','faq'])assert.match(read('index.html').replace(/[\s\S]*<footer/,'')+read(p+'/index.html'),new RegExp(`href="/${p}/"`));
});
test('product pages: snippet text and buyer FAQs carry the live price (Hot Deal) the shopper sees',()=>{
 const html=read('iphone-15-pro-max/index.html');
 const out=renderProductPage(html,{slug:'iphone-15-pro-max',items:[],variants:[{sku:'iphone-15-pro-max|256GB',price:846000,originalPrice:940000,condition:'UK Used',capacity:'256GB'}]});
 assert.match(out.match(/<meta name="description" content="[^"]*"/)[0],/for ₦846,000/);assert.match(out.match(/<meta property="og:description" content="[^"]*"/)[0],/for ₦846,000/);
 assert.equal((out.match(/currently costs ₦846,000 \(256GB, UK Used\)/g)||[]).length,2,'visible FAQ and FAQ structured data');
 assert.match(out,/The iPhone 15 Pro Max 256GB is ₦846,000 \(UK Used\)/);assert.match(out,/"storage":"256GB","price":846000/);
 assert.equal(renderProductPage(html,{slug:'x',items:[],variants:[]}).match(/<meta name="description" content="[^"]*"/)[0],html.match(/<meta name="description" content="[^"]*"/)[0],'no data → page unchanged');
 assert.doesNotMatch(html,/request a valuation on WhatsApp/);assert.match(html,/battery health above 85%/);
});
test('ChatGPT product feed follows the OpenAI spec and uses catalogue prices only',async()=>{
 const {buildItems}=await import('../commerce/merchant.mjs');const pages=(await import('../commerce/merchant-products.mjs')).default;
 const slug='iphone-15-pro-max';const row=(sku,price,d,x={})=>({sku,price_ngn:price,enabled:true,deal_position:null,product_data:{slug,brand:'Apple',model:'iPhone 15 Pro Max',category:'iphones',condition:'UK Used',capacity:sku.split('|')[1],stockStatus:'in_stock',image:'/images/store/15promax-1-720.webp',...d},...x});
 const rows=[row(`${slug}|256GB`,940000,{},{deal_position:1}),row(`${slug}|512GB`,1000000,{stockStatus:''}),row(`${slug}|1TB`,0,{})];
 const {items}=buildItems(rows,{pages,rates:[{fee_ngn:15000,enabled:true}]});const {rows:feed}=openaiRows(items);
 assert.equal(feed.length,1,'only the variant with a price, availability and page');
 const r=feed[0];for(const k of REQUIRED)assert.ok(r[k]!==undefined&&r[k]!=='',k);assert.deepEqual(validateRow(r),[]);
 assert.equal(r.price,'940000.00 NGN');assert.equal(r.sale_price,'846000.00 NGN');assert.equal(r.condition,'used');assert.deepEqual(r.target_countries,['NG']);assert.equal(r.store_country,'NG');
 assert.equal(r.seller_name,'Mikee Gadget Plug');assert.equal(r.is_eligible_checkout,false);assert.match(r.url,/^https:\/\/www\.mikeegadget\.com\.ng\/iphone-15-pro-max\?sku=/);
 assert.equal(money(1234),'1234.00 NGN');assert.deepEqual(validateRow({...r,price:'₦940,000'}),['price format']);assert.ok(validateRow({...r,sale_price:'990000.00 NGN'}).length);
 const v=JSON.parse(read('vercel.json'));assert.ok(v.rewrites.some(x=>x.source==='/openai-product-feed.jsonl'&&x.destination==='/api/shop/catalog?format=openai'));
});
test('ChatGPT feed endpoint: JSONL from Supabase, noindex, 503 when the catalogue is unavailable (never an empty feed)',async()=>{
 const prev={...process.env};Object.assign(process.env,{SUPABASE_URL:'https://db.test',SUPABASE_SERVICE_ROLE_KEY:'k'});const old=globalThis.fetch;
 const slug='iphone-15-pro-max';let down=false;
 globalThis.fetch=async u=>{if(down)return {ok:false,status:500,json:async()=>({})};u=String(u);
  if(u.includes('shop_deal_catalogue'))return {ok:true,status:200,json:async()=>[{sku:`${slug}|256GB`,price_ngn:940000,enabled:true,deal_position:null,product_data:{slug,brand:'Apple',model:'iPhone 15 Pro Max',category:'iphones',condition:'UK Used',capacity:'256GB',stockStatus:'in_stock',image:'/images/store/15promax-1-720.webp'}}]};
  if(u.includes('shop_delivery_rates'))return {ok:true,status:200,json:async()=>[{fee_ngn:15000,enabled:true}]};return {ok:false,status:404,json:async()=>({})};};
 try{const {default:handler}=await import('../api/shop/catalog.mjs');
  const res=()=>{const o={h:{}};const r={status(n){o.status=n;return r},setHeader(k,v){o.h[k.toLowerCase()]=v;return r},send(b){o.body=b;return r},json(b){o.body=b;return r}};return {o,r};};
  const a=res();await handler({method:'GET',query:{format:'openai'}},a.r);assert.equal(a.o.status,200);assert.match(a.o.h['content-type'],/ndjson/);assert.equal(a.o.h['x-robots-tag'],'noindex');
  const lines=a.o.body.trim().split('\n').map(JSON.parse);assert.equal(lines.length,1);assert.equal(lines[0].price,'940000.00 NGN');
  down=true;const b=res();await handler({method:'GET',query:{format:'openai'}},b.r);assert.equal(b.o.status,503);
 }finally{globalThis.fetch=old;for(const k of Object.keys(process.env))if(!(k in prev))delete process.env[k];Object.assign(process.env,prev);}
});
test('llms.txt summarises the store for AI tools with verified facts and links to real pages',()=>{
 assert.ok(existsSync('llms.txt'));const t=read('llms.txt');assert.match(t,/^# Mikee Gadget Plug/);assert.match(t,/MIKEEGADGETS & COMMUNICATIONS LIMITED/);
 for(const u of [...t.matchAll(/\]\((https:[^)]+)\)/g)].map(m=>m[1]))assert.ok(all.some(p=>p.canonical===u),u);
});
