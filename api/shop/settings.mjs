import {db,reply} from '../_shop.mjs';
import {financingStatus} from '../../commerce/financing-provider.mjs';
export default async function handler(req,res){
 if(req.method!=='GET')return reply(res,405,{error:'Method not allowed'});
 let communityUrl='',featuredProducts=[];
 try{communityUrl=(await db('shop_settings?id=eq.store&select=community_url'))[0]?.community_url||'';}catch{}
 try{featuredProducts=(await db('shop_home_settings?id=eq.store&select=featured_slugs'))[0]?.featured_slugs||[];}catch{}
 return reply(res,200,{communityUrl,featuredProducts,financing:financingStatus()});
}
