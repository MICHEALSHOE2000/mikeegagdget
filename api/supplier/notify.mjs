import {authorized} from './manage.mjs';
import {db,env,sendJson} from '../_checkout.mjs';
export default async function handler(req,res){
 if(req.method!=='POST')return sendJson(res,405,{error:'Method not allowed'});
 if(!authorized(req))return sendJson(res,401,{error:'Merchant authentication required'});
 try{const key=env('RESEND_API_KEY'),from=env('ORDER_EMAIL_FROM'),site=new URL(env('SITE_URL'));if(site.protocol!=='https:')throw Error('Invalid site');const events=await db('order_notifications?status=eq.pending&select=id,order_id,event,created_at&order=id.asc&limit=20');let sent=0;
 for(const event of events){
 // Resend deduplicates retries using this key for 24h. Older uncertain sends need manual review.
 if(Date.now()-Date.parse(event.created_at)>23*3600000){await db('order_notifications?id=eq.'+event.id,{method:'PATCH',body:{status:'failed'}});continue;}
 const [order]=await db('supplier_orders?id=eq.'+event.order_id+'&select=token,customer_email');if(!order)continue;
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':'mikee-order-event-'+event.id},body:JSON.stringify({from,to:[order.customer_email],subject:'Your Mikee Gadget order update',text:'There is an update to your Mikee Gadget order. View your confirmed quote, payment options and order history securely here: '+site.origin+'/order/?token='+order.token+'\nKeep this private link safe. For assistance call 0708 686 5133.'})});if(!response.ok)throw Error('Notification provider unavailable');await db('order_notifications?id=eq.'+event.id,{method:'PATCH',body:{status:'sent',sent_at:new Date().toISOString()}});sent++;}
 return sendJson(res,200,{sent});}catch(e){console.error(e.message);return sendJson(res,503,{error:'Notifications remain queued. Check sender configuration and retry.'});}
}
