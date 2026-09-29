// One policy for product pages, the guided journeys and the legacy calculator.
export const DEPOSIT_RATE = 0.4; // Non-iPhone starting deposit; iPhone brackets are below.
export const MAX_FINANCED = 250_000; // Applies only to non-Apple gadgets.
export const PROCESSING_FEE = 5_000; // Applies to a 7.5% plan.
export const FINANCE_DURATIONS = Object.freeze([1, 2, 3]);
export const CREDIT_LIMIT_URL = 'https://www.creditdirect.ng/know-your-limit';
export const FINANCE_PLATFORMS = Object.freeze({
  standard: Object.freeze({label:'Standard plan', creditCheck:false}),
  noCredit: Object.freeze({label:'Standard plan', creditCheck:false}),
  credit: Object.freeze({label:'7.5% qualification plan', creditCheck:true})
});
export const PAYMENTS_PER_MONTH = Object.freeze({monthly:1});

export function iphoneSeries(device) {
  if (typeof device === 'number') return Number.isInteger(device) ? device : null;
  const match = String(device?.slug || device?.model || device || '').match(/^iphone[- ](\d+)(?:[- ]|$)/i);
  return match ? Number(match[1]) : null;
}

export function isAppleDevice(device) {
  return device?.brand === 'Apple' || /^iphone[- ]/i.test(String(device?.slug || device?.model || device || ''));
}

export function depositRateFor(device) {
  const series = iphoneSeries(device);
  if (series >= 16 && series <= 18) return 0.7;
  if (series >= 13 && series <= 15) return 0.6;
  if (series >= 11 && series <= 12) return 0.5;
  return DEPOSIT_RATE;
}

export function allowedFrequencies() { return ['monthly']; }

// A numeric second argument is kept for callers that explicitly use a rate.
// Device-aware callers pass the device so storage prices keep the correct cap.
export function minimumDeposit(price, device = null) {
  if (!Number.isFinite(price) || price <= 0) throw new RangeError('Choose a valid device price.');
  const rate = typeof device === 'number' && device < 1 ? device : depositRateFor(device);
  if (!Number.isFinite(rate) || rate <= 0 || rate > 1) throw new RangeError('Choose a valid deposit rule.');
  return Math.max(Math.round(price * rate), isAppleDevice(device) ? 0 : Math.ceil(price - MAX_FINANCED), 0);
}

export function calculatePlan({price, duration = 1, frequency = 'monthly', phone, series, deposit, platform = 'standard', qualified = false} = {}) {
  const amount = Number(price), months = Number(duration);
  const device = phone || (series ? {slug:`iphone-${series}`, brand:'Apple'} : null);
  if (!Number.isFinite(amount) || amount <= 0) throw new TypeError('A positive device price is required.');
  if (!FINANCE_DURATIONS.includes(months)) throw new RangeError('Choose one, two or three months.');
  if (frequency !== 'monthly') throw new RangeError('This plan uses monthly repayments.');
  if (!FINANCE_PLATFORMS[platform]) throw new RangeError('Choose a valid payment plan.');
  if (platform === 'credit' && isAppleDevice(device) && !qualified) {
    throw new RangeError('A credit check and approval are required for the 7.5% Apple plan.');
  }
  const rate = platform === 'credit' || !isAppleDevice(device) ? .075 : .20;
  const requiredDeposit = minimumDeposit(amount, device);
  const selectedDeposit = deposit === undefined ? requiredDeposit : Number(deposit);
  if (!Number.isInteger(selectedDeposit) || selectedDeposit < requiredDeposit || selectedDeposit > amount) {
    const cap = isAppleDevice(device) ? '' : ` Your remaining balance cannot exceed ₦${MAX_FINANCED.toLocaleString('en-NG')}.`;
    throw new RangeError(`Increase your down payment to at least ₦${requiredDeposit.toLocaleString('en-NG')}.${cap}`);
  }
  const balance = amount - selectedDeposit;
  const balanceRepayment = Math.round(balance * (1 + rate * months));
  const processingFee = rate === .075 ? PROCESSING_FEE : 0;
  return {
    depositRate:depositRateFor(device), minimumDeposit:requiredDeposit, deposit:selectedDeposit,
    balance, rate, processingFee, factor:1 + rate * months,
    totalPayable:selectedDeposit + balanceRepayment + processingFee,
    balanceRepayment, additionalCost:balanceRepayment-balance,
    repayments:months, installment:balanceRepayment/months,
    qualified:platform === 'credit' && isAppleDevice(device)
  };
}
