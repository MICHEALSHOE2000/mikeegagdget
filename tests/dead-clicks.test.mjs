import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {resolveVariant,purchasable,colourIsPreference} from '../commerce/variant-selection.mjs';
import {saveColourPref,readColourPrefs,colourPrefNotes} from '../commerce/cart.mjs';
const read=f=>readFileSync(f,'utf8');
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))};};

test('a phone sold "colour to confirm" can be bought in any colour shown, but a colour never borrows another price',()=>{
 const plain=[{storage:'128GB',capacity:'128GB',condition:'UK Used',colors:[],price:290000}];
 assert.equal(resolveVariant(plain,{capacity:'128GB',condition:'UK Used',color:'Black'}).price,290000);
 assert.ok(colourIsPreference(plain[0],'Black'));
 const coloured=[{storage:'256GB · Silver',capacity:'256GB',condition:'Brand New',colors:['Silver'],price:2000000},{storage:'256GB',capacity:'256GB',condition:'Brand New',colors:[],price:1500000}];
 assert.equal(resolveVariant(coloured,{capacity:'256GB',condition:'Brand New',color:'Silver'}).price,2000000);
 assert.equal(resolveVariant(coloured,{capacity:'256GB',condition:'Brand New',color:'Blue'}),undefined,'Blue never gets the colourless price when the storage is sold by colour');
 assert.equal(purchasable({price:1,stockStatus:'in_stock'}),true);
});

test('colour wishes go to the order notes, never into the cart line the order API checks',()=>{
 const s=memory();saveColourPref(s,'iphone-12|128GB','Black');
 assert.deepEqual(readColourPrefs(s),{'iphone-12|128GB':'Black'});
 assert.deepEqual(colourPrefNotes([{sku:'iphone-12|128GB',color:'',quantity:1}],readColourPrefs(s),()=>'iPhone 12 128GB'),['Preferred colour for iPhone 12 128GB: Black']);
 assert.deepEqual(colourPrefNotes([{sku:'iphone-12|128GB',color:'Black',quantity:1}],readColourPrefs(s)),[]);
 const sel=read('assets/product-selection.js');assert.match(sel,/cartColor=colourIsPreference\(v,state\.color\)\?'':state\.color/);
 assert.match(read('assets/shopping.js'),/colourPrefNotes\(cart,readColourPrefs\(localStorage\)/);
});

test('Buy Now / Pay Small Small always answer a tap: spinner, then checkout or a message with WhatsApp',()=>{
 const sel=read('assets/product-selection.js');
 assert.doesNotMatch(sel,/removeAttribute\('href'\)/,'buttons never lose their link');
 for(const s of ["a.classList.add('is-loading')","aria-busy","explain(a.dataset.action)","WA_TEXT","logIssue('buy_click_error'","pageshow","is-missing"])assert.ok(sel.includes(s),s);
 const shop=read('assets/shopping.js');
 assert.doesNotMatch(shop,/\$\(id\)\.disabled=!ok/,'gadget Buy Now is never silently disabled');
 assert.match(shop,/Pay Small Small is not available online right now/);
 assert.match(read('assets/experience.css'),/\.commerce-button\.is-loading::after/);
 assert.match(read('assets/experience.css'),/\.product-hero-copy \.purchase-actions \.commerce-button[^{]*\{min-height:44px\}/);
});

test('hero headline links to the iPhones listing and the product title jumps to the details',()=>{
 const home=read('index.html');assert.match(home,/<p class="eyebrow"><a class="hero-link" href="\/iphones">QUALITY DEVICES\. BETTER DEALS\.<\/a><\/p>/);
 assert.match(home,/<h1><a class="hero-link" href="\/iphones">/);
 assert.match(read('assets/product-selection.js'),/details\.scrollIntoView/);
});

test('checkout problems reach the Vercel logs without personal details',async()=>{
 const {default:handler}=await import('../api/shop/create.mjs');const prev={...process.env};process.env.SHOP_ORIGIN='https://www.mikeegadget.com.ng';
 const logged=[];const warn=console.warn,err=console.error;console.warn=(...a)=>logged.push(a.join(' '));console.error=(...a)=>logged.push(a.join(' '));
 const run=async(body,origin='https://www.mikeegadget.com.ng')=>{const out={};const res={status(n){out.status=n;return this},setHeader(){return this},json(b){out.body=b;return this},send(){return this},end(){return this}};await handler({method:'POST',headers:{origin},body},res);return out;};
 try{
  const ok=await run({action:'client_log',entry:{kind:'buy_unavailable',path:'/iphone-12/',sku:'iphone-12',email:'a@b.com',phone:'0801'}});
  assert.equal(ok.status,204);assert.ok(logged.some(l=>l.includes('[checkout-client]')&&l.includes('buy_unavailable')));assert.ok(!logged.some(l=>/a@b\.com|0801/.test(l)));
  const bad=await run({items:[{sku:'iphone-12|128GB',quantity:1}],email:'x'});assert.equal(bad.status,400);assert.ok(logged.some(l=>l.includes('[checkout-error]')&&l.includes('validation')&&l.includes('iphone-12|128GB')));
 }finally{console.warn=warn;console.error=err;process.env=prev;}
});
