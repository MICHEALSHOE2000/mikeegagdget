import {createHmac,timingSafeEqual} from 'node:crypto';
import {env,reply,verify} from '../_shop.mjs';
export const config={api:{bodyParser:false}};
export function validSignature(raw,signature,key){if(typeof signature!=='string'||!/^\w{128}$/.test(signature)||!/^[0-9a-f]+$/i.test(signature))return false;return timingSafeEqual(createHmac('sha512',key).update(raw).digest(),Buffer.from(signature,'hex'));}
export default async function handler(req,res){
 if(req.method!=='POST')return reply(res,405,{error:'Method not allowed'});
 try{
  const parts=[];let size=0;for await(const part of req){size+=part.length;if(size>1048576)return reply(res,413,{error:'Payload too large'});parts.push(Buffer.from(part));}
  const raw=Buffer.concat(parts);if(!validSignature(raw,req.headers['x-paystack-signature'],env('PAYSTACK_SECRET_KEY')))return reply(res,401,{error:'Invalid signature'});
  const event=JSON.parse(raw.toString('utf8'));
  if(event.event==='charge.success'&&/^MGP2-[a-f0-9]{32}$/.test(event.data?.reference||''))await verify(event.data.reference);
  return reply(res,200,{received:true});
 }catch{return reply(res,500,{error:'Please retry webhook delivery.'});}
}
