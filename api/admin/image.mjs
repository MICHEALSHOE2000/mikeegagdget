import {env,reply,sameOrigin} from '../_shop.mjs';
import {requireAdmin} from './_auth.mjs';
export default async function handler(req,res){
 if(req.method!=='POST')return reply(res,405,{error:'Method not allowed'});
 if(!sameOrigin(req))return reply(res,403,{error:'Use the administrator page.'});
 try{await requireAdmin(req);}catch(e){return reply(res,401,{error:e.message});}
 const {data}=req.body||{};
 if(typeof data!=='string'||data.length>2800000)return reply(res,400,{error:'Upload a WebP image under 2 MB.'});
 const bytes=Buffer.from(data,'base64');
 if(bytes.length>2000000||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')return reply(res,400,{error:'A valid WebP image under 2 MB is required.'});
 try{const name=crypto.randomUUID()+'.webp',base=env('SUPABASE_URL');const r=await fetch(base+'/storage/v1/object/catalogue-images/'+name,{method:'POST',headers:{Authorization:'Bearer '+env('SUPABASE_SERVICE_ROLE_KEY'),'Content-Type':'image/webp','x-upsert':'false'},body:bytes});if(!r.ok)throw Error();return reply(res,200,{url:base+'/storage/v1/object/public/catalogue-images/'+name});}catch{return reply(res,503,{error:'Image upload is unavailable. Check catalogue storage setup.'});}
}
