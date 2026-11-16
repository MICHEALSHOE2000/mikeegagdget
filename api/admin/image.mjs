import {db,env,reply,sameOrigin} from '../_shop.mjs';
import {requireAdmin} from './_auth.mjs';
import {cleanPhotos,primaryPhoto} from '../../commerce/product-photos.mjs';
import {createHash} from 'node:crypto';
import {recognise,recognitionConfigured} from '../../commerce/image-recognition.mjs';
// Product photos. Plain POST keeps the original single upload. kind=stage|staged|approve|cleanup is the Smart Image
// Upload workflow: photos go to a PRIVATE staging bucket and become public only when an administrator approves them.
const STAGING='product-staging',PUBLIC='catalogue-images',MAX=3000000,THUMB_MAX=400000;
const webp=(data,max)=>{if(typeof data!=='string'||data.length>max*1.4)return null;const b=Buffer.from(data,'base64');return b.length&&b.length<=max&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'?b:null;};
const storage=(path,init={})=>fetch(env('SUPABASE_URL')+'/storage/v1/'+path,{...init,headers:{Authorization:'Bearer '+env('SUPABASE_SERVICE_ROLE_KEY'),...init.headers},signal:AbortSignal.timeout(20000)});
const put=(bucket,name,bytes,upsert=false)=>storage(`object/${bucket}/${name}`,{method:'POST',headers:{'Content-Type':'image/webp','x-upsert':String(upsert)},body:bytes});
const text=(v,max)=>String(v??'').trim().slice(0,max);
const isHex=(v,n)=>typeof v==='string'&&new RegExp(`^[a-f0-9]{${n}}$`).test(v);
const SOURCES=new Set(['own','supplier','manufacturer','licensed']);

export async function stage(body,user){
 const image=webp(body?.data,MAX),thumb=webp(body?.thumb,THUMB_MAX);
 if(!image||!thumb)throw Object.assign(Error('Each photo must be a valid image under 3 MB.'),{status:400});
 if(!isHex(body.sha256,64)||!isHex(body.phash,16))throw Object.assign(Error('Missing photo fingerprint.'),{status:400});
 const existing=(await db('shop_image_uploads?sha256=eq.'+body.sha256+'&select=*'))[0];
 if(existing)return {...existing,duplicate:true};
 const s={...(body.suggestion||{})},key=body.sha256+'.webp';s.reasons=Array.isArray(s.reasons)?[...s.reasons]:[];
 // Optional photo recognition (only when an AI key is configured on the server). It is a hint: it can confirm or
 // question the file-name match, but it never raises a match to "high" on its own and never publishes anything.
 if(recognitionConfigured()&&!(Number(s.score)>=80)){try{
  const rows=await db('checkout_inventory?select=product_data->>slug,product_data->>model,product_data->colors&limit=1000'),map=new Map();
  for(const r of rows){if(!r.slug)continue;const p=map.get(r.slug)||{slug:r.slug,model:r.model||r.slug,colors:[]};for(const c of r.colors||[])if(!p.colors.includes(c))p.colors.push(c);map.set(r.slug,p);}
  const hint=await recognise(image,[...map.values()]);
  if(hint?.slug&&hint.slug===s.slug){s.score=Math.min(79,(Number(s.score)||0)+20);s.reasons.push('Photo recognition agrees with this product');}
  else if(hint?.slug&&!s.slug){s.slug=hint.slug;s.color=hint.color||'';s.score=hint.sure?65:50;s.reasons.push('Suggested by photo recognition only — compare carefully');}
  else if(hint?.slug){s.score=Math.min(Number(s.score)||0,60);s.reasons.push(`Photo recognition suggests ${map.get(hint.slug)?.model||hint.slug} instead — compare before approving`);}
 }catch{}}
 if(!(await put(STAGING,'full/'+key,image,true)).ok||!(await put(STAGING,'thumb/'+key,thumb,true)).ok)throw Object.assign(Error('Photo storage is unavailable.'),{status:503});
 // Staging only: no catalogue row is read or written here, whatever the suggestion's confidence.
 const row={sha256:body.sha256,image_sha256:createHash('sha256').update(image).digest('hex'),phash:body.phash,filename:text(body.filename,200),staging_path:'full/'+key,thumb_path:'thumb/'+key,width:Number(body.width)||null,height:Number(body.height)||null,bytes:image.length,
  suggested_slug:/^[a-z0-9-]{1,120}$/.test(s.slug||'')?s.slug:null,suggested_color:text(s.color,60)||null,suggested_storage:text(s.storage,20)||null,confidence:Math.max(0,Math.min(100,Math.round(Number(s.score)||0))),reasons:Array.isArray(s.reasons)?s.reasons.slice(0,8).map(r=>text(r,200)):[],status:'staged',created_by:user.id};
 return (await db('shop_image_uploads',{method:'POST',body:row}))[0];
}
async function signed(rows){
 const paths=rows.flatMap(r=>[r.thumb_path,r.staging_path]).filter(Boolean);if(!paths.length)return rows;
 const r=await storage(`object/sign/${STAGING}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expiresIn:3600,paths})});
 const list=r.ok?await r.json():[],url=p=>{const hit=list.find(x=>x.path===p);return hit?.signedURL?env('SUPABASE_URL')+'/storage/v1'+hit.signedURL:'';};
 return rows.map(row=>({...row,thumb_url:row.public_url||url(row.thumb_path),full_url:row.public_url||url(row.staging_path)}));
}
export async function approve(body,user){
 const id=text(body?.id,40),slug=text(body?.slug,120),color=text(body?.color,60),source=text(body?.source,20),licence=text(body?.licence,300);
 const skus=Array.isArray(body?.skus)?[...new Set(body.skus.map(s=>text(s,250)))]:[];
 if(body?.confirm!==true)throw Object.assign(Error('Approval must be confirmed by the administrator.'),{status:400});
 if(!/^[0-9a-f-]{36}$/.test(id)||!/^[a-z0-9-]{1,120}$/.test(slug)||!skus.length||skus.length>60||skus.some(s=>!s.startsWith(slug+'|')))throw Object.assign(Error('Choose the product and at least one of its variants.'),{status:400});
 if(!SOURCES.has(source)||!licence)throw Object.assign(Error('Record where the photo came from and the permission to use it before approving.'),{status:400});
 const upload=(await db('shop_image_uploads?id=eq.'+id+'&select=*'))[0];
 if(!upload||upload.status!=='staged')throw Object.assign(Error('This photo is not awaiting review.'),{status:409});
 const inventory=await db('checkout_inventory?select=sku,price_ngn,enabled,updated_at,product_data&sku=in.('+skus.map(s=>'"'+s.replace(/"/g,'\\"')+'"').join(',')+')');
 if(inventory.length!==skus.length)throw Object.assign(Error('One of the chosen variants no longer exists. Reload and try again.'),{status:409});
 // Publish one copy and link every chosen variant to it (no duplicated files).
 const name='products/'+upload.sha256+'.webp';
 const copy=await storage('object/copy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bucketId:STAGING,sourceKey:upload.staging_path,destinationBucket:PUBLIC,destinationKey:name})});
 if(!copy.ok&&copy.status!==409&&copy.status!==400)throw Object.assign(Error('Photo storage is unavailable.'),{status:503});
 const url=env('SUPABASE_URL')+'/storage/v1/object/public/'+PUBLIC+'/'+name,linked=[];
 for(const row of inventory){const d=row.product_data||{};
  const current=Array.isArray(d.images)&&d.images.length?d.images:d.image?[{url:d.image,source:'legacy',licence:'Existing catalogue image',color:'',approved:true,primary:true}]:[];
  if(current.some(p=>p.url===url)){linked.push(row.sku);continue;}
  const images=cleanPhotos([...current.map(p=>({...p,primary:body.primary===true?false:p.primary})),{url,source,licence,color,approved:true,primary:body.primary===true||!current.some(p=>p.approved)}]);
  await db('rpc/shop_admin_update_product',{method:'POST',body:{p_actor:user.id,p_sku:row.sku,p_price:row.price_ngn,p_enabled:row.enabled,p_updated_at:row.updated_at,p_data:{...d,images,image:primaryPhoto(images)}}});
  linked.push(row.sku);
 }
 return (await db('shop_image_uploads?id=eq.'+id,{method:'PATCH',body:{status:'approved',public_url:url,assigned_slug:slug,assigned_color:color||null,assigned_skus:linked,source,licence,reviewed_by:user.id,reviewed_at:new Date().toISOString()}}))[0];
}
export default async function handler(req,res){
 const kind=req.query?.kind||'';
 if(!['GET','POST','PATCH'].includes(req.method)||(req.method==='GET'&&kind!=='staged'))return reply(res,405,{error:'Method not allowed'});
 if(req.method!=='GET'&&!sameOrigin(req))return reply(res,403,{error:'Use the administrator page.'});
 let user;try{user=await requireAdmin(req);}catch(e){return reply(res,401,{error:e.message});}
 try{
  if(kind==='stage')return reply(res,200,await stage(req.body,user));
  if(kind==='staged'&&req.method==='GET'){const status=['staged','approved','rejected'].includes(req.query.status)?req.query.status:'staged';return reply(res,200,await signed(await db('shop_image_uploads?status=eq.'+status+'&select=*&order=created_at.desc&limit=500')));}
  if(kind==='staged'&&req.method==='PATCH'){const id=text(req.body?.id,40);if(!/^[0-9a-f-]{36}$/.test(id))return reply(res,400,{error:'Unknown photo.'});
   const patch=req.body?.status==='rejected'?{status:'rejected',reviewed_by:user.id,reviewed_at:new Date().toISOString()}:{suggested_slug:/^[a-z0-9-]{1,120}$/.test(req.body?.slug||'')?req.body.slug:null,suggested_color:text(req.body?.color,60)||null};
   return reply(res,200,(await db('shop_image_uploads?id=eq.'+id+'&status=eq.staged',{method:'PATCH',body:patch}))[0]||{});}
  if(kind==='approve')return reply(res,200,await approve(req.body,user));
  if(kind==='cleanup'){// Removes only staged files of photos rejected more than 30 days ago. Approved photos are never touched.
   const old=await db('shop_image_uploads?status=eq.rejected&reviewed_at=lt.'+new Date(Date.now()-30*864e5).toISOString()+'&select=id,staging_path,thumb_path&limit=200');
   if(old.length){await storage(`object/${STAGING}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:old.flatMap(r=>[r.staging_path,r.thumb_path])})});await db('shop_image_uploads?id=in.('+old.map(r=>r.id).join(',')+')',{method:'PATCH',body:{status:'deleted'}});}
   return reply(res,200,{removed:old.length});}
  if(req.method!=='POST'||kind)return reply(res,405,{error:'Method not allowed'});
  const bytes=webp(req.body?.data,2000000);if(!bytes)return reply(res,400,{error:'A valid WebP image under 2 MB is required.'});
  const name=crypto.randomUUID()+'.webp';if(!(await put(PUBLIC,name,bytes)).ok)throw Error();return reply(res,200,{url:env('SUPABASE_URL')+'/storage/v1/object/public/'+PUBLIC+'/'+name});
 }catch(e){return reply(res,e.status||503,{error:e.status?e.message:(kind?'Image service is unavailable. If this is the first use, apply the image-staging migration. Otherwise try again.':'Image upload is unavailable. Check catalogue storage setup.')});}
}
