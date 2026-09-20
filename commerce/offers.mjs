// Merchant-authorized 20% promotion. Stable selection: prices never change on refresh.
// Edit this list to rotate the promoted models; base prices/valuation remain untouched.
export const promotion = Object.freeze({id:'mikee-20', discount:0.20, models:['iphone-11','iphone-12','iphone-12-pro-max','iphone-13','iphone-13-pro','iphone-14-pro-max','iphone-15','iphone-15-pro']});
export function withOffer(variant, slug) {
 if (!promotion.models.includes(slug) || !Number.isFinite(variant.price) || variant.price <= 0) return {...variant};
 return {...variant, regularPrice:variant.price, price:Math.round(variant.price*(1-promotion.discount)), offerId:promotion.id};
}
export const offerProduct = product => ({...product, variants:product.variants.map(v=>withOffer(v,product.slug))});
export const offerChoice = phone => withOffer(phone,phone.slug);
export const isComplete = product => !product.listingPending && !!product.images?.length && product.variants.some(v=>Number.isFinite(v.price)&&v.price>0);
