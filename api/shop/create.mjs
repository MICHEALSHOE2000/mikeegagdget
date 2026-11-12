import {db,paystack,reply,sameOrigin,env} from '../_shop.mjs';
import {validateCheckout} from '../../commerce/checkout-validation.mjs';
export default async function handler(req,res){
 if(req.method!=='POST')return reply(res,405,{error:'Method not allowed'});
 try{
  if(!sameOrigin(req))return reply(res,403,{error:'Please submit from the checkout page.'});
  let order;try{order=validateCheckout(req.body);}catch(e){return reply(res,400,{error:e.message});}
  const result=await db('rpc/shop_create_order_deals',{method:'POST',body:{p_request_id:order.requestId,p_items:order.items,p_customer:order.customer,p_policy:order.policyVersion}});
  if(result.status==='paid')return reply(res,200,{url:new URL('/checkout/complete/?reference='+encodeURIComponent(result.reference),env('SHOP_ORIGIN')).href});
  if(!Number.isSafeInteger(req.body.expectedTotalNgn)||req.body.expectedTotalNgn!==Number(result.amount_ngn))return reply(res,409,{error:'The current price has changed. Refresh checkout and review the updated total before paying.'});
  if(result.authorization_url)return reply(res,200,{url:result.authorization_url});
  const callback=new URL('/checkout/complete/',env('SHOP_ORIGIN')).href;
  const tx=await paystack('/transaction/initialize',{email:order.customer.email,amount:result.amount_ngn*100,currency:'NGN',reference:result.reference,callback_url:callback,metadata:{order_reference:result.reference}});
  const url=new URL(tx.authorization_url);if(url.protocol!=='https:'||url.hostname!=='checkout.paystack.com')throw Error('Invalid payment destination.');
  await db('shop_orders?reference=eq.'+encodeURIComponent(result.reference),{method:'PATCH',body:{authorization_url:url.href}});
  return reply(res,200,{url:url.href});
 }catch(e){return reply(res,503,{error:e.message});}
}
