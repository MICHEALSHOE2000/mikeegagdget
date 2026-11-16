import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {retailInventory,retailPhoneProducts} from '../commerce/retail-inventory.mjs';
import {products} from '../commerce/catalog.mjs';
import {storeItems} from '../commerce/storefront-data.mjs';
import {choices} from '../commerce/upgrade-core.mjs';
import {media} from '../assets/storefront-ui.mjs';

const record=slug=>retailInventory.find(item=>item.slug===slug);
const price=(slug,storage)=>record(slug)?.variants.find(variant=>variant.storage===storage)?.price;

test('all supplied products and variants are represented once with conditions kept separate',()=>{
 const original=retailInventory.filter(p=>p.category!=='wifi-only');
 assert.equal(original.length,181); // 161 + 20 new products from the approved price list (2026-11-16)
 assert.equal(retailInventory.filter(p=>p.category==='wifi-only').length,16);
 assert.equal(new Set(retailInventory.map(p=>p.slug)).size,retailInventory.length);
 assert.equal(retailInventory.reduce((sum,p)=>sum+p.variants.length,0),578); // 544 + 34 variants from the approved price list (2026-11-16)
 assert.equal(storeItems.length,retailInventory.length);
 for(const p of original.filter(p=>p.category==='iphones'&&!p.slug.startsWith('iphone-18-')))assert.equal(p.condition,'UK Used');

});

test('example prices follow their specified group and ambiguous prices remain Confirm Price',()=>{
 assert.equal(price('iphone-18-pro','256GB · Burgundy'),2_000_000); // approved price list 16 Nov 2026
 assert.equal(price('iphone-13','128GB'),370_000);
 assert.equal(price('iphone-15','128GB'),625_000); // merged, lower price kept
 assert.equal(price('samsung-a05','Standard · UK Used'),150_000);
 assert.equal(price('samsung-a05','Standard'),160_000);
 assert.equal(price('samsung-s22-plus','256GB'),320_000); // highest supplier quote, UK Used
 assert.equal(price('samsung-s23','128GB'),360_000);
 assert.equal(price('samsung-s23','256GB'),380_000);
 assert.equal(price('pixel-8','128GB'),420_000);
 assert.equal(price('pixel-8','128GB · UK Used'),347_000);
 assert.equal(price('pixel-10-pro','128GB · eSIM only'),910_000);
 assert.equal(price('samsung-s25-ultra','256GB'),1230000);
 assert.equal(price('iphone-15-pro','256GB'),875000);
 assert.equal(retailInventory.flatMap(item=>item.variants).filter(variant=>variant.price===null).length,231); // 234 − 4 now priced (iPhone 18 Pro WiFi Only ×3, 18 Pro Max 256GB Black) + 1 new unpriced (Watch Series 6 GPS), 2026-11-16
 assert.equal(retailInventory.filter(item=>item.variants.some(variant=>variant.price===null)).length,31); // + Apple Watch Series 6 (44mm GPS price pending), 2026-11-16
});

test('duplicate model pages are merged into one page at the lower price (owner decision 2026-11-14)',()=>{
 for(const slug of ['iphone-16-uk-used','iphone-15-uk-used','samsung-a05-uk-used','samsung-a07-open-box','samsung-z-fold-6-confirm-condition'])assert.equal(products.find(item=>item.slug===slug),undefined,slug);
 const iphone16=products.find(item=>item.slug==='iphone-16');
 assert.deepEqual(iphone16.conditions,['UK Used']);
 assert.equal(choices.find(item=>item.id==='iphone-16|128GB').price,840_000);
 const a05=products.find(item=>item.slug==='samsung-a05');
 assert.deepEqual([...a05.conditions].sort(),['Open Box','UK Used']);
 assert.equal(choices.find(item=>item.id==='samsung-a05|Standard · UK Used').price,150_000);
});

test('cards and category pages show current non-phone products and Confirm Price labels',async()=>{
 for(const category of ['tablets','watches','airpods','accessories']){
  const page=await readFile(`shop/${category}/index.html`,'utf8');
  assert.match(page,/<h1[^>]*>[^<]+<\/h1>/);
  assert.match(page,/id="searchInput"/);
  assert.match(page,/View Details/);
 }
 const tablet=await readFile('shop/tablets/index.html','utf8');
 assert.match(tablet,/data-category-scope="tablets"/);
 const samsung=await readFile('samsung-s25-edge/index.html','utf8');
 assert.match(samsung,/Confirm Price/);
 const store=await readFile('assets/store-catalog.json','utf8');
 assert.doesNotMatch(store,/revenes\.com|\/images\/pixel\//i);
});

test('verified local images are the only images attached to the new catalog',()=>{
 assert.ok(retailInventory.filter(item=>item.image).length>0);
 assert.ok(retailInventory.every(item=>!item.image||item.image.startsWith('/images/store/')||item.image.startsWith('/images/catalog/')));
 assert.equal(retailInventory.filter(item=>item.image).length,70); // merged duplicate pages no longer counted
 assert.equal(retailInventory.filter(item=>!item.image).length,127); // 107 + 20 new products awaiting approved photos (2026-11-16)
});

test('generic store cards use only the available shop image sizes',()=>{
 const html=media('/images/store/mikee-shop-720.webp','Mikee Gadget Plug shop');
 assert.match(html,/src="\/images\/store\/mikee-shop-720\.webp"/);
 assert.match(html,/mikee-shop-720\.webp 720w, \/images\/store\/mikee-shop-1280\.webp 1280w/);
 assert.doesNotMatch(html,/mikee-shop-360\.webp/);
});
