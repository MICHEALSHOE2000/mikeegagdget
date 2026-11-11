import {db,reply,sameOrigin} from '../_shop.mjs';
import {requireAdmin} from './_auth.mjs';
export default async function handler(req,res){
 if(!['GET','PATCH'].includes(req.method))return reply(res,405,{error:'Method not allowed'});
 let user;try{user=await requireAdmin(req);}catch(e){return reply(res,401,{error:e.message});}
 try{
  if(req.method==='GET'){
   const kind=req.query?.kind;
   if(kind==='inventory')return reply(res,200,await db('checkout_inventory?select=sku,price_ngn,enabled,product_data,updated_at&order=sku&limit=1000'));
   if(kind==='orders')return reply(res,200,await db('shop_orders?select=reference,amount_ngn,status,created_at,customer,shop_order_items(sku,quantity,unit_price_ngn,selected_color)&order=created_at.desc&limit=100'));
   return reply(res,400,{error:'Choose inventory or orders.'});
  }
  if(!sameOrigin(req))return reply(res,403,{error:'Use the administrator page.'});
  const {sku,price,enabled,updatedAt}=req.body||{};
  if(typeof sku!=='string'||!sku||sku.length>250||(price!==null&&(!Number.isSafeInteger(price)||price<=0||price>100000000))||typeof enabled!=='boolean'||(enabled&&price===null)||typeof updatedAt!=='string')return reply(res,400,{error:'Enter a valid price and availability.'});
  const result=await db('rpc/shop_admin_update_price',{method:'POST',body:{p_actor:user.id,p_sku:sku,p_price:price,p_enabled:enabled,p_updated_at:updatedAt}});
  return reply(res,200,result);
 }catch{return reply(res,409,{error:'Could not save this change. Reload the inventory and try again.'});}
}
