// Transactional email through Resend (the provider already used for the store's sign-in emails).
// Needs RESEND_API_KEY on the server. Without it nothing is sent and the attempt is logged as "skipped".
// An email counts as sent only when Resend accepts it (HTTP 2xx with an id).
export const MAIL_FROM=()=>process.env.MAIL_FROM||'Mikee Gadget Plug <support@mikeegadget.com.ng>';
export const ADMIN_NOTIFY=()=>process.env.ADMIN_NOTIFY_EMAIL||'aderintomicheal6@gmail.com';
export async function sendEmail({to,subject,html,text},fetcher=fetch){
 const key=process.env.RESEND_API_KEY;
 if(!key)return {status:'skipped',error:'Email is not configured (RESEND_API_KEY missing).'};
 try{const r=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({from:MAIL_FROM(),to:[to],subject,html,text,reply_to:'support@mikeegadget.com.ng'}),signal:AbortSignal.timeout(15000)});
  const data=await r.json().catch(()=>({}));if(r.ok&&data.id)return {status:'accepted',providerId:String(data.id)};return {status:'failed',error:String(data.message||('HTTP '+r.status)).slice(0,300)};}
 catch(e){return {status:'failed',error:String(e.message||e).slice(0,300)};}
}
// Send one email per order, event and recipient, ever. The log row is claimed first, so retries and
// repeated webhooks never send the same email twice.
export async function notifyOnce(db,{orderId,kind,to,message},fetcher=fetch){
 if(!orderId||!to)return {status:'skipped'};
 let claimed;try{claimed=await db('shop_notifications?on_conflict=order_id,kind,recipient',{method:'POST',body:{order_id:orderId,kind,recipient:to},prefer:'resolution=ignore-duplicates'});}catch{return {status:'failed',error:'log unavailable'};}
 if(!claimed?.length)return {status:'duplicate'};
 const result=await sendEmail({to,...message},fetcher);
 try{await db('shop_notifications?id=eq.'+claimed[0].id,{method:'PATCH',body:{status:result.status,provider_id:result.providerId||null,error:result.error||null,updated_at:new Date().toISOString()}});}catch{}
 return result;
}
