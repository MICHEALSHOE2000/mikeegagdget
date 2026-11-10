import {createHmac,timingSafeEqual} from 'node:crypto';
import {confirmPayment,env,sendJson} from '../_checkout.mjs';
import {verifySupplierPayment} from '../supplier/verify.mjs';
export const config={api:{bodyParser:false}};
async function rawBody(req){const chunks=[];for await(const part of req){chunks.push(Buffer.from(part));if(chunks.reduce((n,b)=>n+b.length,0)>1024*1024)throw Error('Webhook too large');}return Buffer.concat(chunks);}
function signatureValid(raw,req){
 const legacy=req.headers['x-paystack-signature'];
 if(typeof legacy==='string' && /^[a-f0-9]{128}$/i.test(legacy)){
  const expected=createHmac('sha512',env('PAYSTACK_SECRET_KEY')).update(raw).digest();
  return timingSafeEqual(expected,Buffer.from(legacy,'hex'));
 }
 const header=req.headers['paystack-signature'];
 const secret=process.env.PAYSTACK_WEBHOOK_SECRET;
 if(!secret||typeof header!=='string')return false;
 const parts=Object.fromEntries(header.split(',').map(p=>p.trim().split('=',2)));
 const timestamp=Number(parts.t);
 if(!Number.isSafeInteger(timestamp)||Math.abs(Date.now()/1000-timestamp)>300)return false;
 const expected=createHmac('sha512',secret).update(String(timestamp)).update('.').update(raw).digest('hex');
 return header.split(',').some(part=>{const m=part.trim().match(/^v1=whk_[^:]+:([0-9a-f]{128})$/);return m&&timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(m[1],'hex'));});
}
export default async function handler(req,res){
 if(req.method!=='POST')return sendJson(res,405,{error:'Method not allowed'});
 try{
 const raw=await rawBody(req);
 if(!signatureValid(raw,req))return sendJson(res,401,{error:'Invalid signature'});
 const event=JSON.parse(raw.toString('utf8'));
 if(event.event==='charge.success'){
   const reference=String(event.data?.reference||'');
   if(/^MGP-[a-f0-9]{32}$/.test(reference))await confirmPayment(reference);
   if(/^MGS-[a-f0-9]{32}$/.test(reference))await verifySupplierPayment(reference);
 }
 return sendJson(res,200,{ok:true});
 }catch(error){console.error('Webhook processing error',error.message);return sendJson(res,500,{error:'Unable to process webhook'});}
}
