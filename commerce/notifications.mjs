// Email wording for orders and reservations. Plain, friendly and factual: nothing here promises stock that an
// administrator has not confirmed.
import {notifyOnce,ADMIN_NOTIFY} from './email.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const naira=n=>'₦'+Number(n||0).toLocaleString('en-NG');
const STORE='1 Ola Ayeni Street, Off Simbiat Abiola Way, Computer Village, Ikeja, Lagos';
const WA='https://wa.me/2347086865133';
export const shortOrderNo=ref=>String(ref||'').slice(5,13).toUpperCase();
const when=d=>{try{return new Date(d).toLocaleString('en-NG',{timeZone:'Africa/Lagos',weekday:'long',day:'numeric',month:'long',hour:'numeric',minute:'2-digit'});}catch{return '';}};
const day=d=>{try{return new Date(d+'T12:00:00+01:00').toLocaleDateString('en-NG',{timeZone:'Africa/Lagos',weekday:'long',day:'numeric',month:'long'});}catch{return String(d||'');}};
const itemLines=o=>(o.shop_order_items||[]).map(i=>{const p=i.product_snapshot||{};return {name:[p.model||i.sku,p.capacity||p.storage,i.selected_color,p.condition].filter(Boolean).join(' · '),qty:i.quantity,total:i.unit_price_ngn*i.quantity};});
function layout(title,intro,o,rows,extra=''){
 const items=itemLines(o);
 const html=`<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#17251f"><div style="background:#0a3d2c;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0"><strong style="font-size:18px">Mikee Gadget Plug</strong></div><div style="border:1px solid #e3e7e4;border-top:0;padding:22px;border-radius:0 0 12px 12px"><h1 style="font-size:20px;margin:0 0 10px">${esc(title)}</h1><p style="margin:0 0 16px;line-height:1.55">${intro}</p>`
  +`<table style="width:100%;border-collapse:collapse;font-size:14px">${rows.map(([k,v])=>`<tr><td style="padding:6px 0;color:#5d6661">${esc(k)}</td><td style="padding:6px 0;text-align:right;font-weight:bold">${esc(v)}</td></tr>`).join('')}</table>`
  +`<h2 style="font-size:15px;margin:18px 0 6px">Items</h2><table style="width:100%;border-collapse:collapse;font-size:14px">${items.map(i=>`<tr><td style="padding:5px 0">${esc(i.name)} × ${i.qty}</td><td style="padding:5px 0;text-align:right">${naira(i.total)}</td></tr>`).join('')}</table>`
  +`${extra}<p style="margin:20px 0 0;font-size:13px;color:#5d6661">Questions? Reply to this email, call 0708 686 5133 or <a href="${WA}">chat on WhatsApp</a>.<br>${esc(STORE)}</p></div></div>`;
 const text=[title,'',intro.replace(/<[^>]+>/g,''),'',...rows.map(([k,v])=>`${k}: ${v}`),'','Items:',...items.map(i=>`- ${i.name} × ${i.qty}: ${naira(i.total)}`),'',`Questions? Call 0708 686 5133 or WhatsApp ${WA}`,STORE].join('\n');
 return {html,text};
}
const name=o=>o.customer?.firstName||'there';
// Build the email for an event. Returns {to,message} or null when the event has no email.
export function buildEmail(kind,o){
 const c=o.customer||{},rsv=o.reservation_ref,due=naira(o.amount_ngn),pick=o.pickup_date?day(o.pickup_date):'';
 const R=(subject,title,intro,rows,extra)=>({to:c.email,message:{subject,...layout(title,intro,o,rows,extra)}});
 switch(kind){
  case 'reservation_received':return R(`Reservation request received — ${rsv}`,'Reservation Request Received!',`Hi ${esc(name(o))}, thank you. We have received your reservation request. <strong>This is not yet a guarantee that the item is being held</strong> — we will check availability and confirm with you shortly.`,[['Reservation reference',rsv],['Preferred pickup date',pick],['Amount payable online','₦0'],['Amount due at pickup',due],['Pickup location','Mikee Gadget Store, Computer Village, Ikeja']]);
  case 'reservation_confirmed':return R(`Reservation confirmed — ${rsv}`,'Your reservation is confirmed',`Hi ${esc(name(o))}, good news: your item is available and we are holding it for you until <strong>${esc(when(o.hold_until))}</strong>. Please come before then and pay at the store.`,[['Reservation reference',rsv],['Pickup deadline',when(o.hold_until)],['Amount due at pickup',due],['Pickup location',STORE]]);
  case 'ready_for_pickup':return rsv?R(`Ready for pickup — ${rsv}`,'Your item is ready for pickup',`Hi ${esc(name(o))}, your item is ready. Please bring your reservation reference and pay at the store before <strong>${esc(when(o.hold_until))}</strong>.`,[['Reservation reference',rsv],['Pickup deadline',when(o.hold_until)],['Amount due at pickup',due],['Pickup location',STORE]])
   :R(`Ready for pickup — order ${shortOrderNo(o.reference)}`,'Your order is ready for pickup',`Hi ${esc(name(o))}, your paid order is ready. Please bring your order number when you visit.`,[['Order number',shortOrderNo(o.reference)],['Pickup location',STORE]]);
  case 'reservation_cancelled':return R(`Reservation cancelled — ${rsv}`,'Your reservation has been cancelled',`Hi ${esc(name(o))}, your reservation has been cancelled. Nothing was charged. If you still want the item, please contact us or place a new order.`,[['Reservation reference',rsv]]);
  case 'reservation_expired':return R(`Reservation expired — ${rsv}`,'Your reservation has expired',`Hi ${esc(name(o))}, the pickup deadline for your reservation has passed, so the item is no longer being held. Nothing was charged. Contact us if you would still like it.`,[['Reservation reference',rsv]]);
  case 'payment_received':return R(rsv?`Payment received — ${rsv}`:`Payment received — order ${shortOrderNo(o.reference)}`,'Payment received — thank you',`Hi ${esc(name(o))}, we have received your payment of <strong>${due}</strong>.${o.delivery_method==='store_pickup'&&!rsv?' We will let you know as soon as your order is ready for pickup.':''}`,[[rsv?'Reservation reference':'Order number',rsv||shortOrderNo(o.reference)],['Amount paid',due],...(o.delivery_fee_ngn>0?[['Includes delivery',naira(o.delivery_fee_ngn)]]:[])]);
  case 'order_completed':return R(`Order completed — ${rsv||shortOrderNo(o.reference)}`,'Your order is complete',`Hi ${esc(name(o))}, your order is complete. Thank you for buying from Mikee Gadget Plug. Your 7-day warranty starts today.`,[[rsv?'Reservation reference':'Order number',rsv||shortOrderNo(o.reference)]]);
  case 'admin_new_reservation':return {to:ADMIN_NOTIFY(),message:{subject:`New reservation ${rsv} — ${[c.firstName,c.lastName].join(' ')}`,...layout('New reservation request','Open Store Manager → Reservations to confirm or reject it.',o,[['Reference',rsv],['Customer',[c.firstName,c.lastName].join(' ')],['Phone',c.phone||''],['Email',c.email||''],['Preferred pickup date',pick],['Amount due at pickup',due]])}};
  case 'admin_paid_order':return {to:ADMIN_NOTIFY(),message:{subject:`New paid order ${shortOrderNo(o.reference)} — ${due}`,...layout('New paid order','Open Store Manager → Orders.',o,[['Order number',shortOrderNo(o.reference)],['Customer',[c.firstName,c.lastName].join(' ')],['Phone',c.phone||''],['Delivery',o.delivery_method==='store_pickup'?'Store pickup (paid — awaiting pickup)':o.delivery_method==='interstate_park'?`Transport park — ${c.city||''}, ${c.state||''}`:[c.address,c.lga,c.state].filter(Boolean).join(', ')],['Total',due]])}};
 }
 return null;
}
export const ORDER_SELECT='id,reference,paid_at,amount_ngn,delivery_fee_ngn,delivery_method,status,payment_provider,reservation_ref,reservation_status,pickup_date,hold_until,customer,shop_order_items(sku,quantity,unit_price_ngn,selected_color,product_snapshot)';
// Load the order and send the emails for one event (customer and/or admin). Never throws.
export async function notifyOrder(db,reference,kinds,fetcher=fetch){
 const out={};
 try{const o=(await db('shop_orders?reference=eq.'+encodeURIComponent(reference)+'&select='+ORDER_SELECT))[0];if(!o)return out;
  // Payment emails only for payments made in the last 3 days, so revisiting an old order never emails anyone.
  const recentPay=o.paid_at&&Date.now()-new Date(o.paid_at).getTime()<3*864e5;
  for(const kind of kinds){if(['payment_received','admin_paid_order'].includes(kind)&&!recentPay)continue;const mail=buildEmail(kind,o);if(!mail?.to)continue;out[kind]=(await notifyOnce(db,{orderId:o.id,kind,to:mail.to,message:mail.message},fetcher)).status;}}
 catch{}
 return out;
}
