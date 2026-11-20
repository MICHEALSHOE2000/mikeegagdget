import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,readdirSync,statSync} from 'node:fs';
import {LAGOS_LGA_FEES,STATE_PARKS,seedRows,rateTable,quote,PARK_NOTE} from '../commerce/delivery-rates.mjs';
import {lgasFor,NIGERIA_STATES} from '../commerce/nigeria-states-lgas.mjs';
import {validateCheckout,lagosToday,addDays} from '../commerce/checkout-validation.mjs';
import {sendEmail,notifyOnce} from '../commerce/email.mjs';
import {buildEmail} from '../commerce/notifications.mjs';
import create from '../api/shop/create.mjs';import {verify} from '../api/_shop.mjs';
const read=f=>readFileSync(f,'utf8');
const base=(x={})=>({requestId:'12345678-1234-1234-1234-123456789abc',firstName:'Ada',lastName:'Obi',email:'ada@gmail.com',phone:'08031234567',agreed:true,items:[{sku:'a',quantity:1}],...x});
test('all 20 Lagos LGAs carry the approved delivery prices',()=>{
 const approved={'Agege':5000,'Ajeromi-Ifelodun (Ajegunle)':5000,'Alimosho':5000,'Amuwo-Odofin':5000,'Apapa':10000,'Badagry':10000,'Epe':10000,'Eti-Osa':10000,'Ibeju-Lekki':10000,'Ifako-Ijaiye':5000,'Ikeja':10000,'Ikorodu':8000,'Kosofe':8000,'Lagos Island':10000,'Lagos Mainland':5000,'Mushin':5000,'Ojo':10000,'Oshodi-Isolo':5000,'Shomolu':5000,'Surulere':5000};
 assert.deepEqual(LAGOS_LGA_FEES,approved);assert.deepEqual([...lgasFor('Lagos')].sort(),Object.keys(approved).sort());
 const t=rateTable(seedRows());for(const [lga,fee] of Object.entries(approved))assert.equal(quote(t,'lagos_delivery','Lagos',lga).fee,fee,lga);
 assert.equal(quote(t,'lagos_delivery','Lagos','Lagos Mainland').fee+650000,655000);assert.equal(quote(t,'lagos_delivery','Lagos','Ikeja').fee+650000,660000);
});
test('interstate transport park prices per state; FCT has no price until set in Admin; Lagos cannot use park pickup',()=>{
 assert.equal(Object.keys(STATE_PARKS).length,36);for(const s of NIGERIA_STATES.filter(s=>s!=='Lagos'))assert.ok(STATE_PARKS[s],s);
 const t=rateTable(seedRows());
 for(const [s,[city,fee]] of Object.entries(STATE_PARKS)){const q=quote(t,'interstate_park',s,'x');if(fee==null)assert.equal(q,null,s);else{assert.equal(q.fee,fee,s);assert.match(q.label,new RegExp(city));}}
 assert.equal(quote(t,'interstate_park','Kano').fee,12000);assert.equal(quote(t,'interstate_park','Adamawa').fee,15000);assert.equal(quote(t,'interstate_park','Oyo').fee,8000);
 assert.equal(quote(t,'interstate_park','Lagos'),null);assert.equal(quote(t,'lagos_delivery','Kano','x'),null);assert.deepEqual(quote(t,'store_pickup'),{fee:0,label:'Pickup at Mikee Gadget Store'});
 assert.match(PARK_NOTE,/designated transport park/);
});
test('server rules: Lagos needs LGA + address, other states need LGA + town, pickup needs no address, reserve only for pickup with a valid date',()=>{
 assert.equal(validateCheckout(base({deliveryMethod:'lagos_delivery',state:'Lagos',lga:'Ikeja',address:'12 Allen'})).customer.deliveryMethod,'lagos_delivery');
 assert.throws(()=>validateCheckout(base({deliveryMethod:'lagos_delivery',state:'Lagos',lga:'Ikeja',address:''})),/street address/);
 assert.throws(()=>validateCheckout(base({deliveryMethod:'lagos_delivery',state:'Kano',lga:'Nasarawa',address:'x'})),/Lagos/);
 const park=validateCheckout(base({deliveryMethod:'interstate_park',state:'Kano',lga:'Nasarawa',town:'Kano city',park:'Kano line'}));assert.equal(park.customer.city,'Kano city');assert.equal(park.customer.park,'Kano line');assert.equal(park.customer.address,'');
 assert.throws(()=>validateCheckout(base({deliveryMethod:'interstate_park',state:'Kano',lga:'Nasarawa',town:''})),/city or town/);
 assert.throws(()=>validateCheckout(base({deliveryMethod:'interstate_park',state:'Lagos',lga:'Ikeja',town:'x'})),/destination state/);
 const pick=validateCheckout(base({deliveryMethod:'store_pickup'}));assert.equal(pick.customer.address,'');assert.equal(pick.customer.fulfillment,'pickup');
 const today=lagosToday();
 assert.throws(()=>validateCheckout(base({deliveryMethod:'lagos_delivery',state:'Lagos',lga:'Ikeja',address:'x',paymentMethod:'pay_at_pickup'})),/only available for store pickup/);
 assert.throws(()=>validateCheckout(base({deliveryMethod:'interstate_park',state:'Kano',lga:'Nasarawa',town:'x',paymentMethod:'pay_at_pickup'})),/only available for store pickup/);
 const r=validateCheckout(base({deliveryMethod:'store_pickup',paymentMethod:'pay_at_pickup',pickupDate:today}));assert.equal(r.customer.paymentChoice,'pay_at_pickup');assert.equal(r.customer.pickupDate,today);
 assert.throws(()=>validateCheckout(base({deliveryMethod:'store_pickup',paymentMethod:'pay_at_pickup',pickupDate:addDays(today,-1)})),/pickup date/);
 assert.throws(()=>validateCheckout(base({deliveryMethod:'store_pickup',paymentMethod:'pay_at_pickup',pickupDate:addDays(today,15)})),/pickup date/);
 // The browser cannot send a delivery fee or total that the server uses.
 const x=validateCheckout(base({deliveryMethod:'lagos_delivery',state:'Lagos',lga:'Ikeja',address:'x',deliveryFee:0,amount:1}));assert.equal(x.deliveryFee,undefined);assert.equal(x.customer.deliveryFee,undefined);
});
test('email: nothing is sent or claimed without a provider key; accepted only on a 2xx with an id',async()=>{
 const prev=process.env.RESEND_API_KEY;delete process.env.RESEND_API_KEY;
 assert.equal((await sendEmail({to:'a@b.c',subject:'s',html:'h',text:'t'},()=>{throw Error('should not call');})).status,'skipped');
 process.env.RESEND_API_KEY='re_test';
 assert.deepEqual(await sendEmail({to:'a@b.c',subject:'s',html:'h'},async()=>({ok:true,json:async()=>({id:'em_1'})})),{status:'accepted',providerId:'em_1'});
 assert.equal((await sendEmail({to:'a@b.c',subject:'s',html:'h'},async()=>({ok:false,status:422,json:async()=>({message:'bad from'})}))).status,'failed');
 assert.equal((await sendEmail({to:'a@b.c',subject:'s',html:'h'},async()=>({ok:true,json:async()=>({})}))).status,'failed');
 // The same order/event/recipient is never emailed twice.
 const log=new Set();let sends=0;const db=async(path,{method,body}={})=>{if(method==='POST'){const k=[body.order_id,body.kind,body.recipient].join('|');if(log.has(k))return [];log.add(k);return [{id:1}];}return [];};
 const f=async()=>{sends++;return {ok:true,json:async()=>({id:'x'})};};
 assert.equal((await notifyOnce(db,{orderId:'o1',kind:'reservation_received',to:'a@b.c',message:{subject:'s',html:'h'}},f)).status,'accepted');
 assert.equal((await notifyOnce(db,{orderId:'o1',kind:'reservation_received',to:'a@b.c',message:{subject:'s',html:'h'}},f)).status,'duplicate');assert.equal(sends,1);
 if(prev===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=prev;
});
test('email wording: reservation is a request until confirmed; ₦0 online and the full amount due at pickup',()=>{
 const o={reference:'MGP2-'+'a'.repeat(32),reservation_ref:'RSV-AB12CD34EF',amount_ngn:650000,pickup_date:'2026-11-22',hold_until:'2026-11-23T10:00:00Z',customer:{firstName:'Ada',email:'ada@gmail.com',phone:'08031234567'},shop_order_items:[{sku:'x',quantity:1,unit_price_ngn:650000,product_snapshot:{model:'iPhone 16 Pro Max',storage:'256GB'}}]};
 const rec=buildEmail('reservation_received',o);assert.equal(rec.to,'ada@gmail.com');assert.match(rec.message.html,/not yet a guarantee/);assert.match(rec.message.text,/Amount payable online: ₦0/);assert.match(rec.message.text,/Amount due at pickup: ₦650,000/);
 assert.match(buildEmail('reservation_confirmed',o).message.html,/holding it for you until/);assert.equal(buildEmail('admin_new_reservation',o).to,'aderintomicheal6@gmail.com');
 for(const k of ['ready_for_pickup','reservation_cancelled','reservation_expired','payment_received','order_completed'])assert.ok(buildEmail(k,o).message.subject,k);
});
const env={SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture',PAYSTACK_SECRET_KEY:'sk_test_fixture',SHOP_ORIGIN:'https://shop.example'};
async function withFetch(fn,run){const old=globalThis.fetch,prev={...process.env};Object.assign(process.env,env);delete process.env.RESEND_API_KEY;globalThis.fetch=fn;try{return await run();}finally{globalThis.fetch=old;for(const k of Object.keys(env))if(prev[k]===undefined)delete process.env[k];else process.env[k]=prev[k];if(prev.RESEND_API_KEY)process.env.RESEND_API_KEY=prev.RESEND_API_KEY;}}
test('Reserve Now, Pay at Pickup: saved through the database, no Paystack/Credit Direct/bank transfer, repeated taps return the same reservation',async()=>{
 const calls=[];const ref='MGP2-'+'d'.repeat(32);
 const fetcher=async(url,opts)=>{calls.push(url);
  if(url.includes('checkout_inventory'))return {ok:true,json:async()=>[{sku:'ip|256',product_data:{model:'iPhone'}}]};
  if(url.includes('rpc/shop_create_order_v3')){const body=JSON.parse(opts.body);assert.equal(body.p_customer.deliveryMethod,'store_pickup');assert.equal(body.p_customer.paymentChoice,'pay_at_pickup');return {ok:true,json:async()=>({reference:ref,amount_ngn:650000,delivery_fee_ngn:0,status:'unpaid',reservation_ref:'RSV-AB12CD34EF'})};}
  return {ok:true,json:async()=>[]};};
 for(let i=0;i<2;i++){let status,out;const res={status(n){status=n;return this},setHeader(){return this},json(v){out=v;return this}};
  await withFetch(fetcher,()=>create({method:'POST',headers:{origin:'https://shop.example'},body:{...base({items:[{sku:'ip|256',quantity:1}],deliveryMethod:'store_pickup',paymentMethod:'pay_at_pickup',pickupDate:lagosToday()}),expectedTotalNgn:650000}},res));
  assert.equal(status,200,JSON.stringify(out));assert.equal(out.provider,'reservation');assert.equal(out.reservationRef,'RSV-AB12CD34EF');assert.equal(out.url,'/checkout/complete/?reference='+ref);assert.equal(out.emailed,false);}
 assert.ok(!calls.some(u=>/paystack|credit_direct|bank_transfer/.test(u)));
});
test('delivery orders: the database prices the delivery; a stale browser total is refused',async()=>{
 let status,out;const res={status(n){status=n;return this},setHeader(){return this},json(v){out=v;return this}};
 await withFetch(async url=>url.includes('rpc/shop_create_order_v3')?{ok:true,json:async()=>({reference:'MGP2-'+'e'.repeat(32),amount_ngn:660000,delivery_fee_ngn:10000,status:'awaiting_payment'})}:{ok:true,json:async()=>[]},
  ()=>create({method:'POST',headers:{origin:'https://shop.example'},body:{...base({items:[{sku:'ip|256',quantity:1}],deliveryMethod:'lagos_delivery',state:'Lagos',lga:'Ikeja',address:'12 Allen',paymentMethod:'paystack'}),expectedTotalNgn:650000}},res));
 assert.equal(status,409);assert.match(out.error,/price has changed/);
});
test('verify: a reservation reports "reserved" with the amount due at pickup and never asks a payment provider',async()=>{
 const calls=[];const r=await withFetch(async url=>{calls.push(url);return {ok:true,json:async()=>[{status:'unpaid',payment_provider:'pay_at_store',amount_ngn:650000,reservation_ref:'RSV-1',reservation_status:'pending_confirmation',pickup_date:'2026-11-22',hold_until:null}]};},()=>verify('MGP2-'+'f'.repeat(32)));
 assert.equal(r.status,'reserved');assert.equal(r.amountDueNgn,650000);assert.equal(r.reservationRef,'RSV-1');assert.ok(!calls.some(u=>u.includes('paystack')));
});
test('checkout page: delivery or free store pickup, LGA prices, park details, Pay Online or Reserve Now, ₦0 online explained',()=>{
 const h=read('checkout/index.html'),js=read('assets/shopping.js');
 assert.match(h,/name="receive" value="delivery" checked/);assert.match(h,/Pickup at Mikee Gadget Store — FREE/);
 assert.match(h,/Pay Online &amp; Pickup in Store/);assert.match(h,/Reserve Now — Pay at Pickup/);assert.match(h,/Prefer to see your gadget before paying\? Reserve it online and pay when you visit our store\./);
 assert.match(h,/name="town"/);assert.match(h,/name="park"/);assert.match(h,/designated transport park/);assert.match(h,/name="pickupDate" type="date"/);
 assert.doesNotMatch(h,/<select name="fulfillment">/);
 assert.match(js,/Amount payable online/);assert.match(js,/Amount due at pickup/);assert.match(js,/Reservation Request Received!/);assert.match(js,/location\.assign\(wa\)/);
});
test('no page promises free delivery any more (free store pickup only)',()=>{
 const pages=[];const walk=d=>{for(const n of readdirSync(d)){if(n==='node_modules'||n.startsWith('.')||n==='tests')continue;const p=d+'/'+n;if(statSync(p).isDirectory())walk(p);else if(/\.(html|js|mjs)$/.test(n))pages.push(p);}};walk('.');
 const bad=pages.filter(p=>/free nationwide delivery|delivery is free|free delivery/i.test(read(p)));assert.deepEqual(bad,[]);
});
test('database migration is additive and server-enforced; admin has Reservations and Delivery prices',()=>{
 const sql=read('supabase/migrations/20261120100000_delivery_reservations.sql').replace(/--.*$/gm,'');
 assert.doesNotMatch(sql,/drop column|drop table|rename|delete from|truncate/i);
 for(const f of ['shop_delivery_quote','shop_create_order_v3','shop_reservation_action','shop_expire_reservations','shop_credit_direct_begin'])assert.match(sql,new RegExp('function public\\.'+f));
 assert.match(sql,/'Reserve Now, Pay at Pickup is only for store pickup'/);assert.match(sql,/Administrator access required/);assert.match(sql,/cron\.schedule/);
 assert.match(sql,/productId','delivery'/);
 const admin=read('admin/index.html');assert.match(admin,/data-tab="reservations"/);assert.match(admin,/data-tab="delivery"/);assert.match(admin,/name="holdHours"/);
 const js=read('assets/admin.js');for(const a of ['confirm','reject','ready','paid','cancel','no_show','extend'])assert.match(js,new RegExp(`'${a}'`));
 assert.match(read('api/admin/order.mjs'),/rpc\/shop_reservation_action/);assert.match(read('api/admin/manage.mjs'),/rpc\/shop_expire_reservations/);
});
