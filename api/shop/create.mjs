import {db,paystack,reply,sameOrigin,env} from '../_shop.mjs';
import {validateCheckout} from '../../commerce/checkout-validation.mjs';
import {skuFilter} from '../../commerce/home-render.mjs';
import {stockProblem} from '../../commerce/stock.mjs';
import {notifyOrder} from '../../commerce/notifications.mjs';
import {creditDirectConfig,createCreditDirectTransaction,signCreditDirectTransaction,linkToken,validLinkToken,newSessionId} from '../../commerce/credit-direct.mjs';
const FINANCING_OFF='Pay Small Small is not available right now. You can pay outright with Paystack.';
const REFERENCE=/^MGP2-[a-f0-9]{32}$/;
// Browser reports the provider's checkoutTransactionId; it is accepted only with the token issued for that order.
async function linkCreditDirect(req,res,config){
 const {reference,sessionId,token,checkoutTransactionId}=req.body||{};
 if(typeof reference!=='string'||!REFERENCE.test(reference)||typeof sessionId!=='string'||!/^[A-Za-z0-9]{15,64}$/.test(sessionId)||!validLinkToken(reference,token,config.privateKey,sessionId)||typeof checkoutTransactionId!=='string'||!/^[\w.:-]{3,200}$/.test(checkoutTransactionId))return reply(res,400,{error:'Invalid checkout session.'});
 try{await db('rpc/shop_credit_direct_link',{method:'POST',body:{p_reference:reference,p_session_id:sessionId,p_transaction_id:checkoutTransactionId}});return reply(res,200,{linked:true});}
 catch{return reply(res,409,{error:'This checkout session could not be linked.'});}
}
// Checkout problems are written to the Vercel function logs (Logs tab) with a short reason and the SKUs involved;
// customer names, phone numbers, emails and addresses are never logged.
const skusOf=b=>Array.isArray(b?.items)?b.items.slice(0,10).map(i=>String(i?.sku||'').slice(0,80)).join(', '):'';
function logCheckout(stage,req,detail){try{console.error('[checkout-error]',JSON.stringify({stage,payment:String(req.body?.paymentMethod||'').slice(0,20),skus:skusOf(req.body),detail:String(detail||'').slice(0,300)}));}catch{}}
// Browser-side problems (Buy Now / Pay Small Small taps that could not continue) reported by assets/client-log.mjs.
function clientLog(req,res){
 if(sameOrigin(req)){const e=req.body?.entry&&typeof req.body.entry==='object'?req.body.entry:{};const safe=Object.fromEntries(Object.entries(e).slice(0,10).map(([k,v])=>[String(k).slice(0,30),String(v).replace(/[^\w\s.,:;|·()+\-/@#'"]/g,'').slice(0,160)]).filter(([k])=>!/name|phone|email|address/i.test(k)));console.warn('[checkout-client]',JSON.stringify(safe));}
 res.status(204);return res.send?res.send(''):res.end();
}
export default async function handler(req,res){
 if(req.method!=='POST')return reply(res,405,{error:'Method not allowed'});
 try{
  if(typeof req.body==='string'){try{req.body=JSON.parse(req.body);}catch{req.body={};}}
  if(req.body?.action==='client_log')return clientLog(req,res);
  if(!sameOrigin(req)){logCheckout('origin',req,req.headers.origin||'no origin');return reply(res,403,{error:'Please submit from the checkout page.'});}
  const financed=req.body?.paymentMethod==='credit_direct'||req.body?.action==='credit_direct_link',config=creditDirectConfig();
  if(financed&&!config.ready){logCheckout('credit_direct_off',req,'Credit Direct is not configured');return reply(res,503,{error:FINANCING_OFF});}
  if(req.body?.action==='credit_direct_link')return linkCreditDirect(req,res,config);
  let order;try{order=validateCheckout(req.body);}catch(e){logCheckout('validation',req,e.message);return reply(res,400,{error:e.message});}
  // Stock is re-checked on the server from the catalogue record; the browser's view is never trusted.
  {const rows=await db('checkout_inventory?select=sku,product_data&sku='+encodeURIComponent(skuFilter(order.items.map(i=>i.sku))));const problem=stockProblem(order.items,rows);if(problem){logCheckout('stock',req,problem);return reply(res,409,{error:problem});}}
  // Prices, Hot Deal discounts and the delivery fee are all worked out by the database from its own tables.
  let result;try{result=await db('rpc/shop_create_order_v3',{method:'POST',body:{p_request_id:order.requestId,p_items:order.items,p_customer:order.customer,p_policy:order.policyVersion}});}
  catch(e){logCheckout('create_order',req,e.message);return reply(res,409,{error:order.deliveryMethod==='store_pickup'?'Your order could not be saved. Refresh checkout and try again.':'Delivery to the selected area is not available right now. Choose another option or store pickup.'});}
  const complete='/checkout/complete/?reference='+encodeURIComponent(result.reference);
  if(result.status==='paid')return reply(res,200,{url:new URL(complete,env('SHOP_ORIGIN')).href});
  // Reserve Now, Pay at Pickup: nothing is charged. The emails go once, even if the button is pressed again.
  if(result.status==='unpaid'&&result.reservation_ref){
   if(order.paymentMethod!=='pay_at_pickup')return reply(res,409,{error:'This order was saved as a store reservation. Refresh checkout to pay online instead.'});
   const emails=await notifyOrder(db,result.reference,['reservation_received','admin_new_reservation']);
   return reply(res,200,{provider:'reservation',reference:result.reference,reservationRef:result.reservation_ref,url:complete,emailed:emails.reservation_received==='accepted'});
  }
  // A repeated "Place Order" for a bank-transfer order goes back to its account details.
  if(result.status==='pending_payment')return order.paymentMethod==='bank_transfer'?reply(res,200,{provider:'bank_transfer',reference:result.reference,url:complete}):reply(res,409,{error:'This order was placed for bank transfer. Refresh checkout to choose another payment method.'});
  if(!Number.isSafeInteger(req.body.expectedTotalNgn)||req.body.expectedTotalNgn!==Number(result.amount_ngn)){logCheckout('price_changed',req,`browser ${req.body.expectedTotalNgn} vs ${result.amount_ngn}`);return reply(res,409,{error:'The current price has changed. Refresh checkout and review the updated total before paying.'});}
  if(order.paymentMethod==='bank_transfer'){
   // Saved as pending_payment; nothing ships until the transfer is confirmed in Admin.
   try{await db('rpc/shop_bank_transfer_begin',{method:'POST',body:{p_reference:result.reference}});}catch(e){logCheckout('bank_transfer',req,e.message);return reply(res,409,{error:'This order cannot be switched to bank transfer. Refresh checkout and try again.'});}
   return reply(res,200,{provider:'bank_transfer',reference:result.reference,url:complete});
  }
  if(financed){
   // Prices, products and total come from the order the database just priced, never from the browser.
   let session;try{session=await db('rpc/shop_credit_direct_begin',{method:'POST',body:{p_reference:result.reference,p_session_id:newSessionId()}});}catch(e){logCheckout('credit_direct',req,e.message);return reply(res,409,{error:'This order cannot use Pay Small Small. Refresh checkout and try again, or pay outright.'});}
   const transaction=createCreditDirectTransaction({sessionId:session.sessionId,customerEmail:session.email,customerPhone:session.phone,products:session.products,metaData:result.reference});
   if(transaction.totalAmount!==Number(result.amount_ngn))throw Error('Order total mismatch.');
   return reply(res,200,{provider:'credit_direct',reference:result.reference,publicKey:config.publicKey,isLive:config.isLive,transaction,signature:signCreditDirectTransaction(transaction,config.privateKey),linkToken:linkToken(result.reference,config.privateKey,transaction.sessionId)});
  }
  if(result.authorization_url)return reply(res,200,{url:result.authorization_url});
  if(config.ready){const row=(await db('shop_orders?reference=eq.'+encodeURIComponent(result.reference)+'&select=payment_provider'))[0];if(row?.payment_provider==='credit_direct')return reply(res,409,{error:'This order was started with Pay Small Small. Refresh checkout to pay outright instead.'});}
  const callback=new URL('/checkout/complete/',env('SHOP_ORIGIN')).href;
  const tx=await paystack('/transaction/initialize',{email:order.customer.email,amount:result.amount_ngn*100,currency:'NGN',reference:result.reference,callback_url:callback,metadata:{order_reference:result.reference}});
  const url=new URL(tx.authorization_url);if(url.protocol!=='https:'||url.hostname!=='checkout.paystack.com')throw Error('Invalid payment destination.');
  await db('shop_orders?reference=eq.'+encodeURIComponent(result.reference),{method:'PATCH',body:{authorization_url:url.href}});
  return reply(res,200,{url:url.href});
 }catch(e){logCheckout('unexpected',req,e.message);return reply(res,503,{error:e.message});}
}
