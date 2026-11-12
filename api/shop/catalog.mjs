import {db,reply} from '../_shop.mjs';
import {pricedVariant} from '../../commerce/deals.mjs';
export default async function handler(req,res){
 if(req.method!=='GET')return reply(res,405,{error:'Method not allowed'});
 try{const rows=await db('rpc/shop_deal_catalogue',{method:'POST',body:{}});
 if(!rows.some(row=>row.product_data?.slug))return reply(res,503,{error:'Catalogue setup is pending.'});
 return reply(res,200,rows.filter(row=>row.product_data?.slug).map(row=>pricedVariant(row,!!row.deal_position)));
 }catch{return reply(res,503,{error:'Catalogue updates are temporarily unavailable.'});}
}
