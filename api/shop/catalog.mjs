import {db,reply} from '../_shop.mjs';
import {pricedVariant} from '../../commerce/deals.mjs';
import {buildItems,feedXml,feedStats} from '../../commerce/merchant.mjs';
import pages from '../../commerce/merchant-products.mjs';

// Google Merchant Center product feed, served at /google-merchant-feed.xml (rewrite in vercel.json).
// Public catalogue data only. If Supabase is unavailable, or the feed would come out empty, it answers 503 so Google
// keeps the last good feed instead of receiving an empty one; the CDN may also keep serving its cached copy.
async function merchantFeed(res){
 let rows,rates;
 try{[rows,rates]=await Promise.all([db('rpc/shop_deal_catalogue',{method:'POST',body:{}}),db('shop_delivery_rates?select=fee_ngn,enabled')]);}
 catch{return unavailable(res,'The catalogue could not be read. Google keeps the previous feed.');}
 const result=buildItems(rows,{pages,rates});
 if(!result.items.length)return unavailable(res,'No eligible products right now. Google keeps the previous feed.');
 const generatedAt=new Date().toISOString(),stats=feedStats(result,rows);
 // Record the successful run for the admin dashboard; a failure here never blocks the feed.
 try{await db('shop_merchant_feed_status?on_conflict=id',{method:'POST',prefer:'resolution=merge-duplicates,return=minimal',body:{id:'google',generated_at:generatedAt,stats,updated_at:generatedAt}});}catch{}
 res.status(200).setHeader('Content-Type','application/xml; charset=utf-8').setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400').setHeader('X-Robots-Tag','noindex');
 return res.send(feedXml(result.items,{generatedAt}));
}
function unavailable(res,message){return res.status(503).setHeader('Content-Type','text/plain; charset=utf-8').setHeader('Cache-Control','no-store').setHeader('Retry-After','3600').send(message);}

export default async function handler(req,res){
 if(req.method!=='GET'&&req.method!=='HEAD')return reply(res,405,{error:'Method not allowed'});
 if(req.query?.format==='google')return merchantFeed(res);
 try{const rows=await db('rpc/shop_deal_catalogue',{method:'POST',body:{}});
 if(!rows.some(row=>row.product_data?.slug))return reply(res,503,{error:'Catalogue setup is pending.'});
 return reply(res,200,rows.filter(row=>row.product_data?.slug).map(row=>pricedVariant(row,!!row.deal_position)));
 }catch{return reply(res,503,{error:'Catalogue updates are temporarily unavailable.'});}
}
