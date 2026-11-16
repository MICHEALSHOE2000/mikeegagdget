import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {retailInventory} from '../commerce/retail-inventory.mjs';
import {APPROVED_UPDATES,APPROVED_NEW_VARIANTS,APPROVED_NEW_PRODUCTS,UNRESOLVED} from '../commerce/approved-prices-2026-11-16.mjs';
import {isLatestSeries,validateDeals,pricedVariant,eligibleDeals} from '../commerce/deals.mjs';
import {suggestMatch,tokens,storageFromName,variantsForPhoto,hamming,NEAR_DUPLICATE,colourSuggestion} from '../commerce/image-match.mjs';
import {swatchColor} from '../commerce/variant-selection.mjs';
import {photoFor} from '../commerce/product-photos.mjs';
import {reviewPriceCsv} from '../commerce/bulk-prices.mjs';
import {listable} from '../assets/storefront-ui.mjs';
import {stage,approve} from '../api/admin/image.mjs';
import handler from '../api/admin/image.mjs';
const read=f=>readFileSync(f,'utf8');
const P=slug=>retailInventory.find(p=>p.slug===slug),V=(sku)=>{const [slug,label]=sku.split('|');return P(slug)?.variants.find(v=>v.storage===label);};
const shopData=JSON.parse(read('assets/shop-data.json')),SQL=read('supabase/migrations/20261116120000_approved_prices.sql'),FOLLOWUP=read('supabase/migrations/20261116150000_uk_used_duo_photos.sql');

// ---- prices ----
test('every approved price is on its exact existing variant, and the site data and migration agree',()=>{
 for(const u of APPROVED_UPDATES){const v=V(u.sku);assert.ok(v,u.sku);assert.equal(v.price,u.price,u.sku);
  assert.equal(shopData.find(r=>r.sku===u.sku).price,u.price,'shop data '+u.sku);
  assert.ok(SQL.includes(`price_ngn=${u.price},enabled=true`)&&SQL.includes(`where sku='${u.sku}' and price_ngn is not distinct from ${u.before===null?'null':u.before}`),'guarded migration '+u.sku);}
 for(const n of APPROVED_NEW_VARIANTS){const sku=n.slug+'|'+n.variant.storage;assert.equal(V(sku)?.price,n.variant.price,sku);assert.ok(SQL.includes(`'${sku}'`),sku);}
 assert.equal(V('iphone-18-pro-max|256GB · Burgundy').price,2250000);assert.equal(V('apple-pencil-pro|Standard').price,150000);
});
test('nothing was invented: pending prices stay pending, unlisted prices are untouched, no duplicate listings',()=>{
 const duo=P('iphone-duo');assert.ok(duo,'iPhone Duo exists once its identity was confirmed (Apple, released 23 Oct 2026)');
 assert.deepEqual(duo.variants.map(v=>[v.storage,v.price,v.condition,v.connectivity]),[['256GB · Star White',3300000,'Brand New','eSIM only'],['256GB · Night Sky',3300000,'Brand New','eSIM only'],['512GB · Star White',3700000,'Brand New','eSIM only']]);
 assert.equal(V('ipad-11th-gen|256GB · Cellular + Wi‑Fi').price,1090000);
 assert.equal(V('apple-watch-series-6|44mm · GPS').price,null);
 assert.equal(V('iphone-17-pro|256GB · Orange/Blue').price,1660000);assert.equal(V('iphone-17-pro|256GB · Orange/Blue').condition,'UK Used');
 assert.equal(V('iphone-18-pro|256GB · Glacier').price,1920000);
 const skus=retailInventory.flatMap(p=>p.variants.map(v=>p.slug+'|'+v.storage));assert.equal(new Set(skus).size,skus.length);
 assert.ok(UNRESOLVED.some(u=>/Series 6/.test(u.item)));
});
test('conditions come only from the owner: watches, keyboard cases and speakers are UK Used as confirmed; unpriced stays off',()=>{
 assert.ok(!APPROVED_NEW_PRODUCTS.some(p=>p.condition==='Confirm condition'));
 for(const slug of ['apple-watch-se','apple-watch-series-7','green-lion-keyboard-case-ipad-pro-13','jbl-flip-6','harman-kardon-onyx-studio-9']){const item=P(slug);assert.ok(item.variants.every(v=>v.condition==='UK Used'&&v.enabled!==false),slug);assert.equal(listable(item),true,slug);}
 assert.equal(V('apple-watch-series-6|44mm · GPS').enabled,false);
 assert.match(FOLLOWUP,/product_data->>'condition'='Confirm condition'/);assert.match(FOLLOWUP,/n<>21/);
 assert.ok(P('ipad-7th-gen').variants.every(v=>v.condition==='UK Used'&&v.enabled!==false));
 assert.match(SQL,/'jbl-flip-7\|Standard',160000,false,/);assert.match(SQL,/'ipad-8th-gen\|32GB · Wi‑Fi',200000,true,/);
});
test('eSIM only is not WiFi Only; eSIM-locked WiFi Only is labelled as restricted; Non-Active means Brand New',()=>{
 const air=V('iphone-17-air|256GB · Non-Active');assert.equal(air.connectivity,'eSIM only');assert.equal(air.condition,'Brand New');assert.equal(P('iphone-17-air').category,'iphones');
 const wifi=V('iphone-17-air-wifi-only|256GB · Brand New');assert.equal(wifi.connectivity,'Wi-Fi Only');assert.equal(wifi.price,800000);assert.equal(P('iphone-17-air-wifi-only').category,'wifi-only');
 for(const c of ['Burgundy','Glacier','Black']){const v=V(`iphone-18-pro-wifi-only|256GB · ${c} · Brand New`);assert.equal(v.connectivity,'Wi-Fi Only');assert.equal(v.simNote,'eSIM locked');}
 assert.equal(V('iphone-18-pro|256GB · Burgundy').connectivity,'Physical SIM + eSIM');
 assert.equal(V('iphone-17-pro-max|512GB · Silver · Brand New').activation,'To be confirmed');
 assert.match(read('assets/product-selection.js'),/Activation to be confirmed/);assert.match(read('assets/product-selection.js'),/v\.simNote\?`\$\{v\.connectivity\} \(\$\{v\.simNote\}\)`/);
 assert.ok(P('apple-watch-se').variants.every(v=>['GPS','GPS + Cellular (LTE)'].includes(v.connectivity)),'watch GPS and LTE are separate choices');
});
test('admin rules allow Brand New iPhone 17 and 18 in the database too',()=>{assert.match(SQL,/p_data->>'slug' ~ '\^iphone-1\[78\]-'/);});

