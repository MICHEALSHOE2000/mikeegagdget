import {timingSafeEqual} from 'node:crypto';
import {db,sendJson} from '../_checkout.mjs';
export function authorized(req){const key=process.env.MERCHANT_ADMIN_TOKEN,provided=String(req.headers.authorization||'').replace(/^Bearer /,'');return key&&key.length>=32&&Buffer.byteLength(key)===Buffer.byteLength(provided)&&timingSafeEqual(Buffer.from(key),Buffer.from(provided));}
export function validFinanceUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(u.hostname==='creditdirect.ng'||u.hostname.endsWith('.creditdirect.ng')||u.hostname==='creditdirectafrica.com'||u.hostname.endsWith('.creditdirectafrica.com'));}catch{return false;}}
export default async function handler(req,res){
 if(req.method!=='POST')return sendJson(res,405,{error:'Method not allowed'});
 if(!authorized(req))return sendJson(res,401,{error:'Merchant authentication required'});
 const b=req.body||{};if(!/^[0-9a-f-]{36}$/i.test(b.order_id||''))return sendJson(res,400,{error:'Invalid order'});
 try{const rows=await db('supplier_orders?id=eq.'+b.order_id+'&limit=1');const o=rows?.[0];if(!o)return sendJson(res,404,{error:'Order not found'});let patch;
 if(b.action==='confirm'){
 if(o.method!=='buy'||!['requested','approved'].includes(o.status)||!Number.isSafeInteger(b.price_ngn)||b.price_ngn<=0||!Number.isSafeInteger(b.delivery_fee_ngn)||b.delivery_fee_ngn<0||typeof b.warranty_terms!=='string'||!b.warranty_terms.trim()||typeof b.return_terms!=='string'||!b.return_terms.trim()||b.supplier_confirmed!==true)return sendJson(res,400,{error:'Confirm supplier availability, price, delivery fee and written warranty/return terms.'});
 const expires=Date.parse(b.expires_at);if(!Number.isFinite(expires)||expires<=Date.now()||expires>Date.now()+7*86400000)return sendJson(res,400,{error:'Quote expiry must be within seven days.'});
 patch={status:'approved',confirmed_price_ngn:b.price_ngn,delivery_fee_ngn:b.delivery_fee_ngn,supplier_verified_at:new Date().toISOString(),quote_expires_at:new Date(expires).toISOString(),warranty_terms:b.warranty_terms.slice(0,4000),return_terms:b.return_terms.slice(0,4000)};
 }else if(b.action==='finance_link'){
 if(o.method!=='finance'||o.status!=='requested'||!validFinanceUrl(b.url))return sendJson(res,400,{error:'Use a verified HTTPS Credit Direct link for a financing request.'});patch={finance_status:'link_ready',finance_url:b.url};
 }else{
 const transitions={paid:['preparing','cancelled'],preparing:['ready_for_pickup','dispatched','cancelled'],ready_for_pickup:['delivered','cancelled'],dispatched:['delivered'],requested:['declined','cancelled'],approved:['cancelled'],cancelled:['refunded'],manual_review:['refunded']};
 if(!transitions[o.status]?.includes(b.status))return sendJson(res,400,{error:'Invalid order transition'});
 if(b.status==='refunded'&&b.refund_verified!==true)return sendJson(res,400,{error:'Verify the actual refund before recording it.'});patch={status:b.status};
 }
 const updated=await db('supplier_orders?id=eq.'+o.id+'&status=eq.'+o.status,{method:'PATCH',body:patch});if(!updated.length)return sendJson(res,409,{error:'Order changed. Reload before updating.'});return sendJson(res,200,{ok:true});
 }catch(e){console.error(e.message);return sendJson(res,503,{error:'Update failed'});}
}
