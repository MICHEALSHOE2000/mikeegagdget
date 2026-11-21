import {db,reply} from '../_shop.mjs';
import {financingStatus} from '../../commerce/financing-provider.mjs';
import {publicReview} from '../../commerce/reviews.mjs';
import {skuFilter} from '../../commerce/home-render.mjs';
import {seedRows} from '../../commerce/delivery-rates.mjs';
export default async function handler(req,res){
 // The sales assistant shares this function (/api/assistant rewrites here).
 if(req.query?.op==='assistant'){const {assistantHandler}=await import('../_assistant.mjs');return assistantHandler(req,res);}
 if(req.query?.op==='whatsapp'){const {whatsappHandler}=await import('../_ai-whatsapp.mjs');return whatsappHandler(req,res);}
 if(req.method!=='GET')return reply(res,405,{error:'Method not allowed'});
 let communityUrl='',featuredProducts=[],reviews={googleUrl:'',items:[]},holdHours=24,deliveryRates=null;
 try{const row=(await db('shop_settings?id=eq.store&select=*'))[0]||{};communityUrl=row.community_url||'';reviews.googleUrl=row.google_reviews_url||'';holdHours=Number(row.reservation_hold_hours)||24;}catch{}
 // Delivery prices are public (shown at checkout). The server recalculates them when the order is placed.
 try{deliveryRates=await db('shop_delivery_rates?select=scope,area,label,fee_ngn,enabled');}catch{deliveryRates=null;}
 if(!Array.isArray(deliveryRates)||!deliveryRates.length)deliveryRates=seedRows();
 try{featuredProducts=(await db('shop_home_settings?id=eq.store&select=featured_slugs'))[0]?.featured_slugs||[];}catch{}
 // Reviews exist only after the reviews table has been created and an administrator has published real ones.
 try{const rows=await db('shop_reviews?published=eq.true&select=display_name,body,rating,review_date,product_slug,photo_url,photo_consent,order_reference&order=review_date.desc.nullslast,created_at.desc&limit=60');
  const refs=[...new Set(rows.map(r=>r.order_reference).filter(Boolean))];let paid=new Set();
  if(refs.length)try{paid=new Set((await db('shop_orders?select=reference&status=eq.paid&reference='+encodeURIComponent(skuFilter(refs)))).map(o=>o.reference));}catch{}
  reviews.items=rows.map(r=>publicReview(r,paid));}catch{}
 return reply(res,200,{communityUrl,featuredProducts,financing:financingStatus(),reviews,holdHours,deliveryRates});
}
