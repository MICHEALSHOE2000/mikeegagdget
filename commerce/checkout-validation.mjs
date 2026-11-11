import {cleanCart} from './cart.mjs';
import {nigeriaStates} from './nigeria.mjs';
export function validateCheckout(body){
 if(!body||typeof body!=='object')throw Error('Enter your checkout details.');
 const text=(key,max=150)=>String(body[key]||'').trim().slice(0,max);
 const firstName=text('firstName'),lastName=text('lastName'),email=text('email',254).toLowerCase(),phone=text('phone',30);
 if(!firstName||!lastName||!/^\S+@\S+\.\S+$/.test(email)||!/^\+?[\d ()-]{7,25}$/.test(phone))throw Error('Enter your name, a valid email and phone number.');
 if(body.agreed!==true)throw Error('Please agree to the purchase terms.');
 if(!['delivery','pickup'].includes(body.fulfillment))throw Error('Choose delivery or pickup.');
 const state=text('state'),city=text('city'),address=text('address',500);
 if(body.fulfillment==='delivery'&&(!nigeriaStates.includes(state)||!city||!address))throw Error('Enter your state, city and delivery address.');
 const items=cleanCart(body.items);
 if(!items.length||items.length!==body.items?.length)throw Error('Review the items in your cart.');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.requestId||''))throw Error('Refresh checkout and try again.');
 return {requestId:body.requestId,items,customer:{firstName,lastName,email,phone,country:'Nigeria',state,city,address,addressExtra:text('addressExtra',300),notes:text('notes',1000),fulfillment:body.fulfillment},policyVersion:'2026-11-11'};
}