// ---- Hot Deals / All Deals ----
test('the latest iPhone series is never an automatic Hot Deal',()=>{
 assert.equal(isLatestSeries('iphone-18-pro-max|256GB · Burgundy'),true);assert.equal(isLatestSeries('iphone-17-pro-max|256GB'),false);
 assert.throws(()=>validateDeals({revision:1,skus:['iphone-18-pro|256GB · Glacier']}),/latest iPhone/);
 const row=sku=>({sku,price_ngn:2000000,enabled:true,product_data:{slug:sku.split('|')[0]}});
 assert.equal(pricedVariant(row('iphone-18-pro|256GB · Glacier'),true).deal,false);assert.equal(pricedVariant(row('iphone-18-pro|256GB · Glacier'),true).price,2000000);
 assert.equal(pricedVariant(row('iphone-16-pro-max|256GB'),true).price,1800000);
 assert.equal(eligibleDeals([{...pricedVariant(row('iphone-18-pro|x'),true),deal:true,originalPrice:2,price:1}]).length,0);
 assert.match(SQL,/where s !~ '\^iphone-18\(-\|\\\|\)'/);assert.match(SQL,/The latest iPhone series cannot be a Hot Deal/);
});
test('All Deals lists the iPhone 18 Pro and Pro Max at their normal price with no crossed-out price',()=>{
 const html=read('deals/index.html'),all=html.slice(html.indexOf('id="all-deals-title"'));
 assert.match(all,/data-model="iphone-18-pro-max"/);assert.match(all,/data-model="iphone-18-pro"/);assert.doesNotMatch(all,/<del>|-10%|10% OFF/);
});

