import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {STATE_LGAS,NIGERIA_STATES,lgasFor,validStateLga} from '../commerce/nigeria-states-lgas.mjs';
import {validateCheckout,EMAIL,PHONE} from '../commerce/checkout-validation.mjs';
import {BANK_ACCOUNTS,PAYMENT_WHATSAPP} from '../commerce/bank-details.mjs';
import create from '../api/shop/create.mjs';import {verify} from '../api/_shop.mjs';
const read=f=>readFileSync(f,'utf8');
const body=(x={})=>({requestId:'12345678-1234-1234-1234-123456789abc',firstName:'Ada',lastName:'Obi',email:'ada@gmail.com',phone:'08031234567',agreed:true,fulfillment:'delivery',state:'Lagos',lga:'Ikeja',address:'1 Ola Ayeni Street',items:[{sku:'a',quantity:1}],...x});
test('state and LGA data: 36 states + FCT, 774 LGAs, official per-state counts, kept locally',()=>{
 assert.equal(NIGERIA_STATES.length,37);assert.equal(Object.values(STATE_LGAS).flat().length,774);
 const official={Abia:17,Adamawa:21,'Akwa Ibom':31,Anambra:21,Bauchi:20,Bayelsa:8,Benue:23,Borno:27,'Cross River':18,Delta:25,Ebonyi:13,Edo:18,Ekiti:16,Enugu:17,'Federal Capital Territory':6,Gombe:11,Imo:27,Jigawa:27,Kaduna:23,Kano:44,Katsina:34,Kebbi:21,Kogi:21,Kwara:16,Lagos:20,Nasarawa:13,Niger:25,Ogun:20,Ondo:18,Osun:30,Oyo:33,Plateau:17,Rivers:23,Sokoto:23,Taraba:16,Yobe:17,Zamfara:14};
 for(const [s,n] of Object.entries(official))assert.equal(lgasFor(s).length,n,s);
 assert.ok(validStateLga('Lagos','Ikeja'));assert.ok(!validStateLga('Lagos','Ikorodu North'));assert.ok(!validStateLga('Kano','Ikeja'));
 assert.doesNotMatch(read('commerce/nigeria-states-lgas.mjs'),/fetch\(|https?:\/\/(?!npm)/);
});
test('email and phone rules',()=>{
 for(const e of ['michael@gmail.com','a.b@yahoo.co.uk','x@mikeegadget.com.ng'])assert.ok(EMAIL.test(e),e);
 for(const e of ['michael','michael@','michael@gmail','@gmail.com','mi chael@gmail.com'])assert.ok(!EMAIL.test(e),e);
 for(const p of ['07012345678','08012345678','09012345678'])assert.ok(PHONE.test(p),p);
 for(const p of ['0801234567','080123456789','06012345678','+2348012345678','0801234567a'])assert.ok(!PHONE.test(p),p);
});
test('server validation: LGA must belong to the state, phone 11 digits, no "additional address" field, three payment methods',()=>{
 const ok=validateCheckout(body({addressExtra:'ignored'}));
 assert.equal(ok.customer.lga,'Ikeja');assert.equal(ok.customer.city,'Ikeja');assert.equal(ok.customer.state,'Lagos');assert.ok(!('addressExtra' in ok.customer));
 assert.equal(ok.paymentMethod,'paystack');assert.equal(validateCheckout(body({paymentMethod:'bank_transfer'})).paymentMethod,'bank_transfer');
 assert.throws(()=>validateCheckout(body({paymentMethod:'cash'})),/payment method/);
 assert.throws(()=>validateCheckout(body({phone:'0801234567'})),/11-digit/);assert.throws(()=>validateCheckout(body({phone:'05012345678'})),/07, 08 or 09/);
 assert.throws(()=>validateCheckout(body({lga:'Kano Municipal'})),/LGA/);assert.throws(()=>validateCheckout(body({state:''})),/state/);
 assert.throws(()=>validateCheckout(body({email:'ada@gmail'})),/valid email/);
 assert.equal(validateCheckout(body({fulfillment:'pickup',address:'kept out'})).customer.address,'');
});
test('checkout markup: email keyboard, phone rules, State → LGA dropdowns, three radio cards, no additional address field',()=>{
 const h=read('checkout/index.html');
 assert.match(h,/name="email" type="email" autocomplete="email" inputmode="email"/);
 assert.match(h,/name="phone" type="tel" inputmode="numeric" autocomplete="tel" maxlength="11" pattern="0\[789\]\[0-9\]\{9\}" placeholder="08012345678"/);
 assert.match(h,/<select id="co-state" name="state"[^>]*required><option value="">Select state<\/option>/);assert.equal((h.match(/<option>[A-Z][^<]*<\/option>/g)||[]).length>=37,true);
 assert.match(h,/<select id="co-lga" name="lga"[^>]*required disabled>/);
 assert.doesNotMatch(h,/addressExtra|Additional address information|name="city"/);
 assert.equal((h.match(/name="paymentMethod"/g)||[]).length,3);assert.match(h,/value="bank_transfer" checked/);
 assert.match(h,/Make your payment directly into our bank account\. Note, your order will not be shipped until the funds reflect in our account\./);
 assert.match(h,/>Place Order<\/button>/);
 const js=read('assets/shopping.js');assert.match(js,/replace\(\/\\D\/g,''\)\.slice\(0,11\)/);assert.match(js,/'gmail\.com','yahoo\.com','outlook\.com','icloud\.com','hotmail\.com'/);assert.match(js,/button\.disabled=true/);assert.match(js,/e\.key==='Tab'\|\|\(e\.key==='ArrowRight'&&atEnd\)/);
});
test('bank details live in one config file and the confirmation page has copy + WhatsApp confirmation',()=>{
 assert.deepEqual(BANK_ACCOUNTS.map(a=>[a.bank,a.accountNumber]),[['STERLING BANK','0090646352'],['PROVIDUS','6501617899']]);assert.ok(BANK_ACCOUNTS.every(a=>a.accountName==='MICHEAL BABATUNDE ADERINTO'));assert.equal(PAYMENT_WHATSAPP,'2347086865133');
 const js=read('assets/shopping.js');assert.match(js,/data-copy=/);assert.match(js,/Confirm payment on WhatsApp/);assert.match(js,/wa\.me\/\$\{PAYMENT_WHATSAPP\}\?text=/);
 assert.match(read('checkout/complete/index.html'),/id="bank-transfer"/);
});
const env={SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture',PAYSTACK_SECRET_KEY:'sk_test_fixture',SHOP_ORIGIN:'https://shop.example'};
async function withFetch(fn,run){const old=globalThis.fetch,prev={...process.env};Object.assign(process.env,env);globalThis.fetch=fn;try{return await run();}finally{globalThis.fetch=old;for(const k of Object.keys(env))if(prev[k]===undefined)delete process.env[k];else process.env[k]=prev[k];}}
test('bank transfer: order saved as pending_payment via the database, no Paystack call, confirmation stays on this site',async()=>{
 const calls=[];let status,out;const res={status(n){status=n;return this},setHeader(){return this},json(v){out=v;return this}};
 await withFetch(async(url,opts)=>{calls.push(url);if(url.includes('shop_create_order'))return {ok:true,json:async()=>({reference:'MGP2-'+'b'.repeat(32),amount_ngn:2540000,status:'awaiting_payment'})};if(url.includes('shop_bank_transfer_begin'))return {ok:true,json:async()=>({status:'pending_payment'})};return {ok:true,json:async()=>[]};},
  ()=>create({method:'POST',headers:{origin:'https://shop.example'},body:{...body({paymentMethod:'bank_transfer',items:[{sku:'iphone-18-pro-max|256GB · Burgundy',color:'Burgundy',quantity:1}]}),expectedTotalNgn:2540000}},res));
 assert.equal(status,200,JSON.stringify(out));assert.equal(out.provider,'bank_transfer');assert.equal(out.url,'/checkout/complete/?reference=MGP2-'+'b'.repeat(32));
 assert.ok(calls.some(u=>u.includes('rpc/shop_bank_transfer_begin')));assert.ok(!calls.some(u=>u.includes('paystack')));
});
test('verify: bank-transfer orders report pending_payment with the amount and never ask Paystack',async()=>{
 const calls=[];const r=await withFetch(async url=>{calls.push(url);return {ok:true,json:async()=>[{status:'pending_payment',payment_provider:'bank_transfer',amount_ngn:2540000}]};},()=>verify('MGP2-'+'c'.repeat(32)));
 assert.deepEqual(r,{status:'pending_payment',paymentMethod:'bank_transfer',amountNgn:2540000});assert.ok(!calls.some(u=>u.includes('paystack')));
});
test('migration is additive: widens checks, adds functions, drops/renames no column; admin can mark a transfer received',()=>{
 const sql=read('supabase/migrations/20261119100000_bank_transfer_checkout.sql').replace(/--.*$/gm,'');
 assert.doesNotMatch(sql,/drop column|rename|drop table/i);assert.match(sql,/'bank_transfer'/);assert.match(sql,/'pending_payment'/);
 assert.match(sql,/function public\.shop_bank_transfer_begin/);assert.match(sql,/function public\.shop_bank_transfer_mark_paid/);
 assert.match(read('api/admin/order.mjs'),/shop_bank_transfer_mark_paid/);assert.match(read('assets/admin.js'),/Mark bank transfer received/);
});
