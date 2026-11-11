export const CART_KEY='mikee-cart-v1';
export function cleanCart(value){
 if(!Array.isArray(value))return [];
 const merged=new Map();
 for(const row of value.slice(0,30)){
  if(typeof row?.sku!=='string'||row.sku.length>250||!Number.isInteger(row.quantity)||row.quantity<1||row.quantity>20)continue;
  const color=typeof row.color==='string'?row.color.slice(0,80):'';
  const key=JSON.stringify([row.sku,color]);const old=merged.get(key);
  merged.set(key,{sku:row.sku,color,quantity:Math.min(20,row.quantity+(old?.quantity||0))});
 }
 return [...merged.values()];
}
export function readCart(storage){try{return cleanCart(JSON.parse(storage.getItem(CART_KEY)||'[]'));}catch{return [];}}
export function saveCart(storage,items){const clean=cleanCart(items);storage.setItem(CART_KEY,JSON.stringify(clean));return clean;}
export function addToCart(storage,item){return saveCart(storage,[...readCart(storage),item]);}
