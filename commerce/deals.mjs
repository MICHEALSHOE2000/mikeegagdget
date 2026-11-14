// Whole-naira, half-up rounding; equivalent to round(price_ngn * 0.90) in SQL.
export const DEAL_LIMIT=4;
export const HOME_FEATURED_LIMIT=8;
export function dealPrice(price){if(!Number.isSafeInteger(price)||price<=0||price>100000000)throw Error('A verified catalogue price is required.');return Math.floor((price*9+5)/10);}
export function validateDeals(body){
 if(!body||!Number.isSafeInteger(body.revision)||body.revision<0||!Array.isArray(body.skus)||body.skus.length>DEAL_LIMIT||body.skus.some(s=>typeof s!=='string'||!s||s.length>250)||new Set(body.skus).size!==body.skus.length)throw Error('Select up to four unique catalogue variants.');
 return {skus:body.skus,revision:body.revision};
}
export function pricedVariant(row,featured=false){const originalPrice=row.price_ngn===null?null:Number(row.price_ngn);const eligible=featured&&row.enabled&&originalPrice>0&&!row.product_data?.reviewRequired;return {...row.product_data,sku:row.sku,enabled:row.enabled,originalPrice,price:eligible?dealPrice(originalPrice):originalPrice,deal:!!eligible};}
export function validateHome(body){
 if(!body||!Number.isSafeInteger(body.revision)||body.revision<0||!Array.isArray(body.slugs)||body.slugs.length>HOME_FEATURED_LIMIT||body.slugs.some(s=>typeof s!=='string'||!/^[a-z0-9-]{1,120}$/.test(s))||new Set(body.slugs).size!==body.slugs.length)throw Error('Select up to eight unique catalogue products.');
 return {slugs:body.slugs,revision:body.revision};
}
