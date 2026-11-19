import {cleanCart} from './cart.mjs';
import {NIGERIA_STATES,validStateLga} from './nigeria-states-lgas.mjs';
export const PAYMENT_METHODS=['bank_transfer','paystack','credit_direct'];
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
 if(!['delivery','pickup'].includes(body.fulfillment))throw Error('Choose delivery or pickup.');
 const paymentMethod=body.paymentMethod===undefined?'paystack':body.paymentMethod;
 if(!PAYMENT_METHODS.includes(paymentMethod))throw Error('Choose a payment method.');
 const state=text('state'),lga=text('lga'),address=text('address',500);
 if(!NIGERIA_STATES.includes(state))throw Error('Select your state.');
 if(!validStateLga(state,lga))throw Error('Select your LGA / city.');
 if(body.fulfillment==='delivery'&&!address)throw Error('Enter your street address for delivery.');
 const items=cleanCart(body.items);
 if(!items.length||items.length!==body.items?.length)throw Error('Review the items in your cart.');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.requestId||''))throw Error('Refresh checkout and try again.');
 // "city" keeps the LGA so existing order summaries and the admin list keep working.
 return {requestId:body.requestId,paymentMethod,items,customer:{firstName,lastName,email,phone,country:'Nigeria',state,lga,city:lga,address:body.fulfillment==='delivery'?address:'',notes:text('notes',1000),fulfillment:body.fulfillment},policyVersion:'2026-11-11'};
}
