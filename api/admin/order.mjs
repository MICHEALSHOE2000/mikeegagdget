import {db,reply,sameOrigin,verify} from '../_shop.mjs';
import {requireAdmin} from './_auth.mjs';
import {notifyOrder} from '../../commerce/notifications.mjs';
// Emails sent after each reservation action (customer only; never claims more than the database recorded).
const RESERVATION_EMAILS={confirm:['reservation_confirmed'],ready:['ready_for_pickup'],paid:['payment_received','order_completed'],cancel:['reservation_cancelled'],reject:['reservation_cancelled'],expire:['reservation_expired'],no_show:[],extend:['reservation_confirmed']};
export default async function handler(req,res){
 let admin;try{admin=await requireAdmin(req);}catch(e){return reply(res,401,{error:e.message});}
 try{
  if(req.method!=='PATCH')return reply(res,405,{error:'Method not allowed'});
  if(!sameOrigin(req))return reply(res,403,{error:'Use the administrator page.'});
  const {reference,fulfillment,supplier,recheck,bankPaid,reservationAction,hours}=req.body||{};
  if(!/^MGP2-[a-f0-9]{32}$/.test(reference||''))throw Error('Invalid order reference.');
  if(recheck)return reply(res,200,await verify(reference));
  if(bankPaid===true){const status=await db('rpc/shop_bank_transfer_mark_paid',{method:'POST',body:{p_actor:admin.id,p_reference:reference}});await notifyOrder(db,reference,['payment_received','admin_paid_order']);return reply(res,200,{status});}
  if(reservationAction!==undefined){
   if(!Object.hasOwn(RESERVATION_EMAILS,reservationAction))throw Error('Unknown reservation action.');
   let result;try{result=await db('rpc/shop_reservation_action',{method:'POST',body:{p_actor:admin.id,p_reference:reference,p_action:reservationAction,p_hours:reservationAction==='extend'?Number(hours)||24:null}});}
   catch{throw Error('That change is not possible for this reservation right now. Refresh and check its current status.');}
   const emails=await notifyOrder(db,reference,RESERVATION_EMAILS[reservationAction]);
   return reply(res,200,{...result,emails});
  }
  if(!['processing','ready_for_pickup','dispatched','delivered','cancelled'].includes(fulfillment)||!['pending_confirmation','confirmed','issue'].includes(supplier))throw Error('Invalid status.');
  const rows=await db('shop_orders?reference=eq.'+reference+'&select=status,fulfillment_status,payment_provider');if(!rows.length)throw Error('Order not found.');
  if(rows[0].payment_provider==='pay_at_store')throw Error('Manage this reservation in the Reservations section.');
  if(['dispatched','delivered','ready_for_pickup'].includes(fulfillment)&&rows[0].status!=='paid')throw Error('Verify payment before fulfilling this order.');
  await db('shop_orders?reference=eq.'+reference,{method:'PATCH',body:{fulfillment_status:fulfillment,supplier_status:supplier}});
  const changed=rows[0].fulfillment_status!==fulfillment;
  const emails=changed&&fulfillment==='delivered'?await notifyOrder(db,reference,['order_completed']):changed&&fulfillment==='ready_for_pickup'?await notifyOrder(db,reference,['ready_for_pickup']):{};
  return reply(res,200,{saved:true,emails});
 }catch(e){return reply(res,400,{error:e.message});}
}
