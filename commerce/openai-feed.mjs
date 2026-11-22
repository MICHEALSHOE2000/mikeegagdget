// ChatGPT (OpenAI) product feed, built from the same eligible items as the Google Merchant Center feed, so prices,
// availability and exclusions are identical. Follows OpenAI's product feed spec (developers.openai.com/commerce):
// one JSON object per line (JSONL), one row per purchasable variant, required discovery fields on every row.
// Served at /openai-product-feed.jsonl. It is NOT uploaded anywhere: OpenAI onboarding is by application
// (chatgpt.com/merchants) and needs the owner's approval.
import {SITE,STORE_NAME} from './merchant.mjs';

const AVAILABILITY={in_stock:'in_stock',out_of_stock:'out_of_stock',preorder:'pre_order',backorder:'backorder'};
const CONDITION={new:'new',used:'used',refurbished:'refurbished'};
// Two decimals, no thousands separators, then the ISO code: "846000.00 NGN".
export const money=n=>`${Number(n).toFixed(2)} NGN`;
export const REQUIRED=['item_id','title','description','url','brand','seller_name','image_url','availability','price','target_countries','store_country'];

/** One OpenAI row per eligible Google item. Rows that can't meet the spec are returned in `excluded` with a reason. */
export function openaiRows(items){
 const rows=[],excluded=[];
 const groups=new Map();for(const i of items)(groups.get(i.slug)||groups.set(i.slug,[]).get(i.slug)).push(i);
 for(const i of items){
  const availability=AVAILABILITY[i.availability],condition=CONDITION[i.googleCondition];
  const reasons=[];if(!availability)reasons.push('Availability not in the OpenAI list');if(!condition)reasons.push('Condition not confirmed');
  if(!(i.price>0))reasons.push('No valid price');if(!/^https:\/\//.test(i.image||''))reasons.push('No public image');
  if(reasons.length){excluded.push({item_id:i.id,sku:i.sku,title:i.title,reasons});continue;}
  const siblings=groups.get(i.slug),variants=siblings.length>1;
  const variant_dict=Object.fromEntries([['storage',i.size],['color',i.colour],['condition',i.condition]].filter(([,v])=>v));
  const row={item_id:i.id,title:i.title,description:i.description,url:i.url,brand:i.brand,seller_name:STORE_NAME,image_url:i.image,
   availability,price:money(i.price),target_countries:['NG'],store_country:'NG',condition,
   ...(i.salePrice&&i.salePrice<i.price?{sale_price:money(i.salePrice)}:{}),
   ...(i.additionalImages?.length?{additional_image_urls:i.additionalImages}:{}),
   ...(i.productType?{product_category:i.productType}:{}),
   ...(i.gtin?{gtin:i.gtin}:{}),...(i.mpn?{mpn:i.mpn}:{}),...(i.colour?{color:i.colour}:{}),
   ...(variants?{group_id:i.slug,listing_has_variations:true,variant_dict}:{}),
   seller_url:`${SITE}/`,seller_privacy_policy:`${SITE}/privacy-policy/`,seller_tos:`${SITE}/terms/`,return_policy:`${SITE}/returns-refunds/`,
   is_eligible_search:true,is_eligible_checkout:false};
  rows.push(row);
 }
 return {rows,excluded};
}
export const toJsonl=rows=>rows.map(r=>JSON.stringify(r)).join('\n')+(rows.length?'\n':'');

/** Checks one row against the spec rules we rely on. Returns a list of problems (empty = valid). */
export function validateRow(r){
 const p=[];
 for(const k of REQUIRED)if(r[k]===undefined||r[k]===''||(Array.isArray(r[k])&&!r[k].length))p.push(`missing ${k}`);
 if(r.title&&r.title.length>150)p.push('title over 150 characters');
 if(r.description&&r.description.length>5000)p.push('description over 5000 characters');
 if(r.price&&!/^\d+(\.\d{2})? NGN$/.test(r.price))p.push('price format');
 if(r.sale_price&&(!/^\d+\.\d{2} NGN$/.test(r.sale_price)||parseFloat(r.sale_price)>=parseFloat(r.price)))p.push('sale_price must be below price');
 if(r.availability&&!['in_stock','out_of_stock','pre_order','backorder','unknown'].includes(r.availability))p.push('availability value');
 if(r.condition&&!['new','used','refurbished'].includes(r.condition))p.push('condition value');
 for(const k of ['url','image_url','seller_url','return_policy'])if(r[k]&&!/^https:\/\/\S+$/.test(r[k]))p.push(`${k} not an absolute https URL`);
 if(r.group_id&&r.group_id===r.item_id)p.push('group_id must differ from item_id');
 if(r.variant_dict&&!r.listing_has_variations)p.push('variant_dict needs listing_has_variations');
 return p;
}
