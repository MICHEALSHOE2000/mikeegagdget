import {retailInventory} from './retail-inventory.mjs';
import {normalizeOffer} from './discovery.mjs';
const normalizedOffers=new Map(retailInventory.flatMap(item=>item.variants.map(v=>{const offer=normalizeOffer(item,v);return [offer.legacyId,offer];})));
import { calculateSwapValue, calculateOutstandingBalance } from './pricing.mjs';
import { products } from './catalog.mjs';
import { tradeInReferences } from './trade-in-reference.mjs';
import { productImages } from './product-images.mjs';
import { FINANCE_PLATFORMS, FINANCE_DURATIONS, calculatePlan } from '../easy-buy/easy-buy-core.mjs';
export { FINANCE_PLATFORMS, FINANCE_DURATIONS };
export const money = value => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
const saleChoices = products.flatMap(product => product.variants.map(variant => ({
  ...normalizedOffers.get(`${product.slug}|${variant.storage}`),
  id: `${product.slug}|${variant.storage}`, slug: product.slug, model: product.model,
  storage: variant.storage, swapReferencePrice: Number.isFinite(variant.price) ? variant.price : null,
  color: variant.color, availability:normalizedOffers.get(`${product.slug}|${variant.storage}`)?.availability || variant.availability, category:product.family, price: variant.priceNeedsExtraConfirmation ? null : variant.price,
  image: normalizedOffers.get(`${product.slug}|${variant.storage}`)?.image || product.images[0] || '', brand: product.brand, forSale: true,
  hasFaceId: product.brand === 'Apple' && !/^iphone-(6|7|8|se)/.test(product.slug),
  hasGlassBack: product.brand === 'Apple' && !/^iphone-(6|7)/.test(product.slug),
  label: `${product.model} · ${variant.storage}`, finance: product.easyBuyEligible === true, conditions:[normalizedOffers.get(`${product.slug}|${variant.storage}`)?.condition || product.conditions[0]]
})));
const saleIds = new Set(saleChoices.map(phone=>phone.id));
const legacySwapChoices = tradeInReferences.flatMap(product=>product.variants.map(variant=>({
  ...normalizedOffers.get(`${product.slug}|${variant.storage}`),
  id: `${product.slug}|${variant.storage}`, slug:product.slug, model:product.model,
  storage:variant.storage, swapReferencePrice:variant.swapReferencePrice,
  color:null, availability:'Trade-in reference only; final value follows inspection',
  category:'iPhone', price:null,
  image:productImages[product.model]?.image || productImages[product.model]?.preferred || '',
  brand:'Apple', forSale:false,
  hasFaceId:!/^iphone-(6|7|8|se)/.test(product.slug),
  hasGlassBack:!/^iphone-(6|7)/.test(product.slug),
  label:`${product.model} · ${variant.storage}`, finance:false, conditions:['UK Used']
}))).filter(phone=>!saleIds.has(phone.id));
export const choices = Object.freeze([...saleChoices,...legacySwapChoices]);
export function estimateSwap({ current, target, screenChanged=false, screenCracked=false, batteryChanged=false, backChanged=false, backCracked=false, faceIdBroken=false }) {
  if (!current || !target) throw new TypeError('Choose both phones.');
  if (!Number.isFinite(current.swapReferencePrice) || current.swapReferencePrice<=0 || !Number.isFinite(target.price) || target.price<=0 || current.brand !== 'Apple') return { manual:true, reason:'price' };
  const result = calculateSwapValue({basePrice:current.swapReferencePrice, screenChanged,screenCracked,batteryChanged,backGlassChanged:backChanged && current.hasGlassBack,backGlassCracked:backCracked && current.hasGlassBack,faceIdWorking:!(faceIdBroken && current.hasFaceId)});
  return {manual:false,...result,topUp:calculateOutstandingBalance({sellingPrice:target.price,swapValue:result.value}),surplus:Math.max(0,result.value-target.price)};
}
export function financePlan({ amount, phone, platform = 'standard', duration = 1, deposit, qualified = false }) {
  const plan = calculatePlan({price:amount,phone,duration,deposit,platform,qualified});
  const repaymentTotal = plan.balanceRepayment;
  const regular = Math.floor(repaymentTotal / duration);
  const payments = Array.from({length:duration},(_,i) => i === duration-1 ? repaymentTotal - regular*(duration-1) : regular);
  return { deposit:plan.deposit, minimumDeposit:plan.minimumDeposit, balance:plan.balance,
    rate:plan.rate, interest:plan.additionalCost, processingFee:plan.processingFee,
    repaymentTotal, totalPayable:plan.totalPayable,
    dueUpfront:plan.deposit+plan.processingFee, payments, platform };
}