// ---- image matching ----
test('file names map to the right product; generation numbers and model suffixes must agree',()=>{
 const m=f=>suggestMatch({filename:f},retailInventory,swatchColor);
 const expect={'google_pixel_11proxl.webp':'pixel-11-pro-xl','ipad_air_8th_gen_11-inch_m4.webp':'ipad-air-8th-gen-11-inch-m4','apple_watch_ultra_4.webp':'apple-watch-ultra-4','google_pixel_10pro_xl.webp':'pixel-10-pro-xl','google_pixel_10pro.jpg':'pixel-10-pro','google_pixel_10.jpg':'pixel-10','google_pixel_9_pro_fold.jpg':'pixel-9-pro-fold','google_pixel_6a.webp':'pixel-6a','google_pixel_6.webp':'pixel-6'};
 for(const [f,slug] of Object.entries(expect)){const s=m(f);assert.equal(s.slug,slug,f);assert.equal(s.band,'high',f);}
 const typo=m('google_pixel_10pro_fod.png');assert.equal(typo.slug,'pixel-10-pro-fold');assert.equal(typo.band,'medium');assert.ok(typo.reasons.some(r=>/fod.*fold/.test(r)));
 const none=m('IMG_4471.jpg');assert.equal(none.slug,'');assert.equal(none.band,'low');
 assert.deepEqual(tokens('google_pixel_10pro_xl.webp'),['google','pixel','10','pro','xl']);assert.deepEqual(tokens('Pixel 6a 512GB'),['pixel','6a','512gb']);
});
test('colour comes from the file name or the photo; storage only from the file name, never from appearance',()=>{
 const p=P('iphone-18-pro-max');
 const named=suggestMatch({filename:'iphone_18_pro_max_burgundy.jpg'},retailInventory,swatchColor);assert.equal(named.color,'Burgundy');assert.equal(named.storage,'');
 const sized=suggestMatch({filename:'iphone-18-pro-max-black-512gb.png'},retailInventory,swatchColor);assert.equal(sized.storage,'512GB');
 assert.equal(storageFromName('iphone_18_pro_max.jpg'),'');
 assert.equal(colourSuggestion('x.jpg',p,[{rgb:[104,42,59],share:.5}],swatchColor).color,'Burgundy');
 const many=colourSuggestion('x.jpg',p,[{rgb:[200,220,60],share:.2},{rgb:[240,30,110],share:.2},{rgb:[60,60,64],share:.2},{rgb:[180,190,240],share:.2}],swatchColor);assert.equal(many.color,'');assert.match(many.note,/Several colours/);
 const shared=variantsForPhoto(p,'Black');assert.ok(shared.length>1&&shared.every(s=>s.includes('Black')),'one Black photo is linked to every Black storage variant');
 assert.equal(hamming('ffff0000ffff0000','ffff0000ffff0001'),1);assert.ok(hamming('0000000000000000','ffffffffffffffff')>NEAR_DUPLICATE);
});
test('the selected colour never shows another colour’s photo as if it were that colour',()=>{
 const v={image:'/images/generic.webp',images:[{url:'/images/burgundy.webp',approved:true,color:'Burgundy'},{url:'/images/black-pending.webp',approved:false,color:'Black'}]};
 assert.equal(photoFor(v,'Burgundy'),'/images/burgundy.webp');assert.equal(photoFor(v,'Black'),'/images/generic.webp');
 assert.match(read('assets/product-selection.js'),/Representative photo — the \$\{state\.color\} colour may look different\./);
});

