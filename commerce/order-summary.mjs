// Customer-safe view of an order for the confirmation page. The order reference is a 128-bit random
// value, but the street address is still never returned and contact details are partly masked.
export const maskEmail=email=>{const [user='',domain='']=String(email||'').split('@');if(!domain)return '';return (user.slice(0,2)||'')+'•••@'+domain;};
export const maskPhone=phone=>{const digits=String(phone||'').replace(/\D/g,'');return digits.length<4?'':'••• ••• '+digits.slice(-4);};
const text=(value,max=120)=>typeof value==='string'?value.slice(0,max):'';
export function orderSummary(order){
 if(!order)return null;
 const c=order.customer||{},pickup=c.fulfillment==='pickup';
 return {
  amountNgn:Number(order.amount_ngn)||0,
  deliveryFeeNgn:Number(order.delivery_fee_ngn)||0,
  createdAt:order.created_at||null,
  fulfillmentStatus:text(order.fulfillment_status,40),
  fulfillment:pickup?'pickup':'delivery',
  deliveryMethod:text(order.delivery_method,30),
  destination:pickup?'':[text(c.city,80),text(c.state,60)].filter(Boolean).join(', '),
  customer:{firstName:text(c.firstName,60),email:maskEmail(c.email),phone:maskPhone(c.phone)},
  items:(order.shop_order_items||[]).map(i=>{const p=i.product_snapshot||{};return {
   sku:text(i.sku,250),model:text(p.model,120)||text(i.sku,120),image:typeof p.image==='string'&&p.image.startsWith('/')?p.image:'',
   storage:text(p.capacity||p.storage,80),condition:text(p.condition,40),color:text(i.selected_color,80),
   quantity:Number(i.quantity)||0,unitPriceNgn:Number(i.unit_price_ngn)||0};})
 };
}
