import {db,confirmPayment,sendJson} from '../_checkout.mjs';
export default async function handler(req,res){
 if(req.method!=='GET')return sendJson(res,405,{error:'Method not allowed'});
 const reference=String(req.query?.reference||'');
 if(!/^MGP-[a-f0-9]{32}$/.test(reference))return sendJson(res,400,{error:'Invalid reference'});
 try{
 await confirmPayment(reference);
 const orders=await db('checkout_orders?select=status,product_name,quantity,amount_ngn&payment_reference=eq.'+encodeURIComponent(reference)+'&limit=1');
 if(!orders.length)return sendJson(res,404,{error:'Order not found'});
 return sendJson(res,200,{status:orders[0].status,product:orders[0].product_name,quantity:orders[0].quantity,amount_ngn:orders[0].amount_ngn});
 }catch(error){console.error('Status lookup error',error.message);return sendJson(res,503,{error:'Payment status unavailable; please check again.'});}
}
