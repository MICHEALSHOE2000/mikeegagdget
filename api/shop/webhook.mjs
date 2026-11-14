import {createHmac,timingSafeEqual} from 'node:crypto';
import {db,env,reply,verify} from '../_shop.mjs';
import {creditDirectConfig,verifyCreditDirectWebhook,readCreditDirectEvent,CREDIT_DIRECT_EVENTS} from '../../commerce/credit-direct.mjs';
export const config={api:{bodyParser:false}};
export function validSignature(raw,signature,key){if(typeof signature!=='string'||!/^\w{128}$/.test(signature)||!/^[0-9a-f]+$/i.test(signature))return false;return timingSafeEqual(createHmac('sha512',key).update(raw).digest(),Buffer.from(signature,'hex'));}
// Credit Direct deliveries carry svix-* headers. Signature, timestamp and event id are checked before anything is stored.
export async function creditDirectWebhook(raw,headers,res,settings=creditDirectConfig(),store=db){
 if(!settings.ready)return reply(res,503,{error:'Credit Direct is not enabled.'});
 let verified;try{verified=verifyCreditDirectWebhook({headers,rawBody:raw.toString('utf8'),secret:settings.webhookSecret});}catch{return reply(res,401,{error:'Invalid signature'});}
 const event=readCreditDirectEvent(verified.event);
 if(!CREDIT_DIRECT_EVENTS.includes(event.type))return reply(res,200,{received:true,ignored:true});
 if(!event.transactionId&&!event.sessionId)return reply(res,422,{error:'Event has no transaction reference.'});
 const status=await store('rpc/shop_credit_direct_event',{method:'POST',body:{p_event_id:verified.id,p_event_type:event.type,p_session_id:event.sessionId,p_transaction_id:event.transactionId,p_total_ngn:event.totalAmount}});
 return reply(res,200,{received:true,status});
}
export default async function handler(req,res){
 if(req.method!=='POST')return reply(res,405,{error:'Method not allowed'});
 try{
  const parts=[];let size=0;for await(const part of req){size+=part.length;if(size>1048576)return reply(res,413,{error:'Payload too large'});parts.push(Buffer.from(part));}
  const raw=Buffer.concat(parts);
  if(req.headers['svix-id'])return await creditDirectWebhook(raw,req.headers,res);
  if(!validSignature(raw,req.headers['x-paystack-signature'],env('PAYSTACK_SECRET_KEY')))return reply(res,401,{error:'Invalid signature'});
  const event=JSON.parse(raw.toString('utf8'));
  if(event.event==='charge.success'&&/^MGP2-[a-f0-9]{32}$/.test(event.data?.reference||''))await verify(event.data.reference);
  return reply(res,200,{received:true});
 }catch{return reply(res,500,{error:'Please retry webhook delivery.'});}
}
