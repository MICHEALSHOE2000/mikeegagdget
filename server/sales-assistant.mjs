import {conversation} from './shop-conversation.mjs';
import {createHmac} from 'node:crypto';
import {db,env,reply,sameOrigin} from '../api/_shop.mjs';
import {product,matches,short,qualification,classify} from '../commerce/sales-assistant.mjs';
const take=(bucket,max,expires=null)=>db('rpc/shop_sales_take',{method:'POST',body:{p_bucket:bucket,p_max:max,p_expires:expires}});
async function terms(query){
 if(process.env.SALES_AI_APPROVED!=='true'||!process.env.OPENAI_API_KEY)return query;
 // Lifetime, shared across instances. Each attempted request consumes a slot even on timeout.
 if(!await take('ai-lifetime-v1',100))return query;
 try{
  const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',signal:AbortSignal.timeout(4000),headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4.1-nano',max_completion_tokens:32,store:false,messages:[{role:'system',content:'Extract device model and variant keywords from this shopping question. Use only words present in it. Return keywords only.'},{role:'user',content:query}]})});
  if(!r.ok)return query;
  const allowed=new Set(query.toLowerCase().match(/[a-z0-9]+/g));
  return ((await r.json()).choices?.[0]?.message?.content?.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(w=>allowed.has(w)).join(' ')||query;
 }catch{return query;}
}
export default async function handler(req,res){
 if(req.method!=='POST')return reply(res,405,{error:'Use POST.'});
 try{
  if(!sameOrigin(req))return reply(res,403,{error:'Open the store to continue.'});
  const b=req.body;
  const chat=['chat','handoff'].includes(b?.action);
  if(chat && (!req.headers['content-type']?.startsWith('application/json')||JSON.stringify(b).length>14000))return reply(res,400,{error:'Message too long.'});
  if(!chat && (!req.headers['content-type']?.startsWith('application/json')||!b||JSON.stringify(b).length>2500||!short(b.query,180)||!b.query.trim()||!['search','save'].includes(b.action)))return reply(res,400,{error:'Enter a short device question.'});
  let enquiry;
  if(b.action==='save'){try{enquiry=qualification(b);}catch{return reply(res,400,{error:'Check your enquiry details and consent.'});}}
  const hour=Math.floor(Date.now()/3600000);
  const ip=req.headers['x-vercel-forwarded-for']||req.socket?.remoteAddress||'unknown';
  const key=createHmac('sha256',env('SUPABASE_SERVICE_ROLE_KEY')).update(hour+'|'+ip).digest('hex');
  if(!await take(key,45,new Date((hour+2)*3600000).toISOString()))return reply(res,429,{error:'Too many requests. You can still contact the shop on WhatsApp.'});
  if(chat){
   let rows=[],available=false;
   if(b.action==='chat')try{rows=(await db('rpc/shop_deal_catalogue',{method:'POST',body:{}})).map(product).filter(Boolean);available=true;}catch{}
   const [status,result]=await conversation(b,{items:rows,available,db,take});return reply(res,status,result);
  }
  const items=(await db('rpc/shop_deal_catalogue',{method:'POST',body:{}})).map(product).filter(Boolean);
  if(!enquiry){
   let results=matches(items,b.query);
   if(!results.length && b.allowAI===true)results=matches(items,await terms(b.query));
   return reply(res,200,{results});
  }
  const item=items.find(v=>v.sku===b.sku);
  if(!item||b.quotedPrice!==item.price||(b.colour && !item.colors.includes(b.colour)))return reply(res,409,{error:'This variant changed. Search again before saving.'});
  await db('shop_sales_leads?on_conflict=id',{method:'POST',prefer:'resolution=ignore-duplicates',body:{id:b.id,consent_version:'sales-v1',enquiry:{...enquiry,colour:b.colour||'',item},...classify(enquiry,item)}});
  return reply(res,200,{saved:true});
 }catch{return reply(res,503,{error:'The assistant is temporarily unavailable. You can still use WhatsApp.'});}
}
