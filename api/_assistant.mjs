// Mikee AI conversation service, shared by every channel (website now; WhatsApp prepared but disabled).
// Served at /api/assistant through the existing settings function (the Vercel plan has no room for another one).
//
// Modes (server environment, never the browser):
//   MIKEE_AI_MODE=simulation (default) → rule-based simulator. No OpenAI request is ever made and the SDK is not loaded.
//   MIKEE_AI_MODE=openai              → OpenAI with catalogue tools, only when OPENAI_API_KEY is set and the budget
//                                        allows. If it fails, the free simulator answers instead; never the reverse.
// Prices, stock and policies always come from Supabase and the knowledge base through commerce/assistant.mjs.
import {createHash,randomBytes} from 'node:crypto';
import {db,reply,sameOrigin} from './_shop.mjs';
import {buildCatalogue,unpricedProducts,knowledgeMap,simulate,initialState,leadStatus,scoreLead,cleanText,whatsappUrl,parsePhone,parseEmail,
 CONSENT_VERSION,MAX_TEXT,PAYMENT,TIMELINE,WHATSAPP_NUMBER} from '../commerce/assistant.mjs';
import pages from '../commerce/merchant-products.mjs';
import {seedRows} from '../commerce/delivery-rates.mjs';

const num=(k,d)=>{const v=Number(process.env[k]);return Number.isFinite(v)&&v>0?v:d;};
export const LIMITS={
 messagesPerConversation:60,ipMessagesPer10Min:30,ipNewChatsPerHour:8,storeMessagesPerHour:3000,transcript:80,
 aiCallsPerConversation:20,contextMessages:12,
 get maxOutputTokens(){return Math.min(num('OPENAI_MAX_OUTPUT_TOKENS',600),1000);},
 get aiCallsPerDay(){return num('MIKEE_AI_DAILY_CALLS',400);},
 get monthlyBudgetNgn(){return num('MIKEE_AI_MONTHLY_BUDGET_NGN',8000);},
};
export const WA_LINK='https://wa.me/'+WHATSAPP_NUMBER;
/** The active mode. Anything other than exactly "openai" is simulation. */
export const aiMode=()=>process.env.MIKEE_AI_MODE==='openai'?'openai':'simulation';
// Conservative cost estimate (over-estimates on purpose so the cap trips early). Override with the real rates.
export const costNgn=(input,output)=>(input*num('OPENAI_INPUT_USD_PER_M',0.5)+output*num('OPENAI_OUTPUT_USD_PER_M',2))/1e6*num('USD_NGN_RATE',1700);
export const sha=s=>createHash('sha256').update(String(s)).digest('hex');
export const salt=()=>process.env.MIKEE_AI_HASH_SALT||sha('mikee-ai:'+(process.env.SUPABASE_SERVICE_ROLE_KEY||''));
const clientIp=req=>String(req.headers['x-forwarded-for']||req.headers['x-real-ip']||'').split(',')[0].trim()||'unknown';
export const hit=(key,limit,seconds)=>db('rpc/shop_assistant_hit',{method:'POST',body:{p_key:key,p_limit:limit,p_window_seconds:seconds}});
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// ---- Catalogue and knowledge (cached briefly; prices change only through Admin) ----
let cache={at:0};
export const clearCache=()=>{cache={at:0};};
export async function context(){
 if(cache.catalogue&&Date.now()-cache.at<60*1000)return cache;
 const [rows,rates,knowledge]=await Promise.all([
  db('rpc/shop_deal_catalogue',{method:'POST',body:{}}),
  db('shop_delivery_rates?select=scope,area,label,fee_ngn,enabled').catch(()=>seedRows()),
  db('shop_assistant_knowledge?select=key,title,content,status,updated_at').catch(()=>[])]);
 const catalogue=buildCatalogue(rows,pages);if(!catalogue.length)throw Error('empty catalogue');
 cache={at:Date.now(),catalogue,unpriced:unpricedProducts(catalogue,pages),kb:knowledgeMap(knowledge),rates:Array.isArray(rates)&&rates.length?rates:seedRows()};
 return cache;
}

