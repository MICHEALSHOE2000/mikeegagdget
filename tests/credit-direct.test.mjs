import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {createCreditDirectTransaction,signCreditDirectTransaction,verifyCreditDirectWebhook} from '../commerce/credit-direct.mjs';
const customer={sessionId:'merchantCheckout12345',customerEmail:'buyer@example.com',customerPhone:'2348012345678',products:[{productId:'iphone-17|256GB',productName:'iPhone 17 Pro',productAmount:1800000}]};
test('Credit Direct signature signs only server-verified product totals',()=>{
 const t=createCreditDirectTransaction(customer);
 assert.equal(t.totalAmount,1800000);
 assert.equal(signCreditDirectTransaction(t,'sandbox-key'),createHmac('sha256','sandbox-key').update('merchantCheckout12345buyer@example.com1800000').digest('hex'));
 assert.throws(()=>signCreditDirectTransaction({...t,totalAmount:1},'sandbox-key'),/do not match/);
 assert.throws(()=>createCreditDirectTransaction({...customer,products:[{productId:'x',productName:'Phone',productAmount:0}]}),/verified amounts/);
});
test('Svix-style webhook accepts valid raw signatures and rejects tampering and replays',()=>{
 const secret='whsec_'+Buffer.from('secure-dev-secret-with-more-than-16-bytes').toString('base64');
 const id='msg_abc',stamp='1794640000',rawBody='{"eventType":"Checkout_Merchant_Payment_Completed","checkoutTransactionId":"tx_1"}';
 const sign=body=>createHmac('sha256',Buffer.from(secret.slice(6),'base64')).update(id+'.'+stamp+'.'+body).digest('base64');
 const headers={'svix-id':id,'svix-timestamp':stamp,'svix-signature':'v1,'+sign(rawBody)};
 const nowMs=Number(stamp)*1000;
 assert.equal(verifyCreditDirectWebhook({headers,rawBody,secret,nowMs}).event.checkoutTransactionId,'tx_1');
 assert.throws(()=>verifyCreditDirectWebhook({headers,rawBody:rawBody+' ',secret,nowMs}),/signature/);
 assert.throws(()=>verifyCreditDirectWebhook({headers,rawBody,secret,nowMs:nowMs+6*60*1000}),/Expired/);
});
