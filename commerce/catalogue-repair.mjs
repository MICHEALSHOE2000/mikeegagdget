// Preserve legacy SKU keys; capacity and condition are independent display fields.
import apple from './apple-colors.json' with {type:'json'};
export const capacityOf = v => v.capacity || v.storage.split(/\s*·\s*/)[0];
export const wifiNotice = 'WiFi Only device: cellular calls, mobile data and SIM/eSIM service may be unavailable. Exact restrictions, activation status and supported functions must be confirmed for the individual device before purchase.';
export function repairCatalogue(source) {
 const items=source.map(p=>{
  if(p.category!=='iphones')return p;
  const series=Number(p.model.match(/iPhone (\d+)/)?.[1]);
  const colors=(apple.models[p.model==='iPhone 17 Air'?'iPhone Air':p.model]||[]).map(c=>c==='(PRODUCT)RED'?c:c.replace(/\b\w/g,x=>x.toUpperCase()));
  const condition=series===18?p.condition:'UK Used';
  const variants=p.variants.map(v=>{
   let cs=(v.color||'').split('/').filter(Boolean).map(c=>c.trim());
   if(series===17)cs=cs.map(c=>c==='Orange'?'Cosmic Orange':c==='Blue'?(p.model.includes('Pro')?'Deep Blue':'Mist Blue'):c);
   const ambiguous=series===18&&cs.some(c=>!colors.includes(c));
   return {...v,capacity:capacityOf(v),condition,color:cs.filter(c=>colors.includes(c)).join('/')||null,reviewRequired:ambiguous,enabled:!ambiguous,reviewNote:ambiguous?'Legacy Silver/Blue price requires confirmation for the exact finish.':''};
  });
  if(series===18)for(const capacity of [...new Set(variants.map(capacityOf))])for(const cond of ['Brand New','UK Used'])for(const color of colors){
   if(!variants.some(v=>v.capacity===capacity&&v.condition===cond&&v.color?.split('/').includes(color)))variants.push({storage:`${capacity} · ${color} · ${cond}`,capacity,condition:cond,color,price:null});
  }
  return {...p,condition,colors,variants};
 });
 // One WiFi catalogue model per model name; never inherit a cellular price.
 const seen=new Set();
 const wifi=items.filter(p=>p.category==='iphones'&&Number(p.model.match(/iPhone (\d+)/)?.[1])>=13).flatMap(p=>{
  if(seen.has(p.model))return [];seen.add(p.model);
  const peers=items.filter(x=>x.model===p.model&&x.category==='iphones');
  const capacities=[...new Set(peers.flatMap(x=>x.variants.map(capacityOf)))];
  const conditions=p.model.startsWith('iPhone 18 ')?['Brand New','UK Used']:['UK Used'];
  return [{...p,slug:p.slug.replace(/-uk-used$/,'')+'-wifi-only',legacySlug:null,model:p.model+' — WiFi Only',category:'wifi-only',description:wifiNotice,variants:capacities.flatMap(capacity=>conditions.flatMap(condition=>(p.colors.length?p.colors:['Colour to confirm']).map(color=>({storage:`${capacity} · ${color} · ${condition}`,capacity,condition,color,price:null,connectivity:'Wi-Fi Only'}))))}];
 });
 return [...items,...wifi];
}
