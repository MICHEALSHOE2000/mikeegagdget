import { calculateSwapValue, calculateOutstandingBalance } from './pricing.mjs';
import { products } from './catalog.mjs';
import { DEPOSIT_RATE, FINANCE_PLATFORMS } from '../easy-buy/easy-buy-core.mjs';
export { FINANCE_PLATFORMS };
export const money = value => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
export const choices = products.flatMap(product => product.variants.map(variant => ({
  id: `${product.slug}|${variant.storage}`, slug: product.slug, model: product.model,
  storage: variant.storage, basePrice: variant.basePrice, color: variant.color, availability:variant.availability, category:product.family, sellingPrice:variant.sellingPrice, price: variant.priceNeedsExtraConfirmation ? null : variant.price,
  image: product.images[0], brand: product.brand,
  hasFaceId: product.brand === 'Apple' && !/^iphone-(6|7|8|se)/.test(product.slug),
  hasGlassBack: product.brand === 'Apple' && !/^iphone-(6|7)/.test(product.slug),
  label: `${product.model} · ${variant.storage}`, finance: product.easyBuyEligible === true
})));
export function estimateSwap({ current, target, screenChanged=false, screenCracked=false, batteryChanged=false, backChanged=false, backCracked=false, faceIdBroken=false }) {
  if (!current || !target) throw new TypeError('Choose both phones.');
  if (!Number.isFinite(current.basePrice) || current.basePrice<=0 || !Number.isFinite(target.price) || target.price<=0 || current.brand !== 'Apple') return { manual:true, reason:'price' };
  const result = calculateSwapValue({basePrice:current.basePrice, screenChanged,screenCracked,batteryChanged,backGlassChanged:backChanged && current.hasGlassBack,backGlassCracked:backCracked && current.hasGlassBack,faceIdWorking:!(faceIdBroken && current.hasFaceId)});
  return {manual:false,...result,topUp:calculateOutstandingBalance({sellingPrice:target.price,swapValue:result.value}),surplus:Math.max(0,result.value-target.price)};
}
export function financePlan({ amount, platform = 'credit', duration = 1, deposit = Math.round(amount * DEPOSIT_RATE) }) {
  if (!Number.isFinite(amount) || amount < 0) throw new TypeError('A valid balance is required.');
  const policy = FINANCE_PLATFORMS[platform];
  if (!policy) throw new RangeError('Choose a financing platform.');
  if (![1,2,3].includes(duration)) throw new RangeError('Choose a one, two or three month plan.');
  const minimumDeposit = Math.round(amount * DEPOSIT_RATE);
  if (!Number.isFinite(deposit) || !Number.isInteger(deposit) || deposit < minimumDeposit || deposit > amount) throw new RangeError(`Deposit must be between ${minimumDeposit} and ${amount}.`);
  const balance = amount - deposit;
  const interest = Math.round(balance * policy.rate * duration);
  const repaymentTotal = balance + interest;
  const regular = Math.floor(repaymentTotal / duration);
  const payments = Array.from({length:duration},(_,i) => i === duration-1 ? repaymentTotal - regular*(duration-1) : regular);
  return { deposit, balance, rate:policy.rate, interest, repaymentTotal, totalPayable:deposit+repaymentTotal, payments, platform };
}
