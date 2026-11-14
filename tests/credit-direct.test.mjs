import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {creditDirectConfig,createCreditDirectTransaction,signCreditDirectTransaction,verifyCreditDirectWebhook,readCreditDirectEvent,linkToken,validLinkToken} from '../commerce/credit-direct.mjs';
import {financingStatus} from '../commerce/financing-provider.mjs';
import {creditDirectWebhook} from '../api/shop/webhook.mjs';
import createHandler from '../api/shop/create.mjs';

const keys={CREDIT_DIRECT_PUBLIC_KEY:'pk_test',CREDIT_DIRECT_PRIVATE_KEY:'sk_test_private',CREDIT_DIRECT_WEBHOOK_SECRET:'whsec_'+Buffer.from('0123456789abcdef0123456789abcdef').toString('base64')};
const response=()=>({status(n){this.code=n;return this;},setHeader(){return this;},json(body){this.body=body;return this;}});
const products=[{productId:'iphone-17-pro|256GB',productName:'iPhone 17 Pro 256GB',productAmount:1660000},{productId:'airpods-pro-3|Standard',productName:'AirPods Pro 3',productAmount:330000}];
const tx=()=>createCreditDirectTransaction({sessionId:'MGP2-0123456789abcdef0123456789abcdef',customerEmail:'buyer@example.com',customerPhone:'08012345678',products});
function signed(body,{id='msg_12345',now=Date.now(),secret=keys.CREDIT_DIRECT_WEBHOOK_SECRET}={}){
 const stamp=String(Math.floor(now/1000)),raw=JSON.stringify(body);
 const signature='v1,'+createHmac('sha256',Buffer.from(secret.slice(6),'base64')).update(id+'.'+stamp+'.'+raw).digest('base64');
 return {raw,headers:{'svix-id':id,'svix-timestamp':stamp,'svix-signature':signature}};
}

