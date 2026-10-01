// The new retailer list contains final selling prices and no separately approved discounts.
// Keep the offer helpers ready for a future authorized promotion without altering these prices.
export const HOT_DEALS_LIMIT = 5;
export const promotion = Object.freeze({id:'mikee-hot-deals', discount:0.08, models:[]});
export function withOffer(variant, slug) {
 if (!promotion.models.includes(slug) || !Number.isFinite(variant.price) || variant.price <= 0) return {...variant};
 return {...variant, regularPrice:variant.price, price:Math.round(variant.price*(1-promotion.discount)), offerId:promotion.id};
}
export const offerProduct = product => ({...product, variants:product.variants.map(v=>withOffer(v,product.slug))});
export const offerChoice = phone => withOffer(phone,phone.slug);
export const isComplete = product => !product.listingPending && !!product.images?.length && product.variants.some(v=>Number.isFinite(v.price)&&v.price>0);
export function featuredDeals(items) {
 const bySlug = new Map(items.filter(item=>item.variants?.some(variant=>variant.offerId)).map(item=>[item.slug,item]));
 return promotion.models.map(slug=>bySlug.get(slug)).filter(Boolean).slice(0,HOT_DEALS_LIMIT);
}
