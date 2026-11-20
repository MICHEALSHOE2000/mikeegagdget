export const env=key=>{const value=process.env[key]||(key==='SHOP_ORIGIN'?process.env.SITE_URL:undefined);if(!value)throw Error('Checkout configuration is incomplete.');return value;};
export async function db(path,{method='GET',body,prefer}={}){
 const r=await fetch(env('SUPABASE_URL')+'/rest/v1/'+path,{method,headers:{apikey:env('SUPABASE_SERVICE_ROLE_KEY'),Authorization:'Bearer '+env('SUPABASE_SERVICE_ROLE_KEY'),'Content-Type':'application/json',Prefer:'return=representation'+(prefer?','+prefer:'')},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('Unable to save or retrieve this order. Please try again.');if(r.status===204)return null;return r.json();
}
export const reply=(res,status,data)=>res.status(status).setHeader('Cache-Control','no-store').json(data);
// Requests must come from the shop's own site. Preview deployments also accept their own Vercel address,
// so checkout and admin can be tested there; production accepts only the configured shop origin.
export function allowedOrigins(){const list=[new URL(env('SHOP_ORIGIN')).origin];if(process.env.VERCEL_ENV==='preview')for(const host of [process.env.VERCEL_URL,process.env.VERCEL_BRANCH_URL])if(host)list.push('https://'+host);return list;}
export function sameOrigin(req){const origin=req.headers.origin;return !!origin&&allowedOrigins().includes(origin);}
export async function paystack(path,body){
 const key=env('PAYSTACK_SECRET_KEY');
 if(process.env.SHOP_LIVE_PAYMENTS!=='true'&&!key.startsWith('sk_test_'))throw Error('Test payment configuration is required.');
 const r=await fetch('https://api.paystack.co'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
 const data=await r.json();if(!r.ok||!data.status)throw Error('The payment provider could not complete this request. Please try again.');return data.data;
}
import {creditDirectConfig} from '../commerce/credit-direct.mjs';
// Payment check used by the confirmation page, the Paystack webhook and Admin. When an order is paid,
// the customer and the store are emailed once.
export async function verify(reference){
 const result=await verifyPayment(reference);
 if(result.status==='paid'){try{const {notifyOrder}=await import('../commerce/notifications.mjs');await notifyOrder(db,reference,['payment_received','admin_paid_order']);}catch{}}
 return result;
}
async function verifyPayment(reference){
 // If the order cannot be read, fall back to asking Paystack (the previous behaviour) rather than failing outright.
 let order=null;try{order=(await db('shop_orders?reference=eq.'+encodeURIComponent(reference)+'&select=status,payment_provider,amount_ngn,reservation_ref,reservation_status,pickup_date,hold_until'))?.[0]||null;}catch{order=null;}
 // Store reservations: nothing to verify online; the customer pays at the store and staff record it.
 if(order?.payment_provider==='pay_at_store')return {status:order.status==='paid'?'paid':'reserved',paymentMethod:'pay_at_store',reservationRef:order.reservation_ref,reservationStatus:order.reservation_status,amountDueNgn:Number(order.amount_ngn),pickupDate:order.pickup_date,holdUntil:order.hold_until};
 // Bank transfers are confirmed by the administrator once the money reflects; there is nothing to ask a provider.
 if(order?.payment_provider==='bank_transfer')return {status:order.status==='paid'?'paid':'pending_payment',paymentMethod:'bank_transfer',...(order.status==='paid'?{}:{amountNgn:Number(order.amount_ngn)})};
 // Credit Direct orders are confirmed only by the provider's signed merchant-payment webhook.
 if(creditDirectConfig().ready){if(order?.payment_provider==='credit_direct'){if(order.status!=='awaiting_payment')return {status:order.status};const session=(await db('shop_credit_direct_sessions?order_reference=eq.'+encodeURIComponent(reference)+'&customer_paid_at=not.is.null&select=customer_paid_at&limit=1'))[0];return {status:session?.customer_paid_at?'awaiting_merchant_payment':'financing_pending'};}}
 const tx=await paystack('/transaction/verify/'+encodeURIComponent(reference));
 if(tx.reference!==reference||tx.currency!=='NGN')throw Error('Payment details do not match.');
 if(tx.status!=='success')return {status:tx.status==='failed'?'failed':tx.status==='abandoned'?'cancelled':'pending'};
 const status=await db('rpc/shop_confirm_payment',{method:'POST',body:{p_reference:reference,p_kobo:tx.amount,p_transaction_id:String(tx.id)}});return {status};
}
