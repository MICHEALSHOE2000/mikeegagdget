// Credit Direct (Pay Small Small) server-side helpers. Never import this file from browser code.
// Signing and webhook rules follow the merchant's integration brief; confirm each against the official
// Credit Direct documentation in sandbox before CREDIT_DIRECT_ENABLED is switched on.
import {createHmac,timingSafeEqual} from 'node:crypto';

export const CREDIT_DIRECT_SCRIPT='https://checkout.creditdirect.ng/bnpl/checkout.min.js';
export const CREDIT_DIRECT_EVENTS=Object.freeze(['Checkout_Customer_Payment_Completed','Checkout_Merchant_Payment_Completed']);
const WEBHOOK_TOLERANCE_MS=5*60*1000;
const safeMoney=value=>Number.isSafeInteger(value)&&value>0&&value<=9000000000;

export function creditDirectConfig(source=typeof process==='undefined'?{}:process.env){
 const publicKey=source.CREDIT_DIRECT_PUBLIC_KEY||'',privateKey=source.CREDIT_DIRECT_PRIVATE_KEY||'',webhookSecret=source.CREDIT_DIRECT_WEBHOOK_SECRET||'';
 const ready=source.CREDIT_DIRECT_ENABLED==='true'&&!!publicKey&&!!privateKey&&!!webhookSecret;
 return {ready,publicKey,privateKey,webhookSecret,isLive:source.CREDIT_DIRECT_IS_LIVE==='true'};
}
export function createCreditDirectTransaction({sessionId,customerEmail,customerPhone,products,metaData={}}){
 if(typeof sessionId!=='string'||!/^[A-Za-z0-9_-]{12,80}$/.test(sessionId))throw Error('Invalid checkout session.');
 if(typeof customerEmail!=='string'||!/^\S+@\S+\.\S+$/.test(customerEmail))throw Error('Valid customer email required.');
 if(typeof customerPhone!=='string'||customerPhone.length<7||customerPhone.length>30)throw Error('Valid phone required.');
 if(!Array.isArray(products)||products.length<1||products.length>30)throw Error('Choose a valid product.');
 if(!products.every(p=>typeof p.productId==='string'&&p.productId.length>0&&p.productId.length<=250&&typeof p.productName==='string'&&p.productName.length>0&&safeMoney(p.productAmount)))throw Error('Checkout products must have verified amounts.');
 const totalAmount=products.reduce((sum,p)=>sum+p.productAmount,0);
 if(!safeMoney(totalAmount))throw Error('Checkout amount is out of range.');
 return {totalAmount,customerEmail,customerPhone,sessionId,metaData,products:products.map(p=>({productName:p.productName,productAmount:p.productAmount,productId:p.productId}))};
}
// HMAC-SHA256(privateKey, sessionId + customerEmail + totalAmount), hex encoded.
export function signCreditDirectTransaction(transaction,privateKey){
 if(!privateKey||typeof privateKey!=='string')throw Error('Credit Direct credentials are missing.');
 if(!transaction||!safeMoney(transaction.totalAmount))throw Error('Invalid signed checkout amount.');
 if(transaction.products?.reduce((n,p)=>n+p.productAmount,0)!==transaction.totalAmount)throw Error('Products and checkout total do not match.');
 return createHmac('sha256',privateKey).update(transaction.sessionId+transaction.customerEmail+String(transaction.totalAmount),'utf8').digest('hex');
}
// Ties a browser-reported checkoutTransactionId to the order that browser actually started.
export function linkToken(reference,privateKey){return createHmac('sha256',privateKey).update('link:'+reference,'utf8').digest('hex');}
export function validLinkToken(reference,token,privateKey){
 if(typeof token!=='string'||!/^[0-9a-f]{64}$/.test(token))return false;
 return timingSafeEqual(Buffer.from(token,'hex'),Buffer.from(linkToken(reference,privateKey),'hex'));
}
// Svix-style verification over the raw body: HMAC-SHA256(base64-decoded secret, id + "." + timestamp + "." + rawBody).
export function verifyCreditDirectWebhook({headers,rawBody,secret,nowMs=Date.now()}){
 const id=headers?.['svix-id'],stamp=headers?.['svix-timestamp'],signature=headers?.['svix-signature'];
 if(typeof id!=='string'||!id||id.length>200||typeof signature!=='string'||!signature)throw Error('Missing signed webhook headers.');
 if(typeof stamp!=='string'||!/^\d{9,12}$/.test(stamp))throw Error('Invalid webhook timestamp.');
 if(Math.abs(nowMs-Number(stamp)*1000)>WEBHOOK_TOLERANCE_MS)throw Error('Expired webhook timestamp.');
 if(typeof rawBody!=='string'||!rawBody||rawBody.length>262144)throw Error('Invalid webhook body.');
 if(typeof secret!=='string'||!secret)throw Error('Webhook signing secret is not configured.');
 const key=Buffer.from(secret.startsWith('whsec_')?secret.slice(6):secret,'base64');
 if(key.length<16)throw Error('Invalid webhook secret.');
 const expected=createHmac('sha256',key).update(id+'.'+stamp+'.'+rawBody,'utf8').digest();
 const matches=signature.split(/\s+/).some(part=>{
  const match=/^v1,([A-Za-z0-9+/=]+)$/.exec(part);if(!match)return false;
  const bytes=Buffer.from(match[1],'base64');
  return bytes.length===expected.length&&timingSafeEqual(bytes,expected);
 });
 if(!matches)throw Error('Webhook signature verification failed.');
 let event;try{event=JSON.parse(rawBody);}catch{throw Error('Invalid webhook JSON.');}
 if(!event||typeof event!=='object'||Array.isArray(event))throw Error('Invalid webhook event.');
 return {id,event};
}
// Field names below are assumptions until checked against a real sandbox webhook.
export function readCreditDirectEvent(event){
 const data=event.data&&typeof event.data==='object'?event.data:event,text=v=>typeof v==='string'&&v&&v.length<=200?v:null;
 const total=data.totalAmount??data.amount;
 return {type:text(event.event??event.eventType??event.type),transactionId:text(data.checkoutTransactionId??data.transactionId),sessionId:text(data.sessionId),totalAmount:Number.isSafeInteger(total)?total:null};
}
