import {reply} from '../../_shop.mjs';
export const creditDirectConfigured=()=>process.env.CREDIT_DIRECT_ENABLED==='true'&&
 !!process.env.CREDIT_DIRECT_PUBLIC_KEY&&!!process.env.CREDIT_DIRECT_PRIVATE_KEY&&
 !!process.env.CREDIT_DIRECT_WEBHOOK_SECRET;
export default async function handler(req,res){
 if(req.method!=='GET')return reply(res,405,{error:'Method not allowed'});
 return reply(res,200,{available:creditDirectConfigured(),isLive:creditDirectConfigured()&&process.env.CREDIT_DIRECT_IS_LIVE==='true'});
}