// ---- staging API (network is simulated) ----
const webp=size=>{const b=Buffer.alloc(size);b.write('RIFF',0,'ascii');b.write('WEBP',8,'ascii');return b.toString('base64');};
function fakeNet(rows={}){const calls=[];const keep={fetch:globalThis.fetch,u:process.env.SUPABASE_URL,k:process.env.SUPABASE_SERVICE_ROLE_KEY};process.env.SUPABASE_URL='https://db.test';process.env.SUPABASE_SERVICE_ROLE_KEY='service';const site=process.env.SITE_URL;process.env.SITE_URL='https://www.mikeegadget.com.ng';keep.site=site;
 globalThis.fetch=async(url,o={})=>{url=String(url);const method=o.method||'GET';calls.push({url,method,body:o.body});
  if(url.includes('/rest/v1/shop_image_uploads?sha256'))return Response.json(rows.existing?[rows.existing]:[]);
  if(url.endsWith('/rest/v1/shop_image_uploads')&&method==='POST')return Response.json([{id:'00000000-0000-4000-8000-000000000001',...JSON.parse(o.body)}]);
  if(url.includes('/rest/v1/shop_image_uploads?id=eq.')&&method==='GET')return Response.json(rows.upload?[rows.upload]:[]);
  if(url.includes('/rest/v1/shop_image_uploads?id=eq.')&&method==='PATCH')return Response.json([{...rows.upload,...JSON.parse(o.body)}]);
  if(url.includes('/rest/v1/checkout_inventory'))return Response.json(rows.inventory||[]);
  if(url.includes('/rest/v1/rpc/shop_admin_update_product'))return Response.json({ok:true});
  if(url.includes('/storage/v1/'))return new Response('{}',{status:200});
  if(url.includes('/auth/v1/user'))return Response.json(rows.user||{},{status:rows.user?200:401});
  return new Response('[]');};
 return {calls,restore(){globalThis.fetch=keep.fetch;for(const [k,v] of [['SUPABASE_URL',keep.u],['SUPABASE_SERVICE_ROLE_KEY',keep.k],['SITE_URL',keep.site]])if(v===undefined)delete process.env[k];else process.env[k]=v;}};}
const user={id:'11111111-1111-4111-8111-111111111111'};
const body=(s={})=>({data:webp(2000),thumb:webp(500),sha256:'a'.repeat(64),phash:'0123456789abcdef',filename:'IMG_4471.jpg',suggestion:{slug:'',score:12,reasons:['No match']},...s});
test('uploads go only to the private staging area, and a low-confidence match does not modify any product',async()=>{
 const net=fakeNet();try{const row=await stage(body({suggestion:{slug:'iphone-18-pro-max',score:20,reasons:['weak']}}),user);
  assert.equal(row.status,'staged');assert.equal(row.confidence,20);
  assert.ok(net.calls.some(c=>c.url.includes('/storage/v1/object/product-staging/full/')),'stored in the private staging bucket');
  assert.ok(!net.calls.some(c=>c.url.includes('/object/catalogue-images/')),'nothing written to the public bucket');
  assert.ok(!net.calls.some(c=>c.url.includes('checkout_inventory')||c.url.includes('shop_admin_update_product')),'no product read or changed');
 }finally{net.restore();}
});
test('duplicate files are not stored twice, and only real WebP images are accepted',async()=>{
 const net=fakeNet({existing:{id:'x',sha256:'a'.repeat(64),status:'approved'}});try{const r=await stage(body(),user);assert.equal(r.duplicate,true);assert.ok(!net.calls.some(c=>c.url.includes('/storage/')));}finally{net.restore();}
 await assert.rejects(stage({...body(),data:Buffer.from('<svg onload=alert(1)>').toString('base64')},user),/valid image/);
});
test('a photo becomes public only through an explicit approval with source, permission and the product’s own variants',async()=>{
 const upload={id:'00000000-0000-4000-8000-000000000002',sha256:'b'.repeat(64),staging_path:'full/b.webp',status:'staged'};
 const inv=[{sku:'iphone-18-pro-max|256GB · Black · Brand New',price_ngn:2200000,enabled:true,updated_at:'t',product_data:{slug:'iphone-18-pro-max',image:'/images/store/18promax-1-720.webp'}}];
 const ok={id:upload.id,confirm:true,slug:'iphone-18-pro-max',color:'Black',skus:[inv[0].sku],source:'own',licence:'Photographed in store'};
 await assert.rejects(approve({...ok,confirm:undefined},user),/confirmed/);
 await assert.rejects(approve({...ok,licence:''},user),/permission/);
 await assert.rejects(approve({...ok,skus:['pixel-10|128GB']},user),/variants/);
 const net=fakeNet({upload,inventory:inv});try{const r=await approve(ok,user);assert.equal(r.status,'approved');
  assert.ok(net.calls.some(c=>c.url.endsWith('/storage/v1/object/copy')&&JSON.parse(c.body).destinationBucket==='catalogue-images'));
  const rpc=JSON.parse(net.calls.find(c=>c.url.includes('shop_admin_update_product')).body);const added=rpc.p_data.images.find(p=>p.url.includes('b'.repeat(64)));
  assert.equal(added.approved,true);assert.equal(added.color,'Black');assert.equal(added.licence,'Photographed in store');assert.equal(rpc.p_updated_at,'t','stale edits are rejected by the database');
  assert.ok(rpc.p_data.images.some(p=>p.url==='/images/store/18promax-1-720.webp'),'existing approved photo kept');
 }finally{net.restore();}
});
test('image endpoints refuse anyone who is not the signed-in administrator',async()=>{
 const net=fakeNet();try{for(const [method,kind] of [['POST','stage'],['GET','staged'],['POST','approve'],['POST','cleanup']]){let code;const res={status(c){code=c;return this;},setHeader(){return this;},json(){return this;},send(){},end(){}};
  await handler({method,query:{kind},headers:{origin:'https://www.mikeegadget.com.ng'},body:{}},res);assert.ok([401,403].includes(code),kind+' → '+code);}}finally{net.restore();}
});
test('staging migration keeps uploads private and is additive only',()=>{
 const sql=read('supabase/migrations/20261116130000_smart_image_staging.sql');assert.match(sql,/'product-staging','product-staging',false/);assert.match(sql,/enable row level security/);assert.doesNotMatch(sql,/\bdrop\b|\btruncate\b|\bdelete\b/i);
 assert.doesNotMatch(SQL.replace(/--.*$/gm,''),/\bdrop\b|\btruncate\b|\bdelete\b/i);assert.ok(existsSync('supabase/prices-20261116-rollback.sql'));
});