// ---- Budget guard for the paid provider ----
export async function budgetAllows(){
 try{
  const usage=await db('shop_assistant_usage?select=day,llm_calls,cost_ngn&order=day.desc&limit=31');
  const today=new Date(Date.now()+3600e3).toISOString().slice(0,10),month=today.slice(0,7);
  const spent=usage.filter(u=>String(u.day).startsWith(month)).reduce((a,u)=>a+Number(u.cost_ngn||0),0),calls=usage.find(u=>String(u.day)===today)?.llm_calls||0;
  if(spent>=LIMITS.monthlyBudgetNgn)return {ok:false,reason:'monthly budget reached'};
  if(calls>=LIMITS.aiCallsPerDay)return {ok:false,reason:'daily limit reached'};
  return {ok:true};
 }catch{return {ok:false,reason:'usage unavailable'};}
}
export async function recordUsage(input,output){try{await db('rpc/shop_assistant_record_usage',{method:'POST',body:{p_input:input|0,p_output:output|0,p_cost_ngn:Number(costNgn(input||400,output||150).toFixed(2))}});}catch{}}

/**
 * Produce the assistant's answer for one customer message. Channel-agnostic.
 * deps.openai lets tests inject a fake client; in simulation mode it is never used.
 */
export async function respond(row,text,ctx,deps={}){
 const state={...initialState(),...(row.state||{})};
 if(row.ai_paused)return {state,provider:'paused',reply:{text:row.state?.pausedNoticeSent?'':'Thanks — a member of our team is handling this chat and will reply here shortly.',cards:[],suggestions:[],handoff:false,paused:true},escalation:null,aiCalls:0};
 const sim=()=>({...simulate(state,text,ctx),provider:'simulation',aiCalls:0});
 if(aiMode()!=='openai'||!process.env.OPENAI_API_KEY)return sim();
 if((row.llm_calls||0)>=LIMITS.aiCallsPerConversation)return sim();
 const budget=await budgetAllows();if(!budget.ok)return sim();
 try{
  const {openaiRespond}=await import('./_ai-openai.mjs');
  const r=await openaiRespond({state,text,history:(row.transcript||[]).slice(-LIMITS.contextMessages)},ctx,{client:deps.openai,maxTokens:LIMITS.maxOutputTokens,onUsage:recordUsage});
  if(r?.reply)return {...r,provider:'openai'};
  return {...sim(),aiCalls:r?.aiCalls||0,provider:'simulation-fallback'};
 }catch{return {...sim(),provider:'simulation-fallback'};}
}

// ---- Lead record ----
const redact=t=>String(t).replace(/(?:\+?234|0)[789][01][\d\s-]{8,11}/g,'[phone number]').replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,'[email]');
export function leadColumns(state,catalogue,row={}){
 const p=catalogue.find(x=>x.slug===state.product);
 const auto=leadStatus(state),keep=row.status_source==='admin'||['converted','closed'].includes(row.status);
 return {product_slug:p?.slug||null,product_label:p?.model||null,storage_pref:state.storage?String(state.storage).toUpperCase():null,condition_pref:state.condition||null,budget_ngn:state.budget||null,
  payment_pref:state.payment?PAYMENT[state.payment]:null,delivery_location:state.location||null,timeline:state.timeline?TIMELINE[state.timeline]:null,customer_name:state.name||null,
  phone:state.consent?state.phone||null:null,email:state.consent?state.email||null:null,consent:!!state.consent,...(state.consent?{consent_version:CONSENT_VERSION}:{}),
  score:scoreLead(state),...(keep?{}:{status:auto})};
}
const ESCALATE={requested:'Customer asked for a person',complaint:'Complaint',payment_dispute:'Payment dispute',price_review:'Price review requested',unsupported:'Assistant could not answer'};

// Alert the owner once per conversation by email, when email is configured (RESEND_API_KEY). No customer contact
// details go in the email; the admin opens the inbox to see the chat.
export async function notifyHandoff(row,reason,{fetcher}={}){
 if(row.handoff_notified_at)return {status:'already'};
 try{
  const {sendEmail,ADMIN_NOTIFY}=await import('../commerce/email.mjs');
  const ref=String(row.id).slice(0,8).toUpperCase(),site=process.env.SITE_URL||'https://www.mikeegadget.com.ng';
  const msg=`Mikee AI handed a ${row.channel||'website'} chat to the team.\n\nReason: ${ESCALATE[reason]||reason}\nChat reference: ${ref}\nProduct: ${row.product_label||'not stated'}\n\nOpen ${site}/admin/ → Mikee AI to read and reply.`;
  const r=await sendEmail({to:ADMIN_NOTIFY(),subject:`Mikee AI: customer needs a person (${ref})`,text:msg,html:`<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${msg.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</pre>`},fetcher);
  if(r.status==='accepted')await db(`shop_assistant_conversations?id=eq.${row.id}`,{method:'PATCH',body:{handoff_notified_at:new Date().toISOString()}}).catch(()=>{});
  return r;
 }catch{return {status:'failed'};}
}

