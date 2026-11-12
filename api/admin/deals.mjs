import {db,reply,sameOrigin} from '../_shop.mjs';
import {requireAdmin} from './_auth.mjs';
import {validateDeals} from '../../commerce/deals.mjs';
export default async function handler(req,res){
 if(!['GET','PUT'].includes(req.method))return reply(res,405,{error:'Method not allowed'});
 let user;try{user=await requireAdmin(req);}catch(e){return reply(res,401,{error:e.message});}
 try{
  if(req.method==='GET')return reply(res,200,(await db('shop_deal_settings?id=eq.store&select=skus,revision'))[0]);
  if(!sameOrigin(req))return reply(res,403,{error:'Use the administrator page.'});
  let input;try{input=validateDeals(req.body);}catch(e){return reply(res,400,{error:e.message});}
  const result=await db('rpc/shop_publish_deals',{method:'POST',body:{p_actor:user.id,p_skus:input.skus,p_revision:input.revision}});
  return reply(res,200,result);
 }catch{return reply(res,409,{error:'Unable to publish. Reload deals and check that all selected variants are available, priced and have images. Another administrator may have changed them.'});}
}
