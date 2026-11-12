import {db,reply} from '../_shop.mjs';
import {pricedVariant} from '../../commerce/deals.mjs';
export default async function handler(req,res){
 if(req.method!=='GET')return reply(res,405,{error:'Method not allowed'});
 try{const rows=await db('rpc/shop_deal_catalogue',{method:'POST',body:{}});return reply(res,200,rows.filter(r=>r.deal_position).sort((a,b)=>a.deal_position-b.deal_position).map(r=>pricedVariant(r,true)).filter(v=>v.deal));}
 catch{return reply(res,503,{error:'Deals are temporarily unavailable.'});}
}