test('Credit Direct stays off unless the flag and every key are set',()=>{
 assert.equal(creditDirectConfig({}).ready,false);
 assert.equal(creditDirectConfig(keys).ready,false);
 assert.equal(creditDirectConfig({...keys,CREDIT_DIRECT_ENABLED:'true',CREDIT_DIRECT_WEBHOOK_SECRET:''}).ready,false);
 assert.equal(creditDirectConfig({...keys,CREDIT_DIRECT_ENABLED:'true'}).ready,true);
 assert.deepEqual(financingStatus(),{provider:'credit-direct',available:false,reason:'Official integration pending verification'});
});
test('transaction total is the sum of server-priced products and the signature covers session, email and total',()=>{
 const t=tx();assert.equal(t.totalAmount,1990000);
 assert.equal(signCreditDirectTransaction(t,'sk_test_private'),createHmac('sha256','sk_test_private').update('MGP2-0123456789abcdef0123456789abcdefbuyer@example.com1990000').digest('hex'));
 assert.throws(()=>signCreditDirectTransaction({...t,totalAmount:1},'sk_test_private'));
 assert.throws(()=>signCreditDirectTransaction(t,''));
 assert.throws(()=>createCreditDirectTransaction({sessionId:'short',customerEmail:'buyer@example.com',customerPhone:'08012345678',products}));
 assert.throws(()=>createCreditDirectTransaction({sessionId:'MGP2-0123456789abcdef0123456789abcdef',customerEmail:'buyer@example.com',customerPhone:'08012345678',products:[{...products[0],productAmount:0}]}));
});
test('webhook verification accepts a valid signature and rejects tampering, stale timestamps and bad signatures',()=>{
 const body={event:'Checkout_Merchant_Payment_Completed',data:{checkoutTransactionId:'cd_tx_1',sessionId:'MGP2-0123456789abcdef0123456789abcdef',totalAmount:1990000}};
 const good=signed(body);
 const ok=verifyCreditDirectWebhook({headers:good.headers,rawBody:good.raw,secret:keys.CREDIT_DIRECT_WEBHOOK_SECRET});
 assert.equal(ok.id,'msg_12345');
 assert.deepEqual(readCreditDirectEvent(ok.event),{type:'Checkout_Merchant_Payment_Completed',transactionId:'cd_tx_1',sessionId:'MGP2-0123456789abcdef0123456789abcdef',totalAmount:1990000});
 assert.throws(()=>verifyCreditDirectWebhook({headers:good.headers,rawBody:good.raw.replace('1990000','1'),secret:keys.CREDIT_DIRECT_WEBHOOK_SECRET}),/verification failed/);
 assert.throws(()=>verifyCreditDirectWebhook({headers:{...good.headers,'svix-id':'msg_other'},rawBody:good.raw,secret:keys.CREDIT_DIRECT_WEBHOOK_SECRET}),/verification failed/);
 assert.throws(()=>verifyCreditDirectWebhook({headers:{...good.headers,'svix-signature':'v2,'+good.headers['svix-signature'].slice(3)},rawBody:good.raw,secret:keys.CREDIT_DIRECT_WEBHOOK_SECRET}),/verification failed/);
 const stale=signed(body,{now:Date.now()-6*60*1000});
 assert.throws(()=>verifyCreditDirectWebhook({headers:stale.headers,rawBody:stale.raw,secret:keys.CREDIT_DIRECT_WEBHOOK_SECRET}),/Expired/);
 assert.throws(()=>verifyCreditDirectWebhook({headers:{},rawBody:good.raw,secret:keys.CREDIT_DIRECT_WEBHOOK_SECRET}),/Missing/);
});
test('webhook route: off when disabled, 401 on bad signature, passes verified events to the database once',async()=>{
 const body={event:'Checkout_Customer_Payment_Completed',data:{checkoutTransactionId:'cd_tx_1',sessionId:'MGP2-0123456789abcdef0123456789abcdef'}},good=signed(body);
 let res=response();await creditDirectWebhook(Buffer.from(good.raw),good.headers,res,creditDirectConfig(keys));assert.equal(res.code,503);
 const on=creditDirectConfig({...keys,CREDIT_DIRECT_ENABLED:'true'}),calls=[];
 const store=async(path,options)=>{calls.push([path,options.body]);return 'awaiting_merchant_payment';};
 res=response();await creditDirectWebhook(Buffer.from(good.raw+' '),good.headers,res,on,store);assert.equal(res.code,401);assert.equal(calls.length,0);
 res=response();await creditDirectWebhook(Buffer.from(good.raw),good.headers,res,on,store);
 assert.equal(res.code,200);assert.equal(res.body.status,'awaiting_merchant_payment');
 assert.deepEqual(calls[0],['rpc/shop_credit_direct_event',{p_event_id:'msg_12345',p_event_type:'Checkout_Customer_Payment_Completed',p_session_id:'MGP2-0123456789abcdef0123456789abcdef',p_transaction_id:'cd_tx_1',p_total_ngn:null}]);
 const other=signed({event:'Checkout_Something_Else',data:{}});res=response();await creditDirectWebhook(Buffer.from(other.raw),other.headers,res,on,store);
 assert.equal(res.body.ignored,true);assert.equal(calls.length,1);
});
test('link tokens bind a provider transaction to the order that started it',()=>{
 const token=linkToken('MGP2-0123456789abcdef0123456789abcdef','sk_test_private');
 assert.equal(validLinkToken('MGP2-0123456789abcdef0123456789abcdef',token,'sk_test_private'),true);
 assert.equal(validLinkToken('MGP2-ffffffffffffffffffffffffffffffff',token,'sk_test_private'),false);
 assert.equal(validLinkToken('MGP2-0123456789abcdef0123456789abcdef','nope','sk_test_private'),false);
});
test('checkout refuses Pay Small Small while Credit Direct is switched off',async()=>{
 process.env.SHOP_ORIGIN='https://shop.example';
 const res=response();await createHandler({method:'POST',headers:{origin:'https://shop.example'},body:{paymentMethod:'credit_direct'}},res);
 assert.equal(res.code,503);assert.match(res.body.error,/pay outright/);
 delete process.env.SHOP_ORIGIN;
});
test('private key and webhook secret never appear in browser code',async()=>{
 for(const file of ['assets/credit-direct-checkout.js','assets/shopping.js']){const text=await readFile(file,'utf8');assert.doesNotMatch(text,/PRIVATE_KEY|WEBHOOK_SECRET|privateKey|webhookSecret|node:crypto/);}
});
