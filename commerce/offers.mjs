// Merchant-authorized Hot Deals promotion. Stable selection: prices never change on refresh.
// Edit this list to rotate the promoted models; base prices/valuation remain untouched.
export const HOT_DEALS_LIMIT = 5;
export const promotion = Object.freeze({id:'mikee-hot-deals', discount:0.08, models:['iphone-11','iphone-13','iphone-15-pro','iphone-18-pro','iphone-18-pro-max']});
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