/** Apply one customer message to a stored conversation row and return what to save and show. */
export async function processMessage(row,{text,consent},ctx,deps={}){
 const now=new Date().toISOString();
 const state0={...(row.state||{})};
 // Contact details are kept only after the customer ticks the consent box.
 if(consent===true&&(parsePhone(text)||parseEmail(text))){state0.consent=true;state0.consentAt=state0.consentAt||now;}
 const result=await respond({...row,state:state0},text,ctx,deps);
 const state={...result.state,ref:row.id?String(row.id).slice(0,8).toUpperCase():''};
 if(state0.consent){state.consent=true;const ph=parsePhone(text),em=parseEmail(text);if(ph)state.phone=ph;if(em)state.email=em;}
 if(result.reply.paused)state.pausedNoticeSent=true;
 const escalation=result.escalation==='requested'&&/\bprice\b/i.test(text)?'price_review':result.escalation;
 const esc=['requested','complaint','payment_dispute','price_review'].includes(escalation)?escalation:null;
 if(esc)state.wantsHuman=true;
 const seq=(Array.isArray(row.transcript)?row.transcript:[]).reduce((m,x)=>Math.max(m,x.n||0),0);
 const customerText=state.consent?text:redact(text);
 const lines=[{n:seq+1,from:'customer',text:customerText.slice(0,MAX_TEXT),at:now}];
 if(result.reply.text)lines.push({n:seq+2,from:'assistant',text:result.reply.text.slice(0,3000),cards:(result.reply.cards||[]).map(c=>({name:c.name,sku:c.sku,priceText:c.priceText})),provider:result.provider,at:now});
 const transcript=[...(Array.isArray(row.transcript)?row.transcript:[]),...lines].slice(-LIMITS.transcript);
 const columns={...leadColumns(state,ctx.catalogue,row),state,transcript,message_count:(row.message_count||0)+1,last_customer_at:now,updated_at:now,
  unread_count:(row.unread_count||0)+1,provider:result.provider,llm_calls:(row.llm_calls||0)+(result.aiCalls||0),
  ...(state.consent&&!row.consent?{consent_at:now}:{}),
  ...(esc?{needs_attention:true,escalation_reason:ESCALATE[esc],handoff_at:row.handoff_at||now}:{})};
 return {columns,state,reply:result.reply,provider:result.provider,escalation:esc,lastSeq:lines[lines.length-1].n};
}

const errorBody=(error,extra={})=>({error,whatsapp:WA_LINK,...extra});
const publicLines=(transcript,since)=>(Array.isArray(transcript)?transcript:[]).filter(x=>x.n>since&&x.from==='staff').map(x=>({n:x.n,from:'staff',text:x.text,at:x.at}));

