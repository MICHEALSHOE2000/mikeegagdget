import {db,reply} from '../_shop.mjs';
import {financingStatus} from '../../commerce/financing-provider.mjs';
export default async function handler(req,res){if(req.method!=='GET')return reply(res,405,{error:'Method not allowed'});try{const rows=await db('shop_settings?id=eq.store&select=community_url');return reply(res,200,{communityUrl:rows[0]?.community_url||'',financing:financingStatus()});}catch{return reply(res,200,{communityUrl:'',financing:financingStatus()});}}
