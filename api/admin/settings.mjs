import {db,reply,sameOrigin} from '../_shop.mjs';
import {requireAdmin} from './_auth.mjs';
import {validateReview,validGoogleReviewsUrl} from '../../commerce/reviews.mjs';
const SETUP='Reviews are not set up yet: the reviews database migration has not been applied.';
// Store settings, plus (kind=reviews) administrator-entered customer testimonials.
export default async function handler(req,res){
 let user;try{user=await requireAdmin(req);}catch(e){return reply(res,401,{error:e.message});}
 const reviews=req.query?.kind==='reviews';
 try{
  if(req.method==='GET'){
   if(reviews){try{return reply(res,200,await db('shop_reviews?select=*&order=created_at.desc&limit=200'));}catch{return reply(res,503,{error:SETUP});}}
   return reply(res,200,(await db('shop_settings?id=eq.store'))[0]||{});
  }
  if(!['PATCH','POST'].includes(req.method))return reply(res,405,{error:'Method not allowed'});
  if(!sameOrigin(req))return reply(res,403,{error:'Use the administrator page.'});
  if(reviews){
   const row=validateReview(req.body);
   try{
    if(req.method==='POST')return reply(res,200,(await db('shop_reviews',{method:'POST',body:{...row,created_by:user.id}}))[0]);
    const id=String(req.body?.id||'');if(!/^[0-9a-f-]{36}$/.test(id))throw Error('Unknown review.');
    return reply(res,200,(await db('shop_reviews?id=eq.'+id,{method:'PATCH',body:{...row,updated_at:new Date().toISOString()}}))[0]||{});
   }catch(e){return reply(res,e.message==='Unknown review.'?400:503,{error:e.message==='Unknown review.'?e.message:SETUP});}
  }
  if(req.method!=='PATCH')return reply(res,405,{error:'Method not allowed'});
  const url=String(req.body?.communityUrl||'').trim();
  if(url){const u=new URL(url);if(u.protocol!=='https:'||u.hostname!=='chat.whatsapp.com'||u.pathname==='/')throw Error('Enter an official WhatsApp community invite URL.');}
  const notes=String(req.body?.financingNotes||'').slice(0,2000);
  const google=validGoogleReviewsUrl(req.body?.googleReviewsUrl);
  const base={community_url:url,financing_notes:notes,updated_at:new Date().toISOString()};
  // The Google link column arrives with the reviews migration; other settings still save before it is applied.
  try{await db('shop_settings?id=eq.store',{method:'PATCH',body:{...base,google_reviews_url:google}});return reply(res,200,{saved:true});}
  catch{await db('shop_settings?id=eq.store',{method:'PATCH',body:base});return reply(res,200,{saved:true,note:google?'Saved, except the Google reviews link: '+SETUP:''});}
 }catch(e){return reply(res,400,{error:e.message});}
}
