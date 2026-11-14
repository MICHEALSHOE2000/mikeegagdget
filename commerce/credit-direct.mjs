import {createHmac,timingSafeEqual} from 'node:crypto';

const safeMoney=value=>Number.isSafeInteger(value)&&value>0&&value<=9000000000;
export function createCreditDirectTransaction({sessionId,customerEmail,customerPhone,products,metaData=''}) {
 if(typeof sessionId!=='string'||!^[A-Za-z0-9_-]{12,80}$/.test(sessionId))throw Error('Invalid checkout session.');
 if(typeof customerEmail!=='string'||!/^\S+@\S+\.\S+$/.test(customerEmail))throw Error('Valid customer email required.');
 if(typeof customerPhone!=='string'||customerPhone.length<7||customerPhone.length>30)throw Error('Valid phone required.');
 if(!Array.isArray(products)||products.length<1||products.length>30)throw Error('Choose a valid product.');
 const valid=products.every(product=>typeof product.productId==='string'&&product.productId.length>0&&product.productId.length<=250&&typeof product.productName==='string'&&product.productName.length>0&&safeMoney(product.productAmount));
 if(!valid)throw Error('Checkout products must have verified amounts.');
 const totalAmount=products.reduce((sum,p)=>sum+p.productAmount,0);
 if(!safeMoney(totalAmount))throw Error('Checkout amount is out of range.');
 return {totalAmount,customerEmail,customerPhone,sessionId,metaData,products};
}
export function signCreditDirectTransaction(transaction,privateKey){
 if(!privateKey||typeof privateKey!=='string')throw Error('Credit Direct credentials are missing.');
 if(!transaction||!safeMoney(transaction.totalAmount))throw Error('Invalid signed checkout amount.');
 const sum=transaction.products?.reduce((n,p)=>n+p.productAmount,0);
 if(sum!==transaction.totalAmount)throw Error('Products and checkout total do not match.');
 return createHmac('sha256',privateKey).update(transaction.sessionId+transaction.customerEmail+String(transaction.totalAmount),'utf8').digest('hex');
}
export function verifyCreditDirectWebhook({headers,rawBody,secret,nowMs=Date.now()}){
 const header=name=>headers?.[name]??headers?.[name.toLowerCase()]??headers?.[name.toUpperCase()];
 const id=header('svix-id'),stamp=header('svix-timestamp'),signature=header('svix-signature');
 if(typeof id!=='string'||!id||typeof signature!=='string'||!signature)throw Error('Missing signed webhook headers.');
 if(typeof stamp!=='string'||!/^\d{9,12}$/.test(stamp))throw Error('Invalid webhook timestamp.');
 const timestamp=Number(stamp)*1000;
 if(!Number.isSafeInteger(timestamp)||Math.abs(nowMs-timestamp)>5*60*1000)throw Error('Expired webhook timestamp.');
 if(typeof rawBody!=='string'||rawBody.length===0||rawBody.length>262144)throw Error('Invalid webhook body.');
 if(typeof secret!=='string'||!secret.startsWith('whsec_'))throw Error('Webhook signing secret is not configured.');
 const decoded=Buffer.from(secret.slice(6),'base64');
 if(decoded.length<16)throw Error('Invalid webhook secret.');
 const expected=createHmac('sha256',decoded).update(id+'.'+stamp+'.'+rawBody,'utf8').digest();
 const matches=signature.split(/\s+/).some(part=>{
  const match=/^v1,([A-Za-z0-9+/=_-]+)$/.exec(part);
  if(!match)return false;
  const bytes=Buffer.from(match[1].replaceAll('-','+').replaceAll('_','/'),'base64');
  return bytes.length===expected.length&&timingSafeEqual(bytes,expected);
 });
 if(!matches)throw Error('Webhook signature verification failed.');
 let event;try{event=JSON.parse(rawBody);}catch{throw Error('Invalid webhook JSON.');}
 if(!event||typeof event!=='object'||Array.isArray(event))throw Error('Invalid webhook event.');
 return {id,event};
}
