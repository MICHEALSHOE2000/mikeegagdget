import {randomUUID} from 'node:crypto';
import {db,env,paystack,productById,sendJson} from '../_checkout.mjs';
export default async function handler(req,res){
 if(req.method!=='POST')return sendJson(res,405,{error:'Method not allowed'});
 try{
 const {sku,quantity,name,email,phone,fulfillment}=req.body||{};
 const item=productById(sku);
 if(!item||!Number.isSafeInteger(quantity)||quantity<1||quantity>20||!item.price||fulfillment!=='pickup')return sendJson(res,400,{error:'Choose a priced phone, quantity and store pickup.'});
 if(typeof name!=='string'||name.trim().length<2||name.length>100||typeof email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>200||typeof phone!=='string'||!/^[+0-9 ()-]{7,20}$/.test(phone))return sendJson(res,400,{error:'Enter a valid name, email and phone number.'});
 const reference='MGP-'+randomUUID().replaceAll('-','');
 const [order]=await db('rpc/checkout_reserve',{method:'POST',body:{p_sku:sku,p_name:item.label,p_quantity:quantity,p_customer_name:name.trim(),p_customer_email:email.trim().toLowerCase(),p_customer_phone:phone.trim(),p_reference:reference}});
 if(!order?.order_id)throw Error('Could not reserve an order');
 const callback=env('SITE_URL').replace(/\/$/,'')+'/checkout/complete/?reference='+encodeURIComponent(reference);
 const tx=await paystack('/transaction/initialize',{method:'POST',body:JSON.stringify({reference,email:email.trim().toLowerCase(),amount:order.amount_ngn*100,currency:'NGN',callback_url:callback,metadata:{order_id:order.order_id}})});
 return sendJson(res,200,{checkout_url:tx.authorization_url,order_id:order.order_id,reference});
 }catch(error){console.error('Checkout initialization error',error.message);return sendJson(res,503,{error:'Checkout is currently unavailable. Please contact Mikee to confirm stock.'});}
}
