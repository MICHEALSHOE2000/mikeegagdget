import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {creditDirectConfig,createCreditDirectTransaction,signCreditDirectTransaction,verifyCreditDirectWebhook,readCreditDirectEvent,linkToken,validLinkToken,newSessionId} from '../commerce/credit-direct.mjs';
import {financingStatus} from '../commerce/financing-provider.mjs';
import {creditDirectWebhook} from '../api/shop/webhook.mjs';
import createHandler from '../api/shop/create.mjs';

const keys={CREDIT_DIRECT_PUBLIC_KEY:'pk_test',CREDIT_DIRECT_PRIVATE_KEY:'sk_test_private',CREDIT_DIRECT_WEBHOOK_SECRET:'whsec_'+Buffer.from('0123456789abcdef0123456789abcdef').toString('base64')};
const response=()=>({status(n){this.code=n;return this;},setHeader(){return this;},json(body){this.body=body;return this;}});
const products=[{productId:'iphone-17-pro|256GB',productName:'iPhone 17 Pro 256GB',productAmount:1660000},{productId:'airpods-pro-3|Standard',productName:'AirPods Pro 3',productAmount:330000}];
const tx=()=>createCreditDirectTransaction({sessionId:'Sess0123456789abcdefXYZ',customerEmail:'buyer@example.com',customerPhone:'08012345678',products,metaData:'MGP2-0123456789abcdef0123456789abcdef'});
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
 assert.deepEqual(financingStatus(),{provider:'credit-direct',available:false,reason:'Credit Direct is not configured on this deployment'});
});
test('transaction total is the sum of server-priced products and the signature covers session, email and total',()=>{
 const t=tx();assert.equal(t.totalAmount,1990000);
 assert.equal(signCreditDirectTransaction(t,'sk_test_private'),createHmac('sha256','sk_test_private').update('Sess0123456789abcdefXYZbuyer@example.com1990000').digest('hex'));
 assert.throws(()=>signCreditDirectTransaction({...t,totalAmount:1},'sk_test_private'));
 assert.throws(()=>signCreditDirectTransaction(t,''));
 assert.throws(()=>createCreditDirectTransaction({sessionId:'short',customerEmail:'buyer@example.com',customerPhone:'08012345678',products}));
 assert.throws(()=>createCreditDirectTransaction({sessionId:'Sess0123456789abcdefXYZ',customerEmail:'buyer@example.com',customerPhone:'08012345678',products:[{...products[0],productAmount:0}]}));
});
const docEvent=(eventType,amounts=['1660000','330000'])=>({checkoutCustomer:{firstName:'John',lastName:'Doe'},checkoutTransactionId:'75455457879vjh566',eventType,metaData:'MGP2-0123456789abcdef0123456789abcdef',products:[{productAmount:amounts[0],productId:'iphone-17-pro|256GB',productName:'iPhone 17 Pro 256GB'},{productAmount:amounts[1],productId:'airpods-pro-3|Standard',productName:'AirPods Pro 3'}],timeStamp:'2024-10-08T15:04:49.842987+00:00'});
test('webhook verification follows the documented svix scheme and rejects tampering, stale timestamps and bad signatures',()=>{
 const good=signed(docEvent('Checkout_Merchant_Payment_Completed'));
 const ok=verifyCreditDirectWebhook({headers:good.headers,rawBody:good.raw,secret:keys.CREDIT_DIRECT_WEBHOOK_SECRET});
 assert.equal(ok.id,'msg_12345');
 assert.deepEqual(readCreditDirectEvent(ok.event),{type:'Checkout_Merchant_Payment_Completed',transactionId:'75455457879vjh566',reference:'MGP2-0123456789abcdef0123456789abcdef',totalAmount:1990000,productIds:['iphone-17-pro|256GB','airpods-pro-3|Standard']});
 assert.equal(readCreditDirectEvent(docEvent('Checkout_Merchant_Payment_Completed',['1660000','abc'])).totalAmount,null);
 assert.equal(readCreditDirectEvent({...docEvent('Checkout_Merchant_Payment_Completed'),metaData:null}).reference,null);
 assert.throws(()=>verifyCreditDirectWebhook({headers:good.headers,rawBody:good.raw.replace('1660000','1'),secret:keys.CREDIT_DIRECT_WEBHOOK_SECRET}),/verification failed/);
 assert.throws(()=>verifyCreditDirectWebhook({headers:{...good.headers,'svix-id':'msg_other'},rawBody:good.raw,secret:keys.CREDIT_DIRECT_WEBHOOK_SECRET}),/verification failed/);
 assert.throws(()=>verifyCreditDirectWebhook({headers:{...good.headers,'svix-signature':'v2,'+good.headers['svix-signature'].slice(3)},rawBody:good.raw,secret:keys.CREDIT_DIRECT_WEBHOOK_SECRET}),/verification failed/);
 assert.equal(verifyCreditDirectWebhook({headers:{...good.headers,'svix-signature':'v1,AAAA '+good.headers['svix-signature']},rawBody:good.raw,secret:keys.CREDIT_DIRECT_WEBHOOK_SECRET}).id,'msg_12345');
 const stale=signed(docEvent('Checkout_Merchant_Payment_Completed'),{now:Date.now()-6*60*1000});
 assert.throws(()=>verifyCreditDirectWebhook({headers:stale.headers,rawBody:stale.raw,secret:keys.CREDIT_DIRECT_WEBHOOK_SECRET}),/Expired/);
 assert.throws(()=>verifyCreditDirectWebhook({headers:{},rawBody:good.raw,secret:keys.CREDIT_DIRECT_WEBHOOK_SECRET}),/Missing/);
});
test('the documented sample webhook secret decodes and verifies as the document describes',()=>{
 const secret='whsec_5WbX5kEWLlfzsGNjH64I8lOOqUB6e8FH',id='msg_x1',stamp=String(Math.floor(Date.now()/1000)),body='{"eventType":"Checkout_Customer_Payment_Completed","checkoutTransactionId":"t1","products":[]}';
 const sig=createHmac('sha256',Buffer.from(secret.split('_')[1],'base64')).update(`${id}.${stamp}.${body}`).digest('base64');
 assert.equal(verifyCreditDirectWebhook({headers:{'svix-id':id,'svix-timestamp':stamp,'svix-signature':'v1,'+sig},rawBody:body,secret}).id,'msg_x1');
});
test('webhook route: off when disabled, 401 on bad signature, passes verified events to the database',async()=>{
 const good=signed(docEvent('Checkout_Customer_Payment_Completed'));
 let res=response();await creditDirectWebhook(Buffer.from(good.raw),good.headers,res,creditDirectConfig(keys));assert.equal(res.code,503);
 const on=creditDirectConfig({...keys,CREDIT_DIRECT_ENABLED:'true'}),calls=[];
 const store=async(path,options)=>{calls.push([path,options.body]);return 'awaiting_merchant_payment';};
 res=response();await creditDirectWebhook(Buffer.from(good.raw+' '),good.headers,res,on,store);assert.equal(res.code,401);assert.equal(calls.length,0);
 res=response();await creditDirectWebhook(Buffer.from(good.raw),good.headers,res,on,store);
 assert.equal(res.code,200);assert.equal(res.body.status,'awaiting_merchant_payment');
 assert.deepEqual(calls[0],['rpc/shop_credit_direct_event',{p_event_id:'msg_12345',p_event_type:'Checkout_Customer_Payment_Completed',p_transaction_id:'75455457879vjh566',p_reference_hint:'MGP2-0123456789abcdef0123456789abcdef',p_total_ngn:1990000,p_product_ids:['iphone-17-pro|256GB','airpods-pro-3|Standard']}]);
 const other=signed({eventType:'Checkout_Something_Else',checkoutTransactionId:'x1'});res=response();await creditDirectWebhook(Buffer.from(other.raw),other.headers,res,on,store);
 assert.equal(res.body.ignored,true);assert.equal(calls.length,1);
});
test('a new session id is generated for every widget opening',()=>{
 const a=newSessionId(),b=newSessionId();assert.match(a,/^[A-Za-z0-9]{24}$/);assert.notEqual(a,b);
 assert.throws(()=>createCreditDirectTransaction({sessionId:'MGP2-has-dashes-0000',customerEmail:'buyer@example.com',customerPhone:'08012345678',products}));
 assert.throws(()=>createCreditDirectTransaction({sessionId:'Sess0123456789abcdefXYZ',customerEmail:'buyer@example.com',customerPhone:'08012345678',products,metaData:{order:'x'}}));
});
test('link tokens bind a provider transaction to the order and widget session that started it',()=>{
 const ref='MGP2-0123456789abcdef0123456789abcdef',token=linkToken(ref,'sk_test_private','Sess0123456789abcdefXYZ');
 assert.equal(validLinkToken(ref,token,'sk_test_private','Sess0123456789abcdefXYZ'),true);
 assert.equal(validLinkToken(ref,token,'sk_test_private','SessOTHER0000000000000'),false);
 assert.equal(validLinkToken('MGP2-ffffffffffffffffffffffffffffffff',token,'sk_test_private','Sess0123456789abcdefXYZ'),false);
 assert.equal(validLinkToken(ref,'nope','sk_test_private','Sess0123456789abcdefXYZ'),false);
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
