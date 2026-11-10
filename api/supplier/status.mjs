import {db,sendJson} from '../_checkout.mjs';
export default async function handler(req,res){
 if(req.method!=='GET')return sendJson(res,405,{error:'Method not allowed'});
 const token=String(req.query?.token||'');
 if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(token))return sendJson(res,400,{error:'Invalid order token'});
 try{
  const rows=await db('supplier_orders?select=status,product_name,quantity,confirmed_price_ngn,quote_expires_at&token=eq.'+encodeURIComponent(token)+'&limit=1');
  if(!rows?.length)return sendJson(res,404,{error:'Request not found'});
  const order=rows[0]; const valid=order.status==='approved'&&new Date(order.quote_expires_at)>new Date();
  return sendJson(res,200,{...order,payable:valid,confirmed_price_ngn:valid?order.confirmed_price_ngn:null});
 }catch(e){console.error(e.message);return sendJson(res,503,{error:'Order status unavailable'});}
}
