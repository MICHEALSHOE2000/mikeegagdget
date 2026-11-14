import {db,reply,sameOrigin} from '../_shop.mjs';
import {requireAdmin} from './_auth.mjs';
import {validateDeals,validateHome} from '../../commerce/deals.mjs';
// One route for both administrator-published homepage selections (Hot Deals and featured products).
export default async function handler(req,res){
 if(!['GET','PUT'].includes(req.method))return reply(res,405,{error:'Method not allowed'});
 let user;try{user=await requireAdmin(req);}catch(e){return reply(res,401,{error:e.message});}
 const home=req.query?.kind==='home';
 try{
  if(req.method==='GET'){
   if(home){const row=(await db('shop_home_settings?id=eq.store&select=featured_slugs,revision'))[0];return reply(res,200,{slugs:row.featured_slugs,revision:row.revision});}
   return reply(res,200,(await db('shop_deal_settings?id=eq.store&select=skus,revision'))[0]);
  }
  if(!sameOrigin(req))return reply(res,403,{error:'Use the administrator page.'});
  if(home){
   let input;try{input=validateHome(req.body);}catch(e){return reply(res,400,{error:e.message});}
   return reply(res,200,await db('rpc/shop_publish_home',{method:'POST',body:{p_actor:user.id,p_slugs:input.slugs,p_revision:input.revision}}));
  }
  let input;try{input=validateDeals(req.body);}catch(e){return reply(res,400,{error:e.message});}
  const result=await db('rpc/shop_publish_hot_deals',{method:'POST',body:{p_actor:user.id,p_skus:input.skus,p_revision:input.revision}});
  return reply(res,200,result);
 }catch{return reply(res,409,{error:home?'Unable to publish. Reload featured products and check that every product is still in the catalogue. Another administrator may have changed them.':'Unable to publish. Reload deals and check that all selected variants are available, priced and have images. Another administrator may have changed them.'});}
}
