import {withOffer} from './offers.mjs';
// Pure inventory adapter shared by generators, search and transaction flows.
// Never infer SIM, network, activation or stock from a model name or photograph.
export const dimensions = ['storage','condition','sim','network','colour'];
export function normalizeOffer(item, variant) {
 const condition = variant.condition || item.condition || 'Unconfirmed';
 const activation = variant.activationStatus || (/\bNon-Active\b/i.test(variant.storage) ? 'Not Activated' : 'Unconfirmed');
 const normalizedCondition = condition === 'Brand New' ? `Brand New — ${activation === 'Not Activated' ? 'Non-Activated' : activation === 'Activated' ? 'Activated' : 'Activation unconfirmed'}` : /confirm/i.test(condition) ? 'Unconfirmed' : condition;
 return {...variant, id:variant.id || `${item.slug}|${variant.storage}`, legacyId:`${item.slug}|${variant.storage}`, slug:item.slug,
  model:item.model, brand:item.brand, category:item.category, image:variant.image || item.image || '',
  originalStorage:variant.storage, storage:variant.storage.split(/\s*[·—]\s*/)[0], condition:normalizedCondition,
  sim:variant.sim || item.sim || 'Other / Unconfirmed', network:variant.network || item.network || 'Unconfirmed',
  carrier:variant.carrier || item.carrier || '', restrictions:variant.restrictions || item.restrictions || '',
  colours:variant.color?.split('/').map(c=>c.trim()).filter(Boolean) || ['Unconfirmed'],
  availability:variant.stockStatus || item.stockStatus || 'Confirm availability',
  easy:item.isPhone === true, swap:item.isPhone === true};
}
export function buildFamilies(inventory) {
 const families=new Map();
 for(const item of inventory){
  const key=`${item.brand}|${item.model}`;
  if(!families.has(key))families.set(key,{id:key,slug:item.legacySlug || item.slug,model:item.model,brand:item.brand,category:item.category,image:item.image,route:item.isPhone?`/${item.legacySlug || item.slug}`:`/shop/device/${item.slug}/`,series:item.series || (item.model.match(/iPhone (\d+|SE|X[RS]?)/)?.[0] || item.model.match(/(?:Galaxy [SA]\d+|Pixel \d+)/)?.[0] || ''),easy:item.isPhone===true,swap:item.isPhone===true,variants:[]});
  const family=families.get(key);
  family.variants.push(...item.variants.map(v=>normalizeOffer(item,withOffer(v,item.slug))));
  family.conditions=[...new Set(family.variants.map(v=>v.condition))];
 }
 return [...families.values()];
}
export const isAvailable = offer => !/out.of.stock|unavailable|sold.out/i.test(offer.availability);
export function startingOffer(item){
 const priced=item.variants.filter(v=>v.price>0&&isAvailable(v));
 return (priced.filter(v=>v.network!=='Network Locked').length?priced.filter(v=>v.network!=='Network Locked'):priced).sort((a,b)=>a.price-b.price)[0];
}
const normalize=value=>String(value).toLowerCase().replace(/e[ -]sim/g,'esim').replace(/(\d)\s*(gb|tb)\b/g,'$1$2').replace(/[^a-z0-9]+/g,' ').trim();
const aliases={iph:'iphone',sam:'samsung',sg:'samsung',ukused:'uk used',bn:'brand new',bnib:'brand new',earbuds:'airpods earbuds audio',laptop:'laptops macbook',tablet:'tablets ipad',watch:'watches watch',gaming:'playstation ps5 games',accessory:'accessories'};
function closeWord(a,b){
 if(a.length<5||/\d/.test(a)||Math.abs(a.length-b.length)>1)return false;
 if(a.length===b.length){for(let k=0;k<a.length-1;k++)if(a[k]!==b[k]&&a.slice(0,k)+a[k+1]+a[k]+a.slice(k+2)===b)return true;}
 let i=0,j=0,edits=0;
 while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++edits>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}
 return edits+(a.length-i)+(b.length-j)<=1;
}
export function searchFamilies(families,query='',filters={}){
 const tokens=normalize(query).split(' ').filter(Boolean);
 return families.map(item=>{
  if(['brand','series','model'].some(key=>filters[key]&&item[key]!==filters[key]))return null;
  if(filters.category&&!(filters.category==='laptops'?['laptops','macbooks'].includes(item.category):item.category===filters.category))return null;
  const variants=item.variants.filter(v=>{
   if(['storage','sim','network','availability'].some(key=>filters[key]&&v[key]!==filters[key]))return false;
   if(filters.condition&&!(filters.condition==='Brand New'?v.condition.startsWith('Brand New'):v.condition===filters.condition))return false;
   if(filters.colour&&!v.colours.includes(filters.colour))return false;
   if(filters.connectivity&&v.connectivity!==filters.connectivity)return false;
   if(filters.budget&&filters.budget!=='all'){const [min,max]=filters.budget.split('-').map(Number);if(!(v.price>0&&v.price>=min&&v.price<max))return false;}
   const words=normalize([item.model,item.brand,item.category,item.series,v.originalStorage,v.condition,v.sim,v.network,...v.colours].join(' ')).split(' ');
   return tokens.every(token=>(aliases[token]||token).split(' ').some(t=>words.some(w=>w.startsWith(t)||closeWord(t,w))));
  });
  return variants.length?{...item,variants,conditions:[...new Set(variants.map(v=>v.condition))]}:null;
 }).filter(Boolean).sort((a,b)=>Number(normalize(b.model)===normalize(query))-Number(normalize(a.model)===normalize(query)));
}
export function compatibleOffers(offers,selection={}) {return offers.filter(v=>dimensions.every(key=>!selection[key]||(key==='colour'?v.colours.includes(selection[key]):v[key]===selection[key])));}
export function offerUrl(family,offer,method,colour){
 const params=new URLSearchParams({offer:offer.id,phone:offer.legacyId,condition:offer.condition});
 if(colour&&colour!=='Unconfirmed')params.set('color',colour);
 if(method==='swap')params.set('target',offer.legacyId);
 return `${method==='buy'?'/buy/':method==='easy'?'/easybuy/':method==='swap'?'/swap/':family.route}?${params}`;
}
export function offerMessage(offer,method='Product enquiry',colour){return ['Hello Mikee Gadget Plug,',`Buying method: ${method}`,`Model: ${offer.model}`,`Storage: ${offer.storage}`,`Condition: ${offer.condition}`,`SIM: ${offer.sim}`,`Network: ${offer.network}`,...(offer.carrier?[`Carrier: ${offer.carrier}`]:[]),...(offer.restrictions?[`Restrictions: ${offer.restrictions}`]:[]),`Colour: ${colour||'Unconfirmed'}`,`Displayed price: ${offer.price>0?'₦'+offer.price.toLocaleString('en-NG'):'Confirm price'}`,'Please confirm the exact unit, availability and final terms before payment.'].join('\n');}
