// Admin → Quick Update. POST {text} → proposed price/stock changes. This endpoint never saves anything:
// the administrator ticks the changes they want and the page applies them through /api/admin/manage, which checks
// the sign-in, rejects stale edits and records every change in the audit log.
import {db,reply,sameOrigin} from '../_shop.mjs';
import {requireAdmin} from './_auth.mjs';
import {buildProposal,indexInventory,aiRequest,aiRewrites,MAX_TEXT} from '../../commerce/quick-update.mjs';

export const aiEnabled=(env=process.env)=>env.MIKEE_AI_MODE==='openai'&&!!env.OPENAI_API_KEY;

/** Lines the rules could not read are rewritten by the cheapest model, then read by the same rules again. */
export async function withAi(text,inventory,{client,env=process.env}={}){
 const index=indexInventory(inventory);let items=buildProposal(text,inventory,{index});
 const unknown=items.map((it,i)=>({it,i})).filter(x=>x.it.unknown).slice(0,20);
 if(!unknown.length||!aiEnabled(env))return {items,ai:false};
 try{
  const api=client||new (await import('openai')).default({apiKey:env.OPENAI_API_KEY,timeout:12000,maxRetries:0});
  const res=await api.chat.completions.create({model:env.OPENAI_MODEL||'gpt-6-luna',messages:aiRequest(unknown.map(x=>x.it.text),index),response_format:{type:'json_object'},max_completion_tokens:700,reasoning_effort:env.OPENAI_REASONING_EFFORT||'none'});
  const rewrites=aiRewrites(res?.choices?.[0]?.message?.content||'',unknown.length);
  for(const {i,text:rewritten} of rewrites){
   const target=unknown[i].i,[again]=buildProposal(rewritten,inventory,{index});
   if(again&&!again.unknown)items[target]={...again,text:items[target].text,notes:[...(again.notes||[]),`Understood as “${rewritten}”`],ai:true};
  }
  return {items,ai:rewrites.length>0};
 }catch{return {items,ai:false};}
}

export default async function handler(req,res){
 if(req.method!=='POST')return reply(res,405,{error:'Method not allowed'});
 try{await requireAdmin(req);}catch(e){return reply(res,401,{error:e.message});}
 if(!sameOrigin(req))return reply(res,403,{error:'Use the administrator page.'});
 const text=typeof req.body?.text==='string'?req.body.text.trim():'';
 if(!text)return reply(res,400,{error:'Type the changes you want to make.'});
 if(text.length>MAX_TEXT)return reply(res,400,{error:'That message is too long. Send up to about 60 lines at a time.'});
 try{
  const inventory=await db('checkout_inventory?select=sku,price_ngn,enabled,product_data,updated_at&order=sku&limit=2000');
  return reply(res,200,await withAi(text,inventory));
 }catch{return reply(res,503,{error:'Could not read the catalogue. Try again in a moment.'});}
}
