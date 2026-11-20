import {cleanCart} from './cart.mjs';
import {NIGERIA_STATES,validStateLga} from './nigeria-states-lgas.mjs';
import {DELIVERY_METHODS} from './delivery-rates.mjs';
export const PAYMENT_METHODS=['bank_transfer','paystack','credit_direct','pay_at_pickup'];
// Latest pickup date a customer can choose for a reservation (days from today, Lagos time).
export const PICKUP_WINDOW_DAYS=14;
export const lagosToday=(now=new Date())=>now.toLocaleDateString('en-CA',{timeZone:'Africa/Lagos'});
export const addDays=(ymd,n)=>{const d=new Date(ymd+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
// Shared by the checkout page and the server so both apply the same rules.
export const EMAIL=/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
export const PHONE=/^0[789]\d{9}$/;
export function validateCheckout(body){
 if(!body||typeof body!=='object')throw Error('Enter your checkout details.');
 const text=(key,max=150)=>String(body[key]||'').trim().slice(0,max);
 const firstName=text('firstName'),lastName=text('lastName'),email=text('email',254).toLowerCase(),phone=text('phone',30);
 if(!firstName||!lastName)throw Error('Enter your first and last name.');
 if(!EMAIL.test(email))throw Error('Enter a valid email address, for example name@gmail.com.');
 if(!PHONE.test(phone))throw Error('Enter an 11-digit phone number starting with 07, 08 or 09.');
 if(body.agreed!==true)throw Error('Please agree to the purchase terms.');
 // Delivery method decides which details are needed. Older pages sent only "fulfillment" (delivery/pickup).
 const deliveryMethod=body.deliveryMethod??(body.fulfillment==='pickup'?'store_pickup':body.state==='Lagos'?'lagos_delivery':'interstate_park');
 if(!DELIVERY_METHODS.includes(deliveryMethod))throw Error('Choose how you want to receive your order.');
 const paymentMethod=body.paymentMethod===undefined?'paystack':body.paymentMethod;
 if(!PAYMENT_METHODS.includes(paymentMethod))throw Error('Choose a payment method.');
 const reserve=paymentMethod==='pay_at_pickup';
 if(reserve&&deliveryMethod!=='store_pickup')throw Error('Reserve Now, Pay at Pickup is only available for store pickup.');
 const state=text('state'),lga=text('lga'),address=text('address',500),town=text('town',100),park=text('park',150);
 let pickupDate='';
 if(deliveryMethod==='lagos_delivery'){
  if(state!=='Lagos')throw Error('Home delivery is available in Lagos. For other states choose transport park pickup.');
  if(!validStateLga(state,lga))throw Error('Select your LGA.');
  if(!address)throw Error('Enter your street address for delivery.');
 }else if(deliveryMethod==='interstate_park'){
  if(!NIGERIA_STATES.includes(state)||state==='Lagos')throw Error('Select your destination state.');
  if(!validStateLga(state,lga))throw Error('Select your destination LGA.');
  if(!town)throw Error('Enter your destination city or town.');
 }else if(reserve){
  pickupDate=text('pickupDate',10);const today=lagosToday();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate)||pickupDate<today||pickupDate>addDays(today,PICKUP_WINDOW_DAYS))throw Error(`Choose a pickup date between today and the next ${PICKUP_WINDOW_DAYS} days.`);
 }
 const items=cleanCart(body.items);
 if(!items.length||items.length!==body.items?.length)throw Error('Review the items in your cart.');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.requestId||''))throw Error('Refresh checkout and try again.');
 // "city" keeps the LGA so existing order summaries and the admin list keep working.
 const pickup=deliveryMethod==='store_pickup';
 const customer={firstName,lastName,email,phone,country:'Nigeria',state:pickup?'':state,lga:pickup?'':lga,city:deliveryMethod==='interstate_park'?town:pickup?'':lga,address:deliveryMethod==='lagos_delivery'?address:'',notes:text('notes',1000),fulfillment:pickup?'pickup':'delivery',deliveryMethod,paymentChoice:reserve?'pay_at_pickup':'online'};
 if(deliveryMethod==='interstate_park'){customer.town=town;customer.park=park;}
 if(reserve)customer.pickupDate=pickupDate;
 return {requestId:body.requestId,paymentMethod,deliveryMethod,items,customer,policyVersion:'2026-11-11'};
}
