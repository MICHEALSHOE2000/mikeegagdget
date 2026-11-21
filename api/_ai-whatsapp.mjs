// Mikee AI — WhatsApp Cloud API adapter (official Meta API). PREPARED BUT DISABLED.
// It does nothing unless WHATSAPP_ENABLED=true and all four Meta credentials are set on the server; until then the
// webhook answers 404. No unofficial WhatsApp Web automation is used anywhere.
// Route when enabled: /api/whatsapp (rewritten to /api/shop/settings?op=whatsapp).
import {createHmac,timingSafeEqual} from 'node:crypto';
import {db,reply} from './_shop.mjs';
import {context,processMessage,sha,salt,hit,notifyHandoff,LIMITS} from './_assistant.mjs';
import {cleanText,MAX_TEXT} from '../commerce/assistant.mjs';

const GRAPH='https://graph.facebook.com/v21.0';
const env=k=>process.env[k]||'';
export function whatsappEnabled(){return env('WHATSAPP_ENABLED')==='true'&&!!(env('WHATSAPP_VERIFY_TOKEN')&&env('WHATSAPP_APP_SECRET')&&env('WHATSAPP_ACCESS_TOKEN')&&env('WHATSAPP_PHONE_NUMBER_ID'));}

/** Meta's webhook verification handshake (GET). */
export function verifyWebhook(query={}){
 const token=String(query['hub.verify_token']||''),expected=env('WHATSAPP_VERIFY_TOKEN');
 if(query['hub.mode']!=='subscribe'||!expected||token.length!==expected.length||!timingSafeEqual(Buffer.from(token),Buffer.from(expected)))return {status:403,body:'Forbidden'};
 const challenge=String(query['hub.challenge']||'');return /^[\w-]{1,200}$/.test(challenge)?{status:200,body:challenge}:{status:400,body:'Bad request'};
}
/** X-Hub-Signature-256 = "sha256=" + HMAC-SHA256(app secret, raw request body). */
export function validSignature(raw,header,secret=env('WHATSAPP_APP_SECRET')){
 if(!secret||typeof header!=='string'||!/^sha256=[0-9a-f]{64}$/.test(header)||raw==null)return false;
 const want=Buffer.from('sha256='+createHmac('sha256',secret).update(raw).digest('hex')),got=Buffer.from(header);
 return want.length===got.length&&timingSafeEqual(want,got);
}
/** Incoming customer messages from a webhook payload. Non-text messages are kept so we can reply politely. */
export function parseIncoming(payload){
 const out=[];
 if(payload?.object!=='whatsapp_business_account')return out;
 for(const entry of payload.entry||[])for(const change of entry.changes||[]){
  const v=change.value||{};if(change.field!=='messages'||!Array.isArray(v.messages))continue;
  const names=new Map((v.contacts||[]).map(c=>[c.wa_id,c.profile?.name]));
  for(const m of v.messages){
   if(typeof m?.id!=='string'||typeof m.from!=='string'||!/^\d{6,20}$/.test(m.from))continue;
   out.push({id:m.id.slice(0,200),from:m.from,name:cleanText(names.get(m.from)||'').slice(0,60),timestamp:Number(m.timestamp)||0,type:m.type,
    text:m.type==='text'?cleanText(m.text?.body):m.type==='interactive'?cleanText(m.interactive?.button_reply?.title||m.interactive?.list_reply?.title):''});
  }
 }
 return out;
}
/** Free-form replies are only allowed within 24 hours of the customer's last message; after that Meta requires an approved template. */
export const withinWindow=(lastCustomerAt,now=Date.now())=>!!lastCustomerAt&&now-new Date(lastCustomerAt).getTime()<24*3600e3;
/** WhatsApp text message for a Mikee AI reply. Product cards become short lines with links (absolute URLs). */
export function formatOutgoing(to,r,{site=env('SITE_URL')||'https://www.mikeegadget.com.ng'}={}){
 const lines=[r?.text||''];
 for(const c of (r?.cards||[]).slice(0,4))lines.push(`• ${c.name}${c.storage?` ${c.storage}`:''} (${c.condition}) — ${c.priceText}\n  ${site}${c.url}`);
 const body=lines.filter(Boolean).join('\n\n').slice(0,4096);
 return body?{messaging_product:'whatsapp',recipient_type:'individual',to,type:'text',text:{preview_url:false,body}}:null;
}
export async function sendWhatsApp(payload,{fetcher=fetch}={}){
 if(!whatsappEnabled())return {status:'disabled'};
 try{const r=await fetcher(`${GRAPH}/${env('WHATSAPP_PHONE_NUMBER_ID')}/messages`,{method:'POST',headers:{Authorization:'Bearer '+env('WHATSAPP_ACCESS_TOKEN'),'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(10000)});
  const data=await r.json().catch(()=>({}));return r.ok?{status:'sent',id:data?.messages?.[0]?.id||null}:{status:'failed',error:String(data?.error?.message||r.status).slice(0,200)};}
 catch(e){return {status:'failed',error:String(e.message||e).slice(0,200)};}
}
async function rawBody(req){
 if(Buffer.isBuffer(req.rawBody))return req.rawBody;if(typeof req.rawBody==='string')return Buffer.from(req.rawBody);
 if(Buffer.isBuffer(req.body))return req.body;if(typeof req.body==='string')return Buffer.from(req.body);
 // Exact bytes are needed for the signature. A pre-parsed JSON body cannot be verified, so it is rejected.
 if(req.readable===false||(req.body&&typeof req.body==='object'))return null;
 const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>256*1024)return null;chunks.push(c);}return Buffer.concat(chunks);
}

export async function whatsappHandler(req,res,deps={}){
 if(!whatsappEnabled())return reply(res,404,{error:'The WhatsApp channel is not enabled.'});
 if(req.method==='GET'){const v=verifyWebhook(req.query||{});return res.status(v.status).setHeader('Content-Type','text/plain').send(v.body);}
 if(req.method!=='POST')return reply(res,405,{error:'Method not allowed'});
 const raw=await rawBody(req);
 if(!validSignature(raw,req.headers['x-hub-signature-256']))return reply(res,401,{error:'Invalid signature'});
 let payload;try{payload=JSON.parse(raw.toString('utf8'));}catch{return reply(res,400,{error:'Invalid JSON'});}
 const messages=parseIncoming(payload);
 let ctx;try{ctx=await context();}catch{return reply(res,200,{ok:true,skipped:'catalogue unavailable'});} // 200 so Meta does not retry forever
 for(const m of messages){
  // Duplicate protection: the message id is claimed once.
  let claimed;try{claimed=await db('shop_assistant_wa_events?on_conflict=message_id',{method:'POST',body:{message_id:m.id},prefer:'resolution=ignore-duplicates'});}catch{continue;}
  if(!claimed?.length)continue;
  const key=sha(salt()+'wa:'+m.from);
  try{if(!(await hit('wa:'+key.slice(0,32),LIMITS.ipMessagesPer10Min,600)))continue;}catch{continue;}
  let row=(await db(`shop_assistant_conversations?channel=eq.whatsapp&external_hash=eq.${key}&select=id,channel,state,transcript,message_count,llm_calls,consent,status,status_source,handoff_at,handoff_notified_at,ai_paused,unread_count,last_customer_at,product_label`).catch(()=>[]))[0];
  const isNew=!row;
  // Messaging the business on WhatsApp shares the number with us, so the conversation is kept for replies.
  if(!row)row={id:null,channel:'whatsapp',state:{consent:true,name:m.name||undefined},transcript:[],message_count:0,llm_calls:0,unread_count:0,consent:true};
  const text=m.text||'(non-text message)';
  const out=await processMessage(row,{text:text.slice(0,MAX_TEXT),consent:false},ctx,deps);
  if(!m.text)out.reply={...out.reply,text:'Thanks! I can only read text messages. Please type your question, or wait and a member of our team will reply.'};
  const columns={...out.columns,phone:null,external_ref:m.from,consent:true};
  try{if(isNew){const saved=await db('shop_assistant_conversations',{method:'POST',body:{...columns,channel:'whatsapp',external_hash:key}});row.id=saved?.[0]?.id;}else await db(`shop_assistant_conversations?id=eq.${row.id}`,{method:'PATCH',body:columns});}catch{continue;}
  if(out.escalation&&row.id)notifyHandoff({...row,...columns},out.escalation,deps).catch(()=>{});
  if(out.reply.text&&!out.reply.paused){const payloadOut=formatOutgoing(m.from,out.reply);if(payloadOut)await sendWhatsApp(payloadOut,deps);}
 }
 return reply(res,200,{ok:true});
}
