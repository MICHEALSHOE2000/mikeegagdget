import {pricedVariant} from './deals.mjs';

export const modes=['Outright','Credit Direct instalments','Store pickup'];
export const conditions=['UK Used','Brand New','Either'];
export const timelines=['Today','This week','This month','Just browsing'];
export const uuid=value=>typeof value==='string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
export const short=(value,limit)=>typeof value==='string' && value.length<=limit && !/[\x00-\x1f]/.test(value);

export function product(row){
 const v=pricedVariant(row,Boolean(row.deal_position));
 if(!v.slug || !v.model || !v.enabled || v.reviewRequired || !Number.isSafeInteger(v.price) || v.price<=0)return null;
 const label=[v.model,v.capacity||v.storage,v.color,v.condition,v.connectivity,v.activation||v.activationStatus,v.ram].filter(Boolean).join(' · ');
 const stock=v.stockStatus==='in_stock' && v.stockQty===0?'out_of_stock':v.stockStatus;
 const colors=Array.isArray(v.colors)?v.colors.filter(c=>typeof c==='string'&&c.trim()):[];
 return {sku:v.sku,colors,label,price:v.price,stock:({in_stock:'In stock',out_of_stock:'Out of stock',backorder:'Backorder',preorder:'Preorder'})[stock]||'Confirm availability'};
}
const stops=new Set('a an the i am do you have is it in how much for price of please can get me want looking show cost does what available any tell about'.split(' '));
export function matches(items,query){
 const terms=(query.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(t=>!stops.has(t));
 if(!terms.length)return [];
 return items.filter(item=>{
  const words=[item.label,...item.colors].join(' ').toLowerCase().match(/[a-z]+|[0-9]+/g)||[];
  return terms.every(t=>(t.match(/[a-z]+|[0-9]+/g)||[]).every(w=>words.includes(w)));
 }).sort((a,b)=>a.price-b.price||a.label.localeCompare(b.label)).slice(0,12);
}
export function qualification(b){
 if(!uuid(b.id)||b.consent!==true||!short(b.query,180)||!short(b.sku,250)||!short(b.name,80)||!b.name.trim()||!short(b.contact,100)||!conditions.includes(b.condition)||!modes.includes(b.mode)||!timelines.includes(b.timeline)||!Number.isSafeInteger(b.budget)||b.budget<=0||b.budget>100000000)throw Error('Check your enquiry details.');
 return {query:b.query,condition:b.condition,mode:b.mode,timeline:b.timeline,budget:b.budget,name:b.name.trim(),contact:b.contact.trim()};
}
export function classify(enquiry,item){
 const intent=[40,30,15,0][timelines.indexOf(enquiry.timeline)]||0;
 const score=(item?25:0)+(item&&enquiry.budget>=item.price?25:0)+(enquiry.condition==='Either'?0:10)+intent;
 return {score,tier:score>=75?'hot':score>=45?'warm':'browsing'};
}
