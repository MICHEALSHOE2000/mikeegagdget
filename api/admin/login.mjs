import {env,reply,sameOrigin} from '../_shop.mjs';
import {ADMIN_EMAIL} from './_auth.mjs';
export default async function handler(req,res){
 if(req.method!=='POST')return reply(res,405,{error:'Method not allowed'});
 try{
  if(!sameOrigin(req))return reply(res,403,{error:'Use the administrator sign-in page.'});
  if(String(req.body?.email||'').trim().toLowerCase()!==ADMIN_EMAIL)return reply(res,403,{error:'Use the configured administrator email.'});
  const redirect=new URL('/admin/',env('SHOP_ORIGIN')).href;
  const r=await fetch(env('SUPABASE_URL')+'/auth/v1/otp?redirect_to='+encodeURIComponent(redirect),{method:'POST',headers:{apikey:(process.env.SUPABASE_PUBLISHABLE_KEY||env('SUPABASE_SERVICE_ROLE_KEY')),'Content-Type':'application/json'},body:JSON.stringify({email:ADMIN_EMAIL,create_user:true}),signal:AbortSignal.timeout(15000)});
  if(!r.ok)return reply(res,503,{error:'Sign-in email could not be sent. Check email delivery settings or try again later.'});
  return reply(res,200,{message:'Check your email for your secure sign-in link.'});
 }catch{return reply(res,503,{error:'Administrator sign-in is not configured yet.'});}
}
