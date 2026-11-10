import {db,sendJson} from '../_checkout.mjs';
export default async function handler(req,res){
 if(req.method!=='GET')return sendJson(res,405,{error:'Method not allowed'});
 const token=String(req.query?.token||'');
 if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(token))return sendJson(res,400,{error:'Enter the private order reference from your confirmation.'});
 try{const rows=await db('supplier_orders?select=id,sku,status,product_name,quantity,listed_price_ngn,confirmed_price_ngn,quote_expires_at,delivery_fee_ngn,fulfillment,method,finance_status,finance_url,warranty_terms,return_terms,paystack_reference,authorization_url&token=eq.'+token+'&limit=1');
 if(!rows?.length)return sendJson(res,404,{error:'Order not found'});const o=rows[0];
 const history=await db('order_status_history?select=status,created_at&order_id=eq.'+o.id+'&order=created_at.asc');
 return sendJson(res,200,{...o,history,payable:o.method==='buy'&&['approved','awaiting_payment'].includes(o.status)&&Date.parse(o.quote_expires_at)>Date.now(),total_ngn:o.confirmed_price_ngn&&o.delivery_fee_ngn!==null?o.confirmed_price_ngn*o.quantity+o.delivery_fee_ngn:null});
 }catch(e){console.error(e.message);return sendJson(res,503,{error:'Order status unavailable. Try again shortly.'});}
}