// ---- bulk CSV ----
test('bulk CSV: matched by variant ID, previews changes, flags problems, never guesses',()=>{
 const inv=[{sku:'ipad-11th-gen|128GB · Wi‑Fi',price_ngn:640000,enabled:true,updated_at:'t1',product_data:{model:'iPad 11th Gen'}},{sku:'pixel-10|128GB',price_ngn:830000,enabled:true,updated_at:'t2',product_data:{model:'Pixel 10'}},{sku:'pixel-10|256GB',price_ngn:930000,enabled:true,updated_at:'t3',product_data:{}}];
 const r=reviewPriceCsv([['sku','model','price','enabled','updated_at'],['ipad-11th-gen|128GB · Wi-Fi','iPad','₦650,000','true','t1'],['pixel-10|128GB','','830000','true','t2'],['pixel-10|256GB','','900000','true','old'],['nope|1','','5','true','t'],['pixel-10|128GB','','1','true','t2']],inv);
 assert.equal(r.changes.length,1);assert.equal(r.changes[0].newPrice,650000);assert.match(r.changes[0].note,/tidying/);assert.equal(r.unchanged,1);
 assert.deepEqual(r.problems.map(p=>p.problem),['Changed since this CSV was exported — export again','No variant with this ID','Listed twice']);
 assert.throws(()=>reviewPriceCsv([['name','cost']],inv),/exported CSV/);
});
// ---- sharing ----
test('product pages share with X cards that mirror their Open Graph tags, once',()=>{
 const html=read('iphone-17-pro/index.html');assert.equal((html.match(/name="twitter:card"/g)||[]).length,1);assert.equal((html.match(/name="twitter:image:alt"/g)||[]).length,1);
 const og=html.match(/property="og:title" content="([^"]+)"/)[1];assert.ok(html.includes(`name="twitter:title" content="${og}"`));
 assert.match(read('assets/experience.mjs'),/x\.com\/intent\/post/);
});
test('owner photos: every product photo exists in all three sizes and the IMEI sticker photo is the blurred copy',()=>{
 for(const p of retailInventory.filter(p=>/-1-720\.webp$/.test(p.image)&&/^\/images\/store\/(pixel|ipad-air-8th|apple-watch-ultra-4)/.test(p.image)))for(const w of [160,360,720])assert.ok(existsSync(p.image.slice(1).replace('-720.',`-${w}.`)),p.image+' '+w);
 assert.equal(P('pixel-10').image,'/images/store/pixel-10-1-720.webp');
 assert.match(FOLLOWUP,/coalesce\(product_data->>'image',''\)=''/,'never overwrites an existing photo');
 assert.match(FOLLOWUP,/\^iphone-\(1\[78\]\|duo\)/,'iPhone Duo may be Brand New in Admin');
});
