import {randomUUID} from 'node:crypto';
import {db,productById,sendJson} from '../_checkout.mjs';
export default async function handler(req,res){
 if(req.method!=='POST')return sendJson(res,405,{error:'Method not allowed'});
 try{
  const {sku,quantity,name,email,phone,fulfillment}=req.body||{};
  const item=productById(sku);
  if(!item||!Number.isSafeInteger(item.price)||item.price<=0||!Number.isInteger(quantity)||quantity<1||quantity>20||fulfillment!=='pickup')
   return sendJson(res,400,{error:'Choose a priced phone, quantity, and store pickup.'});
  if(typeof name!=='string'||name.trim().length<2||name.length>100||
     typeof email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>200||
     typeof phone!=='string'||!/^[+0-9 ()-]{7,20}$/.test(phone))
   return sendJson(res,400,{error:'Enter valid customer details.'});
  const token=randomUUID();
  const results=await db('supplier_orders',{method:'POST',body:{
   token,sku,product_name:item.label,quantity,listed_price_ngn:item.price,
   customer_name:name.trim(),customer_email:email.trim().toLowerCase(),customer_phone:phone.trim(),status:'requested'
  }});
  if(!results?.[0]?.id)throw Error('Order could not be saved');
  return sendJson(res,201,{token,status:'requested',message:'Request received. We will confirm your phone and send a secure payment link.'});
 }catch(e){console.error('Supplier request failed',e.message);return sendJson(res,503,{error:'Unable to save your request. Please try again.'});}
}
