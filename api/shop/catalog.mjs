import {db,reply} from '../_shop.mjs';
export default async function handler(req,res){
 if(req.method!=='GET')return reply(res,405,{error:'Method not allowed'});
 try{const rows=await db('checkout_inventory?select=sku,price_ngn,enabled,product_data&limit=1000');
 return reply(res,200,rows.filter(row=>row.product_data?.slug).map(row=>({...row.product_data,sku:row.sku,price:row.price_ngn===null?null:Number(row.price_ngn),enabled:row.enabled})));
 }catch{return reply(res,503,{error:'Catalogue updates are temporarily unavailable.'});}
}
