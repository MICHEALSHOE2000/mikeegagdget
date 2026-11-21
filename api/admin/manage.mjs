import {notifyOrder} from '../../commerce/notifications.mjs';
import {validateProductEdit} from '../../commerce/admin-catalogue.mjs';
import {db,reply,sameOrigin} from '../_shop.mjs';
import {requireAdmin} from './_auth.mjs';
import {buildItems,feedStats,SITE,FEED_PATH} from '../../commerce/merchant.mjs';
import pages from '../../commerce/merchant-products.mjs';
export default async function handler(req,res){
 if(!['GET','PATCH'].includes(req.method))return reply(res,405,{error:'Method not allowed'});
 let user;try{user=await requireAdmin(req);}catch(e){return reply(res,401,{error:e.message});}
 try{
  if(req.method==='GET'){
   const kind=req.query?.kind;
   if(kind==='inventory')return reply(res,200,await db('checkout_inventory?select=sku,price_ngn,enabled,product_data,updated_at&order=sku&limit=1000'));
   if(kind==='orders')return reply(res,200,await db('shop_orders?select=reference,amount_ngn,delivery_fee_ngn,delivery_method,status,payment_provider,fulfillment_status,supplier_status,created_at,customer,shop_order_items(sku,quantity,unit_price_ngn,selected_color)&payment_provider=neq.pay_at_store&order=created_at.desc&limit=100'));
   if(kind==='reservations'){
    // Expire overdue reservations first (also runs every 15 minutes in the database), then email those customers once.
    try{await db('rpc/shop_expire_reservations',{method:'POST',body:{}});}catch{}
    const rows=await db('shop_orders?select=reference,reservation_ref,reservation_status,status,amount_ngn,pickup_date,hold_until,created_at,reservation_confirmed_at,reservation_ready_at,reservation_closed_at,customer,shop_order_items(sku,quantity,unit_price_ngn,selected_color,product_snapshot)&reservation_status=not.is.null&order=created_at.desc&limit=200');
    const recent=Date.now()-7*864e5;
    for(const r of rows.filter(r=>r.reservation_status==='expired'&&new Date(r.reservation_closed_at||0).getTime()>recent))await notifyOrder(db,r.reference,['reservation_expired']);
    return reply(res,200,rows);
   }
   if(kind==='merchant'){
    // Google Shopping report: the same rules as the public feed, applied to the live catalogue now.
    const [rows,rates,status]=await Promise.all([db('rpc/shop_deal_catalogue',{method:'POST',body:{}}),db('shop_delivery_rates?select=fee_ngn,enabled'),db('shop_merchant_feed_status?id=eq.google&select=generated_at,stats').catch(()=>[])]);
    const result=buildItems(rows,{pages,rates});
    const warn={};for(const w of result.warnings)warn[w.warning]=(warn[w.warning]||0)+1;
    return reply(res,200,{feedUrl:SITE+FEED_PATH,stats:feedStats(result,rows),lastGenerated:status[0]?.generated_at||null,
     excluded:result.excluded.map(({id,sku,slug,title,reasons})=>({id,sku,slug,title,reasons})),warnings:Object.entries(warn).map(([warning,count])=>({warning,count}))});
   }
   return reply(res,400,{error:'Choose inventory, orders, reservations or merchant.'});
  }
  if(!sameOrigin(req))return reply(res,403,{error:'Use the administrator page.'});
  const {sku,price,enabled,updatedAt,productData}=req.body||{};
  if(typeof sku!=='string'||!sku||sku.length>250||(price!==null&&(!Number.isSafeInteger(price)||price<=0||price>100000000))||typeof enabled!=='boolean'||(enabled&&price===null)||typeof updatedAt!=='string')return reply(res,400,{error:'Enter a valid price and availability.'});
  if(enabled){const check=await db('checkout_inventory?sku=eq.'+encodeURIComponent(sku)+'&select=product_data');if(check[0]?.product_data?.reviewRequired)return reply(res,400,{error:'This legacy variant needs catalogue verification before it can be enabled.'});}
  if(productData){
   const rows=await db('checkout_inventory?sku=eq.'+encodeURIComponent(sku)+'&select=product_data');
   let data;try{data=validateProductEdit(rows[0]?.product_data||{},productData);}catch(e){return reply(res,400,{error:e.message});}
   const saved=await db('rpc/shop_admin_update_product',{method:'POST',body:{p_actor:user.id,p_sku:sku,p_price:price,p_enabled:enabled,p_updated_at:updatedAt,p_data:data}});
   return reply(res,200,saved);
  }
  const result=await db('rpc/shop_admin_update_price',{method:'POST',body:{p_actor:user.id,p_sku:sku,p_price:price,p_enabled:enabled,p_updated_at:updatedAt}});
  return reply(res,200,result);
 }catch{return reply(res,409,{error:'Could not save this change. Reload the inventory and try again.'});}
}
