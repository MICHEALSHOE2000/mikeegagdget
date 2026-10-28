import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {retailInventory} from '../commerce/retail-inventory.mjs';
import {choices} from '../commerce/upgrade-core.mjs';
import {buildFamilies,searchFamilies,compatibleOffers,normalizeOffer,startingOffer,offerUrl,offerMessage} from '../commerce/discovery.mjs';
const families=buildFamilies(retailInventory);

test('every source offer, price, colour group and stable legacy ID survives normalization',()=>{
 assert.equal(families.flatMap(f=>f.variants).length,264);
 const offers=families.flatMap(f=>f.variants);assert.equal(new Set(offers.map(o=>o.id)).size,264);
 for(const item of retailInventory)for(const v of item.variants){const offer=offers.find(o=>o.legacyId===`${item.slug}|${v.storage}`);assert.equal(offer.price,v.price);assert.equal(offer.originalStorage,v.storage);assert.deepEqual(offer.colours,v.color?.split('/').map(c=>c.trim())||['Unconfirmed']);}
 assert.equal(families.filter(f=>f.model==='iPhone 16').length,1);
});
test('universal search covers real phone, laptop, tablet, audio, watch, game and accessory inventory',()=>{
 for(const [query,category] of [['17 pro max','iphones'],['samsung ultra','samsung'],['pixel','pixel'],['ipad','ipads'],['watch','watches'],['airpods','airpods'],['gaming','ps5'],['accessories','accessories']])assert.ok(searchFamilies(families,query).some(i=>i.category===category),query);
 assert.equal(searchFamilies(families,'laptop').length,0); // No laptop or MacBook records supplied.
 assert.ok(searchFamilies(families,'IPHONE').length);
 assert.ok(searchFamilies(families,'samsng ultra').length);
 assert.equal(searchFamilies(families,'zzzzzzzz').length,0);
 // This inventory does not have iPhone 13 Pro, or verified SIM / network entries.
 assert.equal(searchFamilies(families,'13 pro 256').length,0);
 assert.equal(searchFamilies(families,'iphone 17 pro max uk used esim').length,0);
 assert.ok(families.flatMap(f=>f.variants).every(v=>v.sim==='Other / Unconfirmed'&&v.network==='Unconfirmed'));
});
test('filters intersect on one actual offer, not unrelated variants in a family',()=>{
 const found=searchFamilies(families,'iphone 16',{condition:'UK Used',storage:'128GB',budget:'0-1000000'});
 assert.ok(found.length);assert.ok(found.every(f=>f.variants.every(v=>v.condition==='UK Used'&&v.storage==='128GB'&&v.price<1000000)));
 assert.equal(searchFamilies(families,'iphone 16',{condition:'UK Used',sim:'eSIM Only'}).length,0);
 const air=families.find(f=>f.model==='iPhone 17 Air');
 assert.ok(compatibleOffers(air.variants,{condition:'Brand New — Non-Activated',storage:'256GB'}).length);
 assert.equal(compatibleOffers(air.variants,{condition:'UK Used',storage:'1TB'}).length,0);
});
test('unknown activation stays unknown; restricted and missing-price offers cannot mislead starting prices',()=>{
 const first=families.find(f=>f.model==='iPhone 17 Pro Max').variants[0];assert.equal(first.condition,'Brand New — Activation unconfirmed');
 // Isolated hypothetical policy fixtures, never added to inventory.
 const base={...first,price:100,availability:'Confirm availability',network:'Factory Unlocked'};
 assert.equal(startingOffer({variants:[base,{...base,price:1,network:'Network Locked'},{...base,price:2,availability:'Out of stock'}]}).price,100);
 assert.equal(startingOffer({variants:[{...base,price:null}]}),undefined);
 const item={slug:'fixture',model:'Fixture',condition:'Open Box'};
 assert.equal(normalizeOffer(item,{storage:'256GB'}).condition,'Open Box');
});
test('every phone offer reaches the existing flow with its original ID, condition and price',()=>{
 for(const family of families.filter(f=>f.easy))for(const offer of family.variants){
  for(const method of ['buy','easy','swap']){const url=new URL(offerUrl(family,offer,method,offer.colours[0]),'https://example.test');const target=choices.find(p=>p.id===url.searchParams.get('phone'));assert.equal(target.price,offer.price);assert.equal(target.conditions[0],offer.condition);if(method==='swap')assert.equal(url.searchParams.get('target'),target.id);}
  assert.doesNotMatch(offerMessage(offer),/ttclid|utm_|campaign reference/i);
 }
});
test('main iPhone catalogue renders one card per model and retains every legacy product URL',async()=>{
 const dom=new JSDOM(await readFile('iphones/index.html','utf8'));const names=[...dom.window.document.querySelectorAll('[data-catalog-card] h3')].map(el=>el.textContent);assert.equal(new Set(names).size,names.length);assert.equal(names.length,families.filter(f=>f.category==='iphones').length);dom.window.close();
 for(const item of retailInventory.filter(i=>i.isPhone)){const html=await readFile(`${item.slug}/index.html`,'utf8');assert.ok(html.includes('id="discovery-family"'));}
});

test('keyboard suggestions, clear button, URL filters and browser back restoration',async()=>{
 const dom=new JSDOM(await readFile('index.html','utf8'),{url:'https://mikee.test/?q=iphone&condition=UK+Used&storage=128GB'});
 for(const name of ['window','document','location','history'])globalThis[name]=name==='window'?dom.window:dom.window[name];
 globalThis.fetch=async()=>({ok:true,json:async()=>families});
 const {initDiscovery}=await import('../assets/discovery.js');initDiscovery();
 const tick=()=>new Promise(resolve=>setTimeout(resolve,0));await tick();
 assert.equal(document.getElementById('conditionFilter').value,'UK Used');
 assert.equal(document.getElementById('storageFilter').value,'128GB');
 const search=document.getElementById('homePhoneSearch');search.value='pixel';search.dispatchEvent(new window.Event('input'));await tick();
 search.dispatchEvent(new window.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));
 assert.ok(document.activeElement.closest('#searchResults'));
 document.activeElement.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(document.activeElement,search);assert.ok(document.getElementById('searchResults').hidden);
 document.querySelector('.search-clear').click();assert.equal(search.value,'');
 history.replaceState({},'','/?q=samsung&network=Unconfirmed');window.dispatchEvent(new window.PopStateEvent('popstate'));
 assert.equal(document.getElementById('searchInput').value,'samsung');assert.equal(document.getElementById('networkFilter').value,'Unconfirmed');assert.match(document.getElementById('productGrid').textContent,/Samsung/);
 dom.window.close();
});
