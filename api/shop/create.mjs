import {db,paystack,reply,sameOrigin,env} from '../_shop.mjs';
import {validateCheckout} from '../../commerce/checkout-validation.mjs';
import {creditDirectConfig,createCreditDirectTransaction,signCreditDirectTransaction,linkToken,validLinkToken} from '../../commerce/credit-direct.mjs';
const FINANCING_OFF='Pay Small Small is not available right now. You can pay outright with Paystack.';
const REFERENCE=/^MGP2-[a-f0-9]{32}$/;
// Browser reports the provider's checkoutTransactionId; it is accepted only with the token issued for that order.
async function linkCreditDirect(req,res,config){
 const {reference,token,checkoutTransactionId}=req.body||{};
 if(typeof reference!=='string'||!REFERENCE.test(reference)||!validLinkToken(reference,token,config.privateKey)||typeof checkoutTransactionId!=='string'||!/^[\w.:-]{3,200}$/.test(checkoutTransactionId))return reply(res,400,{error:'Invalid checkout session.'});
 try{await db('rpc/shop_credit_direct_link',{method:'POST',body:{p_reference:reference,p_transaction_id:checkoutTransactionId}});return reply(res,200,{linked:true});}
 catch{return reply(res,409,{error:'This checkout session could not be linked.'});}
}
export default async function handler(req,res){
 if(req.method!=='POST')return reply(res,405,{error:'Method not allowed'});
 try{
  if(!sameOrigin(req))return reply(res,403,{error:'Please submit from the checkout page.'});
  const financed=req.body?.paymentMethod==='credit_direct'||req.body?.action==='credit_direct_link',config=creditDirectConfig();
  if(financed&&!config.ready)return reply(res,503,{error:FINANCING_OFF});
  if(req.body?.action==='credit_direct_link')return linkCreditDirect(req,res,config);
  let order;try{order=validateCheckout(req.body);}catch(e){return reply(res,400,{error:e.message});}
  const result=await db('rpc/shop_create_order_deals',{method:'POST',body:{p_request_id:order.requestId,p_items:order.items,p_customer:order.customer,p_policy:order.policyVersion}});
  if(result.status==='paid')return reply(res,200,{url:new URL('/checkout/complete/?reference='+encodeURIComponent(result.reference),env('SHOP_ORIGIN')).href});
  if(!Number.isSafeInteger(req.body.expectedTotalNgn)||req.body.expectedTotalNgn!==Number(result.amount_ngn))return reply(res,409,{error:'The current price has changed. Refresh checkout and review the updated total before paying.'});
  if(financed){
   // Prices, products and total come from the order the database just priced, never from the browser.
   let session;try{session=await db('rpc/shop_credit_direct_begin',{method:'POST',body:{p_reference:result.reference}});}catch{return reply(res,409,{error:'This order cannot use Pay Small Small. Refresh checkout and try again, or pay outright.'});}
   const transaction=createCreditDirectTransaction({sessionId:session.sessionId,customerEmail:session.email,customerPhone:session.phone,products:session.products,metaData:{orderReference:result.reference}});
   if(transaction.totalAmount!==Number(result.amount_ngn))throw Error('Order total mismatch.');
   return reply(res,200,{provider:'credit_direct',reference:result.reference,publicKey:config.publicKey,isLive:config.isLive,transaction,signature:signCreditDirectTransaction(transaction,config.privateKey),linkToken:linkToken(result.reference,config.privateKey)});
  }
  if(result.authorization_url)return reply(res,200,{url:result.authorization_url});
  if(config.ready){const row=(await db('shop_orders?reference=eq.'+encodeURIComponent(result.reference)+'&select=payment_provider'))[0];if(row?.payment_provider==='credit_direct')return reply(res,409,{error:'This order was started with Pay Small Small. Refresh checkout to pay outright instead.'});}
  const callback=new URL('/checkout/complete/',env('SHOP_ORIGIN')).href;
  const tx=await paystack('/transaction/initialize',{email:order.customer.email,amount:result.amount_ngn*100,currency:'NGN',reference:result.reference,callback_url:callback,metadata:{order_reference:result.reference}});
  const url=new URL(tx.authorization_url);if(url.protocol!=='https:'||url.hostname!=='checkout.paystack.com')throw Error('Invalid payment destination.');
  await db('shop_orders?reference=eq.'+encodeURIComponent(result.reference),{method:'PATCH',body:{authorization_url:url.href}});
  return reply(res,200,{url:url.href});
 }catch(e){return reply(res,503,{error:e.message});}
}
