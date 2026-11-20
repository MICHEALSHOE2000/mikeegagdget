import {db,reply,verify} from '../_shop.mjs';
import {orderSummary} from '../../commerce/order-summary.mjs';
export default async function handler(req,res){
 if(req.method!=='GET')return reply(res,405,{error:'Method not allowed'});
 const reference=String(req.query?.reference||'');
 if(!/^MGP2-[a-f0-9]{32}$/.test(reference))return reply(res,400,{error:'Invalid order reference.'});
 try{
  const result=await verify(reference);
  // The summary is shown only once payment is verified, so an unpaid or failed order reveals nothing more.
  let summary=null;
  if(result.status==='paid'){try{summary=orderSummary((await db('shop_orders?reference=eq.'+encodeURIComponent(reference)+'&select=amount_ngn,delivery_fee_ngn,delivery_method,created_at,fulfillment_status,customer,shop_order_items(sku,quantity,unit_price_ngn,selected_color,product_snapshot)'))[0]);}catch{summary=null;}}
  return reply(res,200,{reference,...result,...(summary?{summary}:{})});
 }catch(e){return reply(res,503,{error:e.message});}
}
