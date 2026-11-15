import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {CATEGORY_TIMING,createSchedule} from '../assets/category-carousel.js';
import {categories} from '../commerce/storefront-data.mjs';
import {card} from '../assets/storefront-ui.mjs';

test('category carousel moves every 4 seconds from page load and keeps going',()=>{
 assert.equal(CATEGORY_TIMING.interval,4000);
 const s=createSchedule(CATEGORY_TIMING,0);
 assert.equal(s.due(3999),false);assert.equal(s.due(4000),true);
 s.moved(4000);assert.equal(s.due(7999),false);assert.equal(s.due(8000),true);
 const js=readFileSync('assets/category-carousel.js','utf8');
 assert.doesNotMatch(js,/pointerenter|focusin|mouseenter|touched|resumeAfter|initialHold/);
});
test('category discovery order starts with iPhones and keeps every category',()=>{
 assert.deepEqual(categories.map(c=>c.id).slice(0,9),['iphones','samsung','pixel','macbooks','laptops','tablets','wifi-only','watches','accessories']);
 assert.equal(categories.length,13);
 for(const c of categories)assert.ok(!c.image.includes('mikee-shop'),c.id+' must not use the shop photograph');
});
test('carousel has no Play/Pause button or progress bar',async()=>{
 const js=await readFile('assets/category-carousel.js','utf8'),css=await readFile('assets/unified.css','utf8');
 assert.doesNotMatch(js,/<progress|<button|Pause|Play/);assert.doesNotMatch(css,/category-progress/);
 const home=await readFile('index.html','utf8');
 assert.match(home,/data-category-scroll="-1"/);assert.match(home,/data-category-scroll="1"/);
 assert.ok(home.indexOf('data-category="iphones"')<home.indexOf('data-category="samsung"'));
});
const item=(variants)=>({slug:'x',route:'/x/',model:'Test Phone',image:'',conditions:['UK Used'],variants});
test('discounted card separates original price, label and selling price',()=>{
 const html=card(item([{storage:'256GB',price:2286000,originalPrice:2540000,deal:true},{storage:'512GB',price:2900000,originalPrice:2900000,deal:false}]));
 assert.match(html,/<p class="store-was"><del>.*₦2,540,000<\/del> <span class="deal-badge">-10%<\/span><\/p><strong class="store-price">From ₦2,286,000<\/strong>/);
});
test('normal card shows only its regular price',()=>{
 const html=card(item([{storage:'256GB',price:1660000,originalPrice:1660000,deal:false},{storage:'512GB',price:1900000,originalPrice:1900000,deal:false}]));
 assert.match(html,/<strong class="store-price">From ₦1,660,000<\/strong>/);
 assert.doesNotMatch(html,/<del>|-10%|store-was/);
});
