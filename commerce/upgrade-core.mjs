import { products } from './catalog.mjs';
import { DEPOSIT_RATE, FINANCE_PLATFORMS } from '../easy-buy/easy-buy-core.mjs';
export { FINANCE_PLATFORMS };
export const money = value => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
export const choices = products.flatMap(product => product.variants.map(variant => ({
  id: `${product.slug}|${variant.storage}`, slug: product.slug, model: product.model,
  storage: variant.storage, price: variant.priceNeedsExtraConfirmation ? null : variant.price,
  image: product.images[0], brand: product.brand,
  hasFaceId: product.brand === 'Apple' && !/^iphone-(6|7|8|se)/.test(product.slug),
  hasGlassBack: product.brand === 'Apple' && !/^iphone-(6|7)/.test(product.slug),
  label: `${product.model} · ${variant.storage}`, finance: product.easyBuyEligible === true
})));
export const SWAP_DEDUCTIONS = Object.freeze({ used: 40, screenChanged: 10, batteryChanged: 5, backChanged: 2, faceIdBroken: 8 });
export function estimateSwap({ current, target, screenChanged = false, batteryChanged = false, backChanged = false, faceIdBroken = false, cracked = false }) {
  if (!current || !target) throw new TypeError('Choose both phones.');
  if (cracked || !current.price || !target.price || current.brand !== 'Apple') return { manual: true, reason: cracked ? 'crack' : 'price' };
  const deductions = [{ label: 'Used-phone deduction', percent: 40 }];
  if (screenChanged) deductions.push({ label: 'Screen changed', percent: 10 });
  if (batteryChanged) deductions.push({ label: 'Battery changed', percent: 5 });
  if (backChanged && current.hasGlassBack) deductions.push({ label: 'Back glass changed', percent: 2 });
  if (faceIdBroken && current.hasFaceId) deductions.push({ label: 'Face ID not working', percent: 8 });
  const deductionPercent = deductions.reduce((sum,item) => sum + item.percent,0);
  const value = Math.round(current.price * (100 - deductionPercent) / 100);
  return { manual:false, deductions, deductionPercent, value, topUp:Math.max(0,target.price-value), surplus:Math.max(0,value-target.price) };
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
