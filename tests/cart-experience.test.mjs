import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {cleanCart,cartCount,cartLine,saveCart,readCart} from '../commerce/cart.mjs';
import {orderSummary,maskEmail,maskPhone} from '../commerce/order-summary.mjs';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))};};
test('same variant and colour merges into one line; different colour stays separate',()=>{
 const s=memory();saveCart(s,[{sku:'iphone-17|256GB',color:'Blue',quantity:1},{sku:'iphone-17|256GB',color:'Blue',quantity:2},{sku:'iphone-17|256GB',color:'Black',quantity:1}]);
 const cart=readCart(s);assert.equal(cart.length,2);assert.equal(cartLine(cart,'iphone-17|256GB','Blue').quantity,3);assert.equal(cartCount(cart),4);
});
test('cart rejects tampered rows and caps quantity',()=>{
 assert.deepEqual(cleanCart([{sku:'a',quantity:0},{sku:5,quantity:1},{sku:'b',quantity:1.5},{sku:'c',quantity:21}]),[]);
 assert.equal(cleanCart([{sku:'a',quantity:15},{sku:'a',quantity:15}])[0].quantity,20);
});
test('confirmation summary never exposes the street address and masks contact details',()=>{
 const s=orderSummary({amount_ngn:500000,delivery_fee_ngn:0,customer:{firstName:'Ada',email:'adaeze@example.com',phone:'+234 803 000 1234',fulfillment:'delivery',state:'Lagos',city:'Ikeja',address:'12 Secret Close'},shop_order_items:[{sku:'x|1',quantity:2,unit_price_ngn:250000,selected_color:'Blue',product_snapshot:{model:'Phone',image:'https://evil.example/x.png'}}]});
 assert.doesNotMatch(JSON.stringify(s),/Secret|adaeze@|803 000/);assert.equal(s.destination,'Ikeja, Lagos');assert.equal(s.items[0].image,'');
 assert.equal(maskEmail('adaeze@example.com'),'ad•••@example.com');assert.equal(maskPhone('08030001234'),'••• ••• 1234');
 assert.equal(orderSummary({customer:{fulfillment:'pickup',city:'Ikeja'},shop_order_items:[]}).destination,'');
});
test('order summary is only returned after verified payment',()=>{
 const src=readFileSync('api/shop/verify.mjs','utf8');assert.match(src,/if\(result\.status==='paid'\)\{try\{summary=orderSummary/);
});
test('mobile navigation is Home, Shop, Swap, Cart, Chat with a live count',()=>{
 const js=readFileSync('assets/sales.js','utf8');assert.match(js,/\['Home','\/'\],\['Shop','\/#products'\],\['Swap','\/swap\/'\],\['Cart','\/cart\/'\],\['Chat'/);assert.match(js,/data-cart-count/);assert.doesNotMatch(js,/\['EasyBuy'/);
});
test('Add to cart opens the confirmation drawer and Buy Now adds once then checks out the cart',()=>{
 const sel=readFileSync('assets/product-selection.js','utf8');assert.match(sel,/showAddedToCart\(/);
 const shop=readFileSync('assets/shopping.js','utf8');assert.match(shop,/if\(go\)\{location\.assign\('\/checkout\/\?'/);assert.match(shop,/if\(!cartLine\(cart,v\.sku,color\)\)cart=addToCart/);
 const ui=readFileSync('assets/cart-ui.mjs','utf8');for(const t of ['Added to your cart','← Continue Shopping','Proceed to Checkout →','showModal'])assert.ok(ui.includes(t),t);
});
test('checkout has no stale financing notice and confirmation page has support and continue actions',()=>{
 const co=readFileSync('checkout/index.html','utf8');assert.doesNotMatch(co,/currently unavailable/i);assert.match(co,/← Continue Shopping/);assert.match(co,/Edit cart/);
 const done=readFileSync('checkout/complete/index.html','utf8');assert.match(done,/Continue Shopping/);assert.match(done,/wa\.me\/2347086865133/);
 assert.match(readFileSync('cart/index.html','utf8'),/id="cart-summary"/);
});
test('community section stays hidden until a valid invite exists',()=>{
 assert.match(readFileSync('index.html','utf8'),/<section data-community hidden>/);assert.match(readFileSync('assets/community.js','utf8'),/section\.hidden=false/);
});

test('preview deployments accept their own address; production only the shop origin',async()=>{
 const {sameOrigin}=await import('../api/_shop.mjs');const keep={...process.env};
 try{process.env.SITE_URL='https://www.mikeegadget.com.ng';delete process.env.SHOP_ORIGIN;process.env.VERCEL_URL='mikee-abc.vercel.app';
  process.env.VERCEL_ENV='production';assert.equal(sameOrigin({headers:{origin:'https://mikee-abc.vercel.app'}}),false);assert.equal(sameOrigin({headers:{origin:'https://www.mikeegadget.com.ng'}}),true);
  process.env.VERCEL_ENV='preview';assert.equal(sameOrigin({headers:{origin:'https://mikee-abc.vercel.app'}}),true);assert.equal(sameOrigin({headers:{origin:'https://evil.example'}}),false);
 }finally{for(const k of ['SITE_URL','SHOP_ORIGIN','VERCEL_URL','VERCEL_ENV'])if(k in keep)process.env[k]=keep[k];else delete process.env[k];}
});
