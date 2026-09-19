export const SELLING_MARKUP = 0.05;
export function getSellingPrice(basePrice) {
  if (!Number.isFinite(basePrice) || basePrice <= 0) throw new TypeError('A positive base price is required.');
  return Math.round(basePrice * 105 / 100);
}
export function calculateSwapValue({ basePrice, screenChanged=false, screenCracked=false, batteryChanged=false, backGlassChanged=false, backGlassCracked=false, faceIdWorking=true }) {
  if (!Number.isFinite(basePrice) || basePrice <= 0) throw new TypeError('A positive swap reference price is required.');
  const deductions = [{label:'Standard used adjustment',percent:40}];
  if (screenChanged || screenCracked) deductions.push({label:'Screen changed or cracked',percent:10});
  if (batteryChanged) deductions.push({label:'Battery changed',percent:5});
  if (backGlassChanged || backGlassCracked) deductions.push({label:'Back glass changed or cracked',percent:2});
  if (!faceIdWorking) deductions.push({label:'Face ID not working',percent:8});
  const deductionPercent = deductions.reduce((sum,item)=>sum+item.percent,0);
  return { deductions, deductionPercent, value:Math.max(0,Math.round(basePrice*(100-deductionPercent)/100)) };
}
export function calculateOutstandingBalance({sellingPrice,swapValue=0,deposit=0}) {
  if (![sellingPrice,swapValue,deposit].every(Number.isFinite) || sellingPrice<=0 || swapValue<0 || deposit<0) throw new TypeError('Valid non-negative amounts are required.');
  const afterSwap = Math.max(0,sellingPrice-swapValue);
  if (deposit>afterSwap) throw new RangeError('Deposit cannot exceed the remaining purchase balance.');
  return Math.max(0,afterSwap-deposit);
}
