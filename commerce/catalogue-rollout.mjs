import licences from './licensed-image-sources.json' with {type:'json'};
import samsung from './samsung-image-sources.json' with {type:'json'};
import {dealPrice} from './deals.mjs';
import {planPrices} from './catalogue-completion.mjs';

const covers=new Map(Object.keys(licences).map(slug=>[slug,'/images/store/licensed/'+slug+'-720.webp']));
for(const source of samsung.sources){
 for(const slug of source.listings)if(!covers.has(slug))covers.set(slug,source.photos[0]?.assets?.['720']);
}
export function proposedImage(d){
 return !d.image&&!d.retired&&covers.get(d.slug)||'';
}
export function previewCatalogue(rows){
 const inventory=rows.map(row=>({sku:row.sku,price_ngn:row.originalPrice,product_data:row}));
 const plan=planPrices(inventory);
 const changes=new Map(plan.changes.filter(row=>!row.product).map(row=>[row.sku,row]));
 const samsungSku='samsung-s24-ultra|256GB';
 const includeSamsung=rows.filter(r=>r.deal).length===3&&!rows.some(r=>r.deal&&r.slug==='samsung-s24-ultra');
 return rows.map(row=>{
  const change=changes.get(row.sku);
  return {...row,image:row.image||proposedImage(row),
   ...(includeSamsung&&row.sku===samsungSku&&row.enabled&&row.originalPrice>0&&!row.reviewRequired&&row.stockStatus!=='out_of_stock'?{price:dealPrice(row.originalPrice),deal:true}:{}),
   ...(change?{price:change.price,originalPrice:change.price,calculation:change.calculation}:{})};
 }).concat(plan.changes.filter(row=>row.product).map(row=>({...row.product,originalPrice:row.price,deal:false})));
}
