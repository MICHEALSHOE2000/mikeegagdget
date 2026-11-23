import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {retailInventory} from '../commerce/retail-inventory.mjs';
import {IPAD_RANGE_PRODUCTS,IPAD_RANGE_NEW_VARIANTS,IPAD_RANGE_FLAGS} from '../commerce/ipad-range-2026-11-23.mjs';
import {card} from '../assets/storefront-ui.mjs';
import {holdReason} from '../commerce/merchant.mjs';

const bySlug=slug=>retailInventory.find(p=>p.slug===slug);
const price=(slug,storage)=>bySlug(slug).variants.find(v=>v.storage===storage)?.price;

test('existing iPad prices are kept exactly as the owner set them', () => {
 assert.equal(price('ipad-air-8th-gen-11-inch-m4','256GB · Wi‑Fi'),1190000);
 assert.equal(price('ipad-11th-gen','128GB · Wi‑Fi'),640000);
 assert.equal(price('ipad-11th-gen','256GB · Cellular + Wi‑Fi'),1090000);
 assert.equal(bySlug('ipad-air-8th-gen-11-inch-m4').variants.find(v=>v.storage==='256GB · Wi‑Fi').compareAtPrice,undefined);
});

test('new iPads use iStore sale prices with the was-price kept separately', () => {
 assert.equal(IPAD_RANGE_PRODUCTS.length,9);
 assert.equal(IPAD_RANGE_PRODUCTS.reduce((n,p)=>n+p.variants.length,0)+IPAD_RANGE_NEW_VARIANTS.length,37);
 const pro=bySlug('ipad-pro-13-inch').variants.find(v=>v.storage==='256GB · Wi‑Fi');
 assert.deepEqual([pro.price,pro.compareAtPrice],[1999000,2399000]);
 assert.equal(price('ipad-air-8th-gen-11-inch-m4','128GB · Wi‑Fi'),1249000);
 for(const p of retailInventory.filter(p=>p.category==='ipads'))for(const v of p.variants){
  assert.ok(Number.isSafeInteger(v.price)&&v.price>0,`${p.slug} ${v.storage} has a price`);
  if(v.compareAtPrice!==undefined)assert.ok(v.compareAtPrice>v.price,`${p.slug} ${v.storage} was-price is higher`);
 }
 assert.equal(new Set(retailInventory.flatMap(p=>p.variants.map(v=>`${p.slug}|${v.storage}`))).size,retailInventory.reduce((n,p)=>n+p.variants.length,0),'SKUs are unique');
});

test('no chip is invented and conflicting listings are flagged for the owner', () => {
 for(const slug of ['ipad-air-11-inch','ipad-air-13-inch','ipad-pro-11-inch','ipad-pro-13-inch'])assert.doesNotMatch(bySlug(slug).model,/\bM\d\b/);
 assert.ok(IPAD_RANGE_FLAGS.some(f=>/512GB Wi-Fi/.test(f.item)));
 assert.ok(IPAD_RANGE_FLAGS.some(f=>/Pro 11-inch 256GB/.test(f.item)));
});

test('cards show the crossed-out was-price and the saving; Hot Deals still win', () => {
 const html=card({slug:'ipad-pro-13-inch',model:'iPad Pro 13-inch',route:'/ipad-pro-13-inch/',image:'',conditions:['Brand New'],variants:[{storage:'256GB · Wi‑Fi',price:1999000,compareAtPrice:2399000,condition:'Brand New'}]});
 assert.match(html,/<del>.*₦2,399,000<\/del>/);
 assert.match(html,/Save ₦400,000/);
 const deal=card({slug:'x',model:'X',route:'/x/',image:'',conditions:['Brand New'],variants:[{storage:'1',price:900,originalPrice:1000,deal:true,compareAtPrice:5000}]});
 assert.doesNotMatch(deal,/Save/);
});

test('placeholder art is original, on every new iPad, and never sent to Merchant Center', async () => {
 for(const p of IPAD_RANGE_PRODUCTS){
  assert.equal(bySlug(p.slug).image,`/images/store/ipad-range/${p.slug}.svg`);
  const svg=await readFile(`images/store/ipad-range/${p.slug}.svg`,'utf8');
  assert.match(svg,/PHOTO COMING SOON/);assert.doesNotMatch(svg,/<image|href=/);
 }
 assert.match(holdReason('/images/store/ipad-range/ipad-mini.svg'),/Placeholder/);
 assert.equal(holdReason('/images/store/pixel-6-1-720.webp'),'');
});

test('the iPad page has the premium showcase above the full catalogue', async () => {
 const html=await readFile('shop/ipads/index.html','utf8');
 for(const id of ['ipad-pro','ipad-air','ipad-mini','ipad-classic'])assert.match(html,new RegExp(`id="${id}"`));
 assert.match(html,/Buy online/);assert.match(html,/Shop from store/);assert.match(html,/7-day warranty/);
 assert.ok(html.indexOf('class="ipx"')<html.indexOf('filters-section'),'showcase sits above the grid');
 const data=JSON.parse(html.match(/<script type="application\/json" id="ipx-data">([\s\S]*?)<\/script>/)[1]);
 assert.ok(data.some(p=>p.slug==='ipad-pro-13-inch'&&p.variants.some(v=>v.price===1999000&&v.was===2399000)));
 assert.ok(data.every(p=>p.variants.every(v=>!v.color.includes('/'))));
 for(const p of IPAD_RANGE_PRODUCTS)await readFile(`${p.slug}/index.html`,'utf8');
});

test('the applied migration is additive and matches the catalogue', async () => {
 const sql=await readFile('supabase/migrations/20261123100000_ipad_range.sql','utf8')+await readFile('supabase/migrations/20261123100100_ipad_air_m4_variants.sql','utf8');
 assert.doesNotMatch(sql.replace(/^--.*$/gm,''),/\b(update|delete|drop|truncate|alter)\b/i);
 assert.equal((sql.match(/on conflict \(sku\) do nothing/g)||[]).length,2);
 for(const p of IPAD_RANGE_PRODUCTS)for(const v of p.variants)assert.ok(sql.includes(`'${p.slug}','${p.model}','${v.storage}'`)&&sql.includes(`,${v.price},`),`${p.slug} ${v.storage} in migration`);
 assert.doesNotMatch(sql,/'ipad-air-8th-gen-11-inch-m4\|256GB · Wi‑Fi'/);
});
