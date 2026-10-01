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
 assert.equal(retailInventory.length,159);
 assert.equal(retailPhoneProducts.length,106);
 assert.equal(storeItems.length,159);
 assert.equal(new Set(retailInventory.map(item=>item.slug)).size,retailInventory.length);
 assert.equal(retailInventory.reduce((sum,item)=>sum+item.variants.length,0),264);
 const productCounts=Object.fromEntries(['Brand New','UK Used','Open Box','Confirm condition'].map(condition=>[
  condition,retailInventory.filter(item=>item.condition===condition).length
 ]));
 assert.deepEqual(productCounts,{'Brand New':102,'UK Used':27,'Open Box':11,'Confirm condition':19});
 const variantCounts=Object.fromEntries(['Brand New','UK Used','Open Box','Confirm condition'].map(condition=>[
  condition,retailInventory.filter(item=>item.condition===condition).reduce((sum,item)=>sum+item.variants.length,0)
 ]));
 assert.deepEqual(variantCounts,{'Brand New':193,'UK Used':34,'Open Box':11,'Confirm condition':26});
 assert.equal(new Set(products.map(item=>item.slug)).size,106);
 assert.equal(products.length,106);
});

test('example prices follow their specified group and ambiguous prices remain Confirm Price',()=>{
 assert.equal(price('iphone-18-pro','256GB · Burgundy'),1_970_000);
 assert.equal(price('iphone-13','128GB'),370_000);
 assert.equal(price('iphone-15-uk-used','128GB'),625_000);
 assert.equal(price('samsung-a05-uk-used','Standard'),150_000);
 assert.equal(price('samsung-a05','Standard'),160_000);
 assert.equal(price('samsung-s22-plus','256GB'),390_000);
 assert.equal(price('samsung-s23','128GB'),null);
 assert.equal(price('samsung-s23','256GB'),null);
 assert.equal(price('samsung-s25-ultra','256GB'),null);
 assert.equal(price('iphone-15-pro-uk-used','256GB'),null);
 assert.equal(retailInventory.flatMap(item=>item.variants).filter(variant=>variant.price===null).length,22);
 assert.equal(retailInventory.filter(item=>item.variants.some(variant=>variant.price===null)).length,17);
});

test('iPhone brand new and UK Used listings stay distinct with matching Easy Buy data',()=>{
 const brandNew=products.find(item=>item.slug==='iphone-16');
 const used=products.find(item=>item.slug==='iphone-16-uk-used');
 assert.deepEqual(brandNew.conditions,['Brand New']);
 assert.deepEqual(used.conditions,['UK Used']);
 assert.notEqual(brandNew.slug,used.slug);
 const newChoice=choices.find(item=>item.id==='iphone-16|128GB');
 assert.equal(newChoice.price,1_080_000);
 assert.equal(newChoice.forSale,true);
 const usedChoice=choices.find(item=>item.id==='iphone-16-uk-used|128GB');
 assert.equal(usedChoice.price,840_000);
 assert.equal(usedChoice.conditions[0],'UK Used');
});

test('cards and category pages show current non-phone products and Confirm Price labels',async()=>{
 for(const category of ['tablets','watches','airpods','audio','accessories']){
  const page=await readFile(`shop/${category}/index.html`,'utf8');
  assert.match(page,/CURRENT CATALOGUE/);
  assert.match(page,/VIEW OPTIONS/);
 }
 const tablet=await readFile('shop/tablets/index.html','utf8');
 assert.match(tablet,/Samsung Galaxy Tab A11/);
 const samsung=await readFile('samsung-s23/index.html','utf8');
 assert.match(samsung,/Confirm Price/);
 const store=await readFile('assets/store-catalog.json','utf8');
 assert.doesNotMatch(store,/revenes\.com|\/images\/pixel\//i);
});

test('verified local images are the only images attached to the new catalog',()=>{
 assert.ok(retailInventory.filter(item=>item.image).length>0);
 assert.ok(retailInventory.every(item=>!item.image||item.image.startsWith('/images/store/')||item.image.startsWith('/images/catalog/')));
 assert.equal(retailInventory.filter(item=>item.image).length,28);
 assert.equal(retailInventory.filter(item=>!item.image).length,131);
});

test('generic store cards use only the available shop image sizes',()=>{
 const html=media('/images/store/mikee-shop-720.webp','Mikee Gadget Plug shop');
 assert.match(html,/src="\/images\/store\/mikee-shop-720\.webp"/);
 assert.match(html,/mikee-shop-720\.webp 720w, \/images\/store\/mikee-shop-1280\.webp 1280w/);
 assert.doesNotMatch(html,/mikee-shop-360\.webp/);
});