export async function assistantHandler(req,res,deps={}){
 if(req.method!=='POST')return reply(res,405,{error:'Method not allowed'});
 if(!sameOrigin(req))return reply(res,403,{error:'Use the chat on our website.'});
 const body=req.body&&typeof req.body==='object'&&!Array.isArray(req.body)?req.body:{};
 if(body.website)return reply(res,400,{error:'Invalid request.'}); // honeypot: real visitors never fill it
 const action=['message','poll','handoff','start'].includes(body.action)?body.action:'message';
 if(typeof body.text==='string'&&body.text.length>MAX_TEXT*2)return reply(res,413,errorBody(`Please keep messages under ${MAX_TEXT} characters.`));
 const text=cleanText(body.text);
 if(action==='message'&&!text)return reply(res,400,{error:'Type a message first.'});
 const ipKey='ip:'+sha(salt()+clientIp(req)).slice(0,32);
 try{
  const lim=action==='poll'?[await hit(ipKey+':poll',120,600)]:[await hit(ipKey,LIMITS.ipMessagesPer10Min,600),await hit('store',LIMITS.storeMessagesPerHour,3600)];
  if(lim.some(ok=>!ok))return reply(res,429,errorBody('You’re sending messages very quickly. Please wait a few minutes, or chat with us on WhatsApp.'));
 }catch{return reply(res,503,errorBody('Mikee AI is unavailable right now. Please chat with us on WhatsApp.'));}

 // Load this browser's conversation. The browser holds a random token; only its hash is stored, and a
 // conversation is only ever returned to the token that created it.
 let row=null;
 const known=typeof body.conversationId==='string'&&ID.test(body.conversationId)&&typeof body.token==='string'&&/^[0-9a-f]{64}$/.test(body.token);
 if(known){try{row=(await db(`shop_assistant_conversations?id=eq.${body.conversationId}&token_hash=eq.${sha(body.token)}&channel=eq.website&select=id,channel,state,transcript,message_count,llm_calls,consent,status,status_source,handoff_at,handoff_notified_at,ai_paused,unread_count,product_label`))[0]||null;}catch{return reply(res,503,errorBody('Mikee AI is unavailable right now. Please chat with us on WhatsApp.'));}}
 if(action==='poll'){
  if(!row)return reply(res,404,{error:'Conversation not found.'});
  const since=Number.isSafeInteger(body.since)?body.since:0;
  return reply(res,200,{messages:publicLines(row.transcript,since),paused:!!row.ai_paused});
 }
 if(action==='handoff'){
  if(row){try{await db(`shop_assistant_conversations?id=eq.${row.id}`,{method:'PATCH',body:{handoff_at:row.handoff_at||new Date().toISOString(),needs_attention:true,escalation_reason:ESCALATE.requested,state:{...row.state,wantsHuman:true},...(row.status_source==='admin'?{}:{status:'needs_human'}),updated_at:new Date().toISOString()}});}catch{}
   notifyHandoff(row,'requested',deps).catch(()=>{});}
  return reply(res,200,{ok:true});
 }
 let ctx;try{ctx=await context();}catch{return reply(res,503,errorBody('Our catalogue can’t be reached right now. Please chat with us on WhatsApp.'));}
 if(action==='start'){
  // Opening message. On a product page the greeting mentions that product (from the catalogue, not the page).
  const slug=typeof body.productSlug==='string'&&/^[a-z0-9-]{1,120}$/.test(body.productSlug)?body.productSlug:null;
  const p=slug&&ctx.catalogue.find(x=>x.slug===slug);
  return reply(res,200,{mode:aiMode(),reply:{text:p?`Hi! I’m Mikee AI, the virtual shopping assistant for Mikee Gadget Plug. Got a question about the ${p.model} — price, storage, UK Used or Brand New, delivery or Pay Small Small? Just ask.`:'Hi! I’m Mikee AI, the virtual shopping assistant for Mikee Gadget Plug. Ask me about any phone, tablet, watch or gadget — prices, storage, UK Used or Brand New, delivery or Pay Small Small.',
   cards:[],suggestions:p?[`How much is the ${p.model}?`,'Delivery fee','Pay Small Small']:['Phones under ₦400k','How much is iPhone 15 Pro Max?','UK Used or Brand New?'],handoff:false},productSlug:p?.slug||null});
 }
 let token=null;
 if(!row){
  try{if(!(await hit(ipKey+':new',LIMITS.ipNewChatsPerHour,3600)))return reply(res,429,errorBody('Too many new chats from this connection. Please try again later or chat with us on WhatsApp.'));}catch{}
  token=randomBytes(32).toString('hex');
  const slug=typeof body.productSlug==='string'&&/^[a-z0-9-]{1,120}$/.test(body.productSlug)?body.productSlug:null;
  const p=slug&&ctx.catalogue.find(x=>x.slug===slug);
  row={id:null,channel:'website',state:{...initialState(),...(p?{product:p.slug,category:p.category}:{})},transcript:[],message_count:0,llm_calls:0,unread_count:0};
 }
 if(row.message_count>=LIMITS.messagesPerConversation)return reply(res,429,errorBody('This chat has reached its limit. Please continue on WhatsApp — our team will help you there.'));
 const out=await processMessage(row,{text,consent:body.consent===true},ctx,deps);
 let id=row.id;
 try{
  if(id)await db(`shop_assistant_conversations?id=eq.${id}`,{method:'PATCH',body:out.columns});
  else{const saved=await db('shop_assistant_conversations',{method:'POST',body:{...out.columns,channel:'website',token_hash:sha(token),ip_hash:ipKey,source_page:typeof body.page==='string'?body.page.replace(/[^\w/.-]/g,'').slice(0,200):null}});id=saved?.[0]?.id;}
 }catch{return reply(res,503,errorBody('Your message couldn’t be saved. Please chat with us on WhatsApp.'));}
 if(out.escalation&&id)notifyHandoff({...row,...out.columns,id},out.escalation,deps).catch(()=>{});
 const state={...out.state,ref:id?String(id).slice(0,8).toUpperCase():''};
 return reply(res,200,{conversationId:id,...(token?{token}:{}),mode:aiMode(),lastSeq:out.lastSeq,
  reply:{...out.reply,whatsapp:whatsappUrl(state,ctx.catalogue)}});
}
