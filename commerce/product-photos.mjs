// Photo records kept on each variant (product_data.images). A photo is published only when an administrator has
// approved it and recorded where it came from and the permission to use it.
export const PHOTO_SOURCES={own:'Mikee Gadget photo',supplier:'Supplier image (permission given)',manufacturer:'Manufacturer / authorised reseller asset',licensed:'Licensed stock image',legacy:'Existing catalogue image'};
const okUrl=u=>typeof u==='string'&&u.length<=2000&&(u.startsWith('/images/')||/^https:\/\//.test(u));
export function cleanPhotos(list){
 if(list===undefined||list===null)return null;
 if(!Array.isArray(list)||list.length>12)throw Error('Add up to 12 photos.');
 const seen=new Set(),out=[];
 for(const p of list){
  if(!p||!okUrl(p.url))throw Error('Each photo needs a local or HTTPS image address.');
  if(seen.has(p.url))continue;seen.add(p.url);
  const source=Object.hasOwn(PHOTO_SOURCES,p.source)?p.source:'',licence=String(p.licence||'').trim().slice(0,300),color=String(p.color||'').trim().slice(0,50),approved=p.approved===true;
  if(approved&&(!source||!licence))throw Error('Record the source and the permission note before approving a photo.');
  out.push({url:p.url,source,licence,color,approved,primary:p.primary===true&&approved});
 }
 const primary=out.find(p=>p.primary)||out.find(p=>p.approved);
 for(const p of out)p.primary=p===primary;
 return out;
}
export const primaryPhoto=photos=>photos?.find(p=>p.approved&&p.primary)?.url||photos?.find(p=>p.approved)?.url||'';
// The picture for a chosen colour: an approved photo assigned to that colour, otherwise the primary photo.
export const photoFor=(variant,color)=>variant?.images?.find(p=>p.approved&&p.color&&p.color===color)?.url||variant?.image||'';
