import {randomUUID} from 'node:crypto';
import {db,env,paystack,sendJson} from '../_checkout.mjs';
export default async function handler(req,res){
 if(req.method!=='POST')return sendJson(res,405,{error:'Method not allowed'});
 const token=String(req.body?.token||'');
 if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(token))return sendJson(res,400,{error:'Invalid request'});
 try{
  const reference='MGS-'+randomUUID().replaceAll('-','');
  const result=await db('rpc/supplier_begin_payment',{method:'POST',body:{p_token:token,p_reference:reference}});
  const ord=result?.[0];
  if(!ord)throw Error('Quote not approved');
  const callback=env('SITE_URL').replace(/\/$/,'')+'/order/?token='+encodeURIComponent(token);
  const transaction=await paystack('/transaction/initialize',{method:'POST',body:JSON.stringify({
   reference,amount:ord.amount_ngn*100,currency:'NGN',email:ord.customer_email,
   callback_url:callback,metadata:{order_id:ord.order_id}
  })});
  return sendJson(res,200,{checkout_url:transaction.authorization_url});
 }catch(e){console.error('Supplier payment initialization failed',e.message);return sendJson(res,409,{error:'Payment is not ready. Please contact Mikee to confirm your quote.'});}
}
