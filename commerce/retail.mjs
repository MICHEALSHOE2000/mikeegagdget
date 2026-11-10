import {storeItems} from './storefront-data.mjs';
export const retailProducts = storeItems.map(item=>({...item,
 route:['iphones','samsung','pixel'].includes(item.category)?item.route:`/product/${item.slug}/`,
 availability:'Available to Order',supplierVerification:'unverified',lastVerifiedAt:null,
 variants:item.variants.map(v=>({...v,sku:`${item.slug}|${v.storage}`}))
}));
export const retailVariants=new Map(retailProducts.flatMap(p=>p.variants.map(v=>[v.sku,{...v,model:p.model,label:`${p.model} · ${v.storage}`,conditions:p.conditions,image:p.image,slug:p.slug}])));
