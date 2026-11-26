import {reviewPreview,previewLocked} from '../_catalogue-preview.mjs';
import {notifyOrder} from '../../commerce/notifications.mjs';
import {validateProductEdit} from '../../commerce/admin-catalogue.mjs';
import {db,reply,sameOrigin} from '../_shop.mjs';
import {requireAdmin} from './_auth.mjs';
import {buildItems,feedStats,SITE,FEED_PATH} from '../../commerce/merchant.mjs';
import pages from '../../commerce/merchant-products.mjs';
import {LEAD_STATUSES,KNOWLEDGE,knowledgeMap} from '../../commerce/assistant.mjs';
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// Status, notes, pause/resume, attention, read and manual replies for one conversation.
export async function updateConversation(b,{dbi=db,sendWa}={}){
 const {conversationId:id,status,notes,aiPaused,needsAttention,markRead,message,orderReference}=b;
 if(typeof id!=='string'||!ID.test(id))return [400,{error:'Unknown conversation.'}];
 if((status!==undefined&&!LEAD_STATUSES.includes(status))||(notes!==undefined&&(typeof notes!=='string'||notes.length>2000))||(aiPaused!==undefined&&typeof aiPaused!=='boolean')||(needsAttention!==undefined&&typeof needsAttention!=='boolean')||(message!==undefined&&(typeof message!=='string'||!message.trim()||message.length>1000)))return [400,{error:'Invalid update.'}];
 const rows=await dbi(`shop_assistant_conversations?id=eq.${id}&select=id,channel,transcript,last_customer_at,external_ref,status`);const row=rows[0];if(!row)return [404,{error:'Conversation not found.'}];
 const now=new Date().toISOString(),patch={updated_at:now};
 // "Converted" needs a real paid order: the reference must match a paid order or a completed pickup.
 if(status==='converted'){
  const ref=typeof orderReference==='string'?orderReference.trim().slice(0,60):'';
  if(!/^[\w-]{4,60}$/.test(ref))return [400,{error:'Enter the paid order or reservation reference to mark this as converted.'}];
  const orders=await dbi(`shop_orders?or=(reference.eq.${encodeURIComponent(ref)},reservation_ref.eq.${encodeURIComponent(ref)})&select=reference,status,reservation_status&limit=1`);
  const o=orders[0];if(!o||!(o.status==='paid'||o.reservation_status==='completed_paid'))return [400,{error:'That order is not paid yet, so the chat can’t be marked as converted.'}];
  patch.order_reference=o.reference;
 }
 if(status){patch.status=status;patch.status_source='admin';}
 if(notes!==undefined)patch.admin_notes=notes;
 if(aiPaused!==undefined)patch.ai_paused=aiPaused;
 if(needsAttention!==undefined)patch.needs_attention=needsAttention;
 if(markRead===true){patch.unread_count=0;patch.admin_read_at=now;}
 if(message!==undefined){
  const text=message.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,' ').trim().slice(0,1000);
  if(row.channel==='whatsapp'){
   const {whatsappEnabled,withinWindow,formatOutgoing,sendWhatsApp}=await import('../_ai-whatsapp.mjs');
   if(!whatsappEnabled())return [409,{error:'The WhatsApp channel is not enabled, so this reply can’t be sent.'}];
   if(!withinWindow(row.last_customer_at))return [409,{error:'More than 24 hours since the customer’s last message. WhatsApp only allows an approved template now.'}];
   const sent=await (sendWa||sendWhatsApp)(formatOutgoing(row.external_ref,{text}));if(sent.status!=='sent')return [502,{error:'WhatsApp did not accept the message.'}];
  }
  const seq=(row.transcript||[]).reduce((m,x)=>Math.max(m,x.n||0),0);
  patch.transcript=[...(row.transcript||[]),{n:seq+1,from:'staff',text,at:now}].slice(-80);
  patch.ai_paused=aiPaused===undefined?true:aiPaused; // a person has taken over; Mikee AI stays quiet until resumed
  patch.unread_count=0;patch.admin_read_at=now;
 }
 const saved=await dbi(`shop_assistant_conversations?id=eq.${id}`,{method:'PATCH',body:patch});
 return [200,{id,status:saved?.[0]?.status,ai_paused:saved?.[0]?.ai_paused,transcript:patch.transcript?saved?.[0]?.transcript:undefined}];
}
export async function updateKnowledge(b,user,{dbi=db}={}){
 const {knowledgeKey:key,title,content,status}=b;
 if(!KNOWLEDGE.some(k=>k.key===key))return [400,{error:'Unknown knowledge entry.'}];
 if(typeof title!=='string'||!title.trim()||title.length>120||typeof content!=='string'||content.length>1500||!['verified','needs_confirmation','template'].includes(status))return [400,{error:'Enter a title, up to 1,500 characters and a status.'}];
 if(status==='verified'&&!content.trim())return [400,{error:'A verified entry needs content.'}];
 const saved=await dbi('shop_assistant_knowledge?on_conflict=key',{method:'POST',body:{key,title:title.trim(),content:content.trim(),status,updated_at:new Date().toISOString(),updated_by:user?.id||null},prefer:'resolution=merge-duplicates'});
 return [200,saved?.[0]||{key}];
}
export default async function handler(req,res){
 if(reviewPreview())return previewLocked(res);
 if(!['GET','PATCH'].includes(req.method))return reply(res,405,{error:'Method not allowed'});
 let user;try{user=await requireAdmin(req);}catch(e){return reply(res,401,{error:e.message});}
 try{
  if(req.method==='GET'){
   const kind=req.query?.kind;
   if(kind==='inventory')return reply(res,200,await db('checkout_inventory?select=sku,price_ngn,enabled,product_data,updated_at&order=sku&limit=1000'));
   if(kind==='orders')return reply(res,200,await db('shop_orders?select=reference,amount_ngn,delivery_fee_ngn,delivery_method,status,payment_provider,fulfillment_status,supplier_status,created_at,customer,shop_order_items(sku,quantity,unit_price_ngn,selected_color)&payment_provider=neq.pay_at_store&order=created_at.desc&limit=100'));
   if(kind==='reservations'){
    // Expire overdue reservations first (also runs every 15 minutes in the database), then email those customers once.
    try{await db('rpc/shop_expire_reservations',{method:'POST',body:{}});}catch{}
    const rows=await db('shop_orders?select=reference,reservation_ref,reservation_status,status,amount_ngn,pickup_date,hold_until,created_at,reservation_confirmed_at,reservation_ready_at,reservation_closed_at,customer,shop_order_items(sku,quantity,unit_price_ngn,selected_color,product_snapshot)&reservation_status=not.is.null&order=created_at.desc&limit=200');
    const recent=Date.now()-7*864e5;
    for(const r of rows.filter(r=>r.reservation_status==='expired'&&new Date(r.reservation_closed_at||0).getTime()>recent))await notifyOrder(db,r.reference,['reservation_expired']);
    return reply(res,200,rows);
   }
   if(kind==='merchant'){
    // Google Shopping report: the same rules as the public feed, applied to the live catalogue now.
    const [rows,rates,status]=await Promise.all([db('rpc/shop_deal_catalogue',{method:'POST',body:{}}),db('shop_delivery_rates?select=fee_ngn,enabled'),db('shop_merchant_feed_status?id=eq.google&select=generated_at,stats').catch(()=>[])]);
    const result=buildItems(rows,{pages,rates});
    const warn={};for(const w of result.warnings)warn[w.warning]=(warn[w.warning]||0)+1;
    return reply(res,200,{feedUrl:SITE+FEED_PATH,stats:feedStats(result,rows),lastGenerated:status[0]?.generated_at||null,
     excluded:result.excluded.map(({id,sku,slug,title,reasons})=>({id,sku,slug,title,reasons})),warnings:Object.entries(warn).map(([warning,count])=>({warning,count}))});
   }
   if(kind==='conversations'){
    // Mikee AI inbox. Contact details appear only where the customer gave consent.
    const q=req.query||{},f=[];
    if(LEAD_STATUSES.includes(q.status))f.push(`status=eq.${q.status}`);
    if(q.attention==='1')f.push('needs_attention=is.true');
    if(['website','whatsapp'].includes(q.channel))f.push(`channel=eq.${q.channel}`);
    return reply(res,200,await db(`shop_assistant_conversations?select=id,channel,created_at,updated_at,last_customer_at,source_page,product_slug,product_label,storage_pref,condition_pref,budget_ngn,payment_pref,delivery_location,timeline,customer_name,phone,email,consent,score,status,status_source,order_reference,needs_attention,escalation_reason,handoff_at,ai_paused,unread_count,admin_notes,message_count,provider${f.length?'&'+f.join('&'):''}&message_count=gt.0&order=needs_attention.desc,updated_at.desc&limit=300`));
   }
   if(kind==='conversation'){
    const id=String(req.query?.id||'');if(!ID.test(id))return reply(res,400,{error:'Unknown conversation.'});
    return reply(res,200,(await db(`shop_assistant_conversations?id=eq.${id}&select=id,channel,transcript,state,last_customer_at,ai_paused`))[0]||null);
   }
   if(kind==='knowledge'){
    const rows=await db('shop_assistant_knowledge?select=key,title,content,status,updated_at').catch(()=>[]);
    return reply(res,200,[...knowledgeMap(rows).values()].map(({key,title,content,status,source,updatedAt})=>({key,title,content,status,source,updatedAt})));
   }
   return reply(res,400,{error:'Choose inventory, orders, reservations, merchant, conversations or knowledge.'});
  }
  if(!sameOrigin(req))return reply(res,403,{error:'Use the administrator page.'});
  // Mikee AI inbox and knowledge base.
  if(req.body?.conversationId)return reply(res,...await updateConversation(req.body));
  if(req.body?.knowledgeKey)return reply(res,...await updateKnowledge(req.body,user));
  const {sku,price,enabled,updatedAt,productData}=req.body||{};
  if(typeof sku!=='string'||!sku||sku.length>250||(price!==null&&(!Number.isSafeInteger(price)||price<=0||price>100000000))||typeof enabled!=='boolean'||(enabled&&price===null)||typeof updatedAt!=='string')return reply(res,400,{error:'Enter a valid price and availability.'});
  if(enabled){const check=await db('checkout_inventory?sku=eq.'+encodeURIComponent(sku)+'&select=product_data');if(check[0]?.product_data?.reviewRequired)return reply(res,400,{error:'This legacy variant needs catalogue verification before it can be enabled.'});}
  if(productData){
   const rows=await db('checkout_inventory?sku=eq.'+encodeURIComponent(sku)+'&select=product_data');
   let data;try{data=validateProductEdit(rows[0]?.product_data||{},productData);}catch(e){return reply(res,400,{error:e.message});}
   const saved=await db('rpc/shop_admin_update_product',{method:'POST',body:{p_actor:user.id,p_sku:sku,p_price:price,p_enabled:enabled,p_updated_at:updatedAt,p_data:data}});
   return reply(res,200,saved);
  }
  const result=await db('rpc/shop_admin_update_price',{method:'POST',body:{p_actor:user.id,p_sku:sku,p_price:price,p_enabled:enabled,p_updated_at:updatedAt}});
  return reply(res,200,result);
 }catch{return reply(res,409,{error:'Could not save this change. Reload the inventory and try again.'});}
}
