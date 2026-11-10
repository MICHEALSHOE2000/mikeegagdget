import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesProduct} from '../assets/product-search.mjs';
import {retailProducts,retailVariants} from '../commerce/retail.mjs';
import {validFinanceUrl} from '../api/supplier/manage.mjs';
import request from '../api/supplier/request.mjs';
import {readFile} from 'node:fs/promises';
const item={model:'Apple iPhone 13 Pro Max',brand:'Apple',variants:[{storage:'256GB'}]};
test('search handles typos, abbreviations and storage without confusing generations',()=>{for(const q of ['ipone 13 pm','iphone 13 promax 256 gb','iphne 13'])assert.ok(matchesProduct(item,q),q);assert.equal(matchesProduct(item,'iphone 14'),false);assert.ok(matchesProduct({model:'Samsung Galaxy S23',brand:'Samsung',variants:[]},'samsng s23'));});
test('retail variants have unique stable SKUs and all product URLs are internal',()=>{const variants=retailProducts.flatMap(p=>p.variants);assert.equal(variants.length,retailVariants.size);for(const p of retailProducts){assert.ok(p.route.startsWith('/'));for(const v of p.variants)assert.equal(v.sku,`${p.slug}|${v.storage}`);}});
test('financing links accept only provider HTTPS origins',()=>{assert.ok(validFinanceUrl('https://www.creditdirect.ng/checkout/123'));for(const u of ['http://creditdirect.ng','https://creditdirect.ng.evil.test','javascript:alert(1)','https://evil.test/creditdirect.ng'])assert.equal(validFinanceUrl(u),false);});
test('invalid orders fail before any database call',async()=>{let status,body;const res={status(n){status=n;return this},setHeader(){return this},json(d){body=d}};await request({method:'POST',body:{sku:'invented',quantity:1}},res);assert.equal(status,400);assert.ok(body.error);});
test('checkout is guest-based and contains all review stages',async()=>{const html=await readFile('checkout/index.html','utf8');assert.match(html,/Your details/);assert.match(html,/Delivery or pickup/);assert.match(html,/Review your order/);assert.doesNotMatch(html,/type="password"/);});
import pay from '../api/supplier/pay.mjs';
import {verifySupplierPayment} from '../api/supplier/verify.mjs';
const response=()=>({code:0,body:null,status(n){this.code=n;return this},setHeader(){return this},json(d){this.body=d}});
test('payment initialization uses the database total and reuses an existing authorization URL',async()=>{
 const saved=globalThis.fetch;process.env.SUPABASE_URL='https://test.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';let calls=0;
 globalThis.fetch=async(url)=>{calls++;return {ok:true,json:async()=>url.includes('rpc/')?[{order_id:'test',amount_ngn:820000,customer_email:'qa@example.invalid'}]:[{authorization_url:'https://checkout.paystack.com/test-only',paystack_reference:'MGS-fixed'}]};};
 try{const res=response();await pay({method:'POST',body:{token:'11111111-1111-4111-8111-111111111111',expected_total_ngn:820000}},res);assert.equal(res.code,200);assert.equal(res.body.checkout_url,'https://checkout.paystack.com/test-only');assert.equal(calls,2);}finally{globalThis.fetch=saved;}
});
test('a changed quote cannot silently initiate a different charge',async()=>{
 const saved=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return {ok:true,json:async()=>[{order_id:'test',amount_ngn:900000}]};};
 try{const res=response();await pay({method:'POST',body:{token:'11111111-1111-4111-8111-111111111111',expected_total_ngn:820000}},res);assert.equal(res.code,409);assert.equal(calls,1);}finally{globalThis.fetch=saved;}
});
test('failed payments and currency/reference mismatches never reach the confirmation RPC',async()=>{
 const saved=globalThis.fetch;process.env.PAYSTACK_SECRET_KEY='sk_test_fake';
 try{for(const data of [{status:'failed',currency:'NGN',reference:'MGS-test'},{status:'success',currency:'USD',reference:'MGS-test'},{status:'success',currency:'NGN',reference:'other'}]){let calls=0;globalThis.fetch=async()=>{calls++;return {ok:true,json:async()=>({status:true,data})};};assert.equal(await verifySupplierPayment('MGS-test'),'pending');assert.equal(calls,1);}}finally{globalThis.fetch=saved;}
});
