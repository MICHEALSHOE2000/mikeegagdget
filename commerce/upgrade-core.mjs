import { calculateSwapValue, calculateOutstandingBalance } from './pricing.mjs';
import { products } from './catalog.mjs';
import { FINANCE_PLATFORMS, FINANCE_DURATIONS, calculatePlan } from '../easy-buy/easy-buy-core.mjs';
export { FINANCE_PLATFORMS, FINANCE_DURATIONS };
export const money = value => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
export const choices = products.flatMap(product => product.variants.map(variant => ({
  id: `${product.slug}|${variant.storage}`, slug: product.slug, model: product.model,
  storage: variant.storage, basePrice: variant.basePrice, color: variant.color, availability:variant.availability, category:product.family, sellingPrice:variant.sellingPrice, price: variant.priceNeedsExtraConfirmation ? null : variant.price,
  image: product.images[0], brand: product.brand,
  hasFaceId: product.brand === 'Apple' && !/^iphone-(6|7|8|se)/.test(product.slug),
  hasGlassBack: product.brand === 'Apple' && !/^iphone-(6|7)/.test(product.slug),
  label: `${product.model} · ${variant.storage}`, finance: product.easyBuyEligible === true, conditions:product.conditions
})));
export function estimateSwap({ current, target, screenChanged=false, screenCracked=false, batteryChanged=false, backChanged=false, backCracked=false, faceIdBroken=false }) {
  if (!current || !target) throw new TypeError('Choose both phones.');
  if (!Number.isFinite(current.basePrice) || current.basePrice<=0 || !Number.isFinite(target.price) || target.price<=0 || current.brand !== 'Apple') return { manual:true, reason:'price' };
  const result = calculateSwapValue({basePrice:current.basePrice, screenChanged,screenCracked,batteryChanged,backGlassChanged:backChanged && current.hasGlassBack,backGlassCracked:backCracked && current.hasGlassBack,faceIdWorking:!(faceIdBroken && current.hasFaceId)});
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
