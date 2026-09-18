import { products } from './catalog.mjs';
import { calculatePlan } from '../easy-buy/easy-buy-core.mjs';

// Indicative planning assumptions, NOT approved buy-back offers.
// Replace with merchant-approved per-variant buying prices before advertising firm quotes.
export const swapPolicy = Object.freeze({ excellent: [0.65, 0.75], good: [0.55, 0.65], fair: [0.4, 0.5], batteryDeduction: 0.08 });
export const money = value => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
export const choices = products.flatMap(product => product.variants.map(variant => ({
  id: `${product.slug}|${variant.storage}`, slug: product.slug, model: product.model,
  storage: variant.storage, price: variant.priceNeedsExtraConfirmation ? null : variant.price,
  image: product.images[0], brand: product.brand, series: Number(product.model.match(/iPhone (\d+)/)?.[1]),
  label: `${product.model} · ${variant.storage}`, finance: product.easyBuyEligible === true
})));
export function estimateSwap({ current, target, condition, battery, issue = 'none', unlocked = true }) {
  if (!current || !target || !swapPolicy[condition] || !['healthy', 'low', 'unknown'].includes(battery)) throw new TypeError('Choose valid phone and condition details.');
  if (!unlocked || issue !== 'none' || battery === 'unknown' || !current.price || !target.price) return { manual: true };
  const deduction = battery === 'low' ? swapPolicy.batteryDeduction : 0;
  const [low, high] = swapPolicy[condition].map(rate => Math.floor(current.price * (rate - deduction) / 1000) * 1000);
  return { manual: false, low, high, addLow: Math.max(0, target.price - high), addHigh: Math.max(0, target.price - low), excess: low > target.price };
}
export function financePlan(phone, duration, frequency = 'monthly') {
  if (!phone?.finance || !phone.price) throw new TypeError('This phone needs a confirmed finance quote.');
  const plan = calculatePlan({ price: phone.price, series: phone.series, duration, frequency });
  // Whole-naira instalments with the last payment adjusted so the schedule reconciles exactly.
  const total = Math.round(plan.balanceRepayment);
  const regular = Math.floor(total / plan.repayments);
  const payments = Array.from({ length: plan.repayments }, (_, index) => index === plan.repayments - 1 ? total - regular * (plan.repayments - 1) : regular);
  return { ...plan, payments, totalPayable: plan.deposit + total };
}
