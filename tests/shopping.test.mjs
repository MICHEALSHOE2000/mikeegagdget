import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanCart,readCart,addToCart} from '../commerce/cart.mjs';
import {searchCatalogue,searchScore} from '../commerce/search.mjs';
import {validateCheckout} from '../commerce/checkout-validation.mjs';
import {verify} from '../api/_shop.mjs';

test('cart merges exact colour SKUs and rejects malformed quantities',()=>{
 assert.deepEqual(cleanCart([{sku:'a',color:'Blue',quantity:1},{sku:'a',color:'Blue',quantity:2},{sku:'a',color:'Gold',quantity:1},{sku:'b',quantity:1.5},{sku:'c',quantity:-1}]),[{sku:'a',color:'Blue',quantity:3},{sku:'a',color:'Gold',quantity:1}]);
 const values=new Map();const storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 addToCart(storage,{sku:'a',quantity:1});assert.equal(readCart(storage)[0].quantity,1);
 assert.deepEqual(readCart({getItem:()=>'{broken'}),[]);
});
test('search ranks exact models, handles typos and keeps model numbers distinct',()=>{
 const models=['iPhone 15 Pro Max','iPhone 15','iPhone 15 Pro','iPhone 16'].map(model=>({model}));
 assert.equal(searchCatalogue(models,'iphone 15')[0].model,'iPhone 15');
 assert.equal(searchCatalogue(models,'iphnoe 15 pro max')[0].model,'iPhone 15 Pro Max');
 assert.equal(searchScore({model:'iPhone 16'},'iphone 15'),-1);
});
const checkout=()=>({requestId:'12345678-1234-1234-1234-123456789abc',firstName:'Test',lastName:'Buyer',email:'BUYER@example.com',phone:'08012345678',agreed:true,fulfillment:'delivery',state:'Lagos',city:'Ikeja',address:'Test address',items:[{sku:'a',quantity:1}]});
test('checkout requires delivery address and consent, ignores client prices',()=>{
 const body=checkout();body.amount=1;body.items[0].price=1;
 const result=validateCheckout(body);assert.equal(result.customer.email,'buyer@example.com');assert.equal(result.items[0].price,undefined);assert.equal(result.amount,undefined);
 assert.throws(()=>validateCheckout({...body,agreed:false}),/agree/);
 assert.throws(()=>validateCheckout({...body,state:'Elsewhere'}),/address/);
 assert.throws(()=>validateCheckout({...body,requestId:'------------------------------------'}),/Refresh/);
 assert.equal(validateCheckout({...body,fulfillment:'pickup',state:'',city:'',address:''}).customer.fulfillment,'pickup');
});
test('server verifies reference and currency before attempting to mark paid',async()=>{
 const saved=globalThis.fetch;const old=process.env.PAYSTACK_SECRET_KEY;process.env.PAYSTACK_SECRET_KEY='sk_test_fixture';
 try{
  globalThis.fetch=async()=>({ok:true,json:async()=>({status:true,data:{reference:'wrong',currency:'NGN',status:'success'}})});
  await assert.rejects(verify('expected'),/do not match/);
  globalThis.fetch=async()=>({ok:true,json:async()=>({status:true,data:{reference:'expected',currency:'USD',status:'success'}})});
  await assert.rejects(verify('expected'),/do not match/);
  globalThis.fetch=async()=>({ok:true,json:async()=>({status:true,data:{reference:'expected',currency:'NGN',status:'abandoned'}})});
  assert.deepEqual(await verify('expected'),{status:'cancelled'});
 }finally{globalThis.fetch=saved;if(old===undefined)delete process.env.PAYSTACK_SECRET_KEY;else process.env.PAYSTACK_SECRET_KEY=old;}
});

test('webhooks accept authentic raw bodies and reject altered payloads',async()=>{
 const {validSignature}=await import('../api/shop/webhook.mjs');const {createHmac}=await import('node:crypto');
 const raw=Buffer.from('{"event":"charge.success"}'),key='fixture';const signature=createHmac('sha512',key).update(raw).digest('hex');
 assert.equal(validSignature(raw,signature,key),true);assert.equal(validSignature(Buffer.from('{}'),signature,key),false);assert.equal(validSignature(raw,'bad',key),false);
});
