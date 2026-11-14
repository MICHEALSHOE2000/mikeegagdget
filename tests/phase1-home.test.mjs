import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CATEGORY_TIMING,createSchedule} from '../assets/category-carousel.js';
import {categories} from '../commerce/storefront-data.mjs';
import {card} from '../assets/storefront-ui.mjs';

test('category carousel holds on iPhones for 90 seconds, then advances every 5-7 seconds',()=>{
 assert.equal(CATEGORY_TIMING.initialHold,90000);
 assert.ok(CATEGORY_TIMING.interval>=5000&&CATEGORY_TIMING.interval<=7000);
 const s=createSchedule();
 assert.equal(s.due(0),false);assert.equal(s.due(89999),false);assert.equal(s.due(90000),true);
 s.moved(90000);assert.equal(s.due(95999),false);assert.equal(s.due(96000),true);
});
test('manual interaction pauses temporarily and never shortens the initial hold',()=>{
 const early=createSchedule();early.touched(1000);early.resumed(2000);
 assert.equal(early.due(89999),false);assert.equal(early.due(90000),true);
 const late=createSchedule();late.moved(100000);late.touched(101000);
 assert.equal(late.due(106000),false);assert.equal(late.due(101000+CATEGORY_TIMING.resumeAfter),true);
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
 assert.match(html,/<p class="store-was"><del>.*₦2,540,000<\/del> <span class="deal-badge">10% OFF<\/span><\/p><strong class="store-price">From ₦2,286,000<\/strong>/);
});
test('normal card shows only its regular price',()=>{
 const html=card(item([{storage:'256GB',price:1660000,originalPrice:1660000,deal:false},{storage:'512GB',price:1900000,originalPrice:1900000,deal:false}]));
 assert.match(html,/<strong class="store-price">From ₦1,660,000<\/strong>/);
 assert.doesNotMatch(html,/<del>|10% OFF|store-was/);
});
