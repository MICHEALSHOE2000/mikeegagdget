import {randomUUID} from 'node:crypto';
import {db,env,paystack,sendJson} from '../_checkout.mjs';
export default async function handler(req,res){
 if(req.method!=='POST')return sendJson(res,405,{error:'Method not allowed'});
 const token=String(req.body?.token||'');
 if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(token))return sendJson(res,400,{error:'Invalid request'});
 try{
 const result=await db('rpc/supplier_begin_payment',{method:'POST',body:{p_token:token,p_reference:'MGS-'+randomUUID().replaceAll('-','')}});const ord=result?.[0];if(!ord)throw Error('Quote not approved');
 if(req.body.expected_total_ngn!==ord.amount_ngn)return sendJson(res,409,{error:'Your quote changed. Refresh the order and review the confirmed total before paying.'});
 const rows=await db('supplier_orders?select=authorization_url,paystack_reference&token=eq.'+token);const existing=rows[0];
 if(existing.authorization_url)return sendJson(res,200,{checkout_url:existing.authorization_url});
 // The database returns the same reference for all retries. Never create a second charge reference.
 let transaction;
 try{transaction=await paystack('/transaction/initialize',{method:'POST',body:JSON.stringify({reference:existing.paystack_reference,amount:ord.amount_ngn*100,currency:'NGN',email:ord.customer_email,callback_url:env('SITE_URL').replace(/\/$/,'')+'/order/?token='+token,metadata:{order_id:ord.order_id}})});}
 catch{ return sendJson(res,409,{error:'Payment is already being prepared or the provider is unavailable. Refresh your order before retrying. Do not start another order if you have paid.'}); }
 const u=new URL(transaction.authorization_url);if(u.protocol!=='https:'||u.hostname!=='checkout.paystack.com')throw Error('Invalid payment URL');
 await db('supplier_orders?id=eq.'+ord.order_id,{method:'PATCH',body:{authorization_url:u.href}});
 return sendJson(res,200,{checkout_url:u.href});
 }catch(e){console.error('Payment initialization failed',e.message);return sendJson(res,409,{error:'Payment is not ready. Await supplier confirmation or refresh your order.'});}
}
