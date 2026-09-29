export const DEPOSIT_RATE = 0.4;
export const MAX_FINANCED = 200000;
export const PROCESSING_FEE = 5000;
export const FINANCE_DURATIONS = Object.freeze([1,2,3,4,5,6]);
export const CREDIT_LIMIT_URL = 'https://www.creditdirect.ng/know-your-limit';
export const FINANCE_PLATFORMS = Object.freeze({
  credit: Object.freeze({ label: "Approved-limit plan", rate: 0.075, creditCheck: true }),
  noCredit: Object.freeze({ label: "No-limit-check plan", rate: 0.20, creditCheck: false })
});
// The no-credit-check plan remains available as an explicit alternative.
export const DURATION_FACTORS = Object.freeze({ 1: 1.2, 2: 1.4, 3: 1.6, 4: 1.8, 5: 2, 6: 2.2 });
export const PAYMENTS_PER_MONTH = Object.freeze({ monthly: 1, weekly: 4, biweekly: 2 });

export function allowedFrequencies(series) {
  return series === 11 || series === 12
    ? ["monthly", "weekly", "biweekly"]
    : ["monthly"];
}

export function minimumDeposit(price, depositRate = DEPOSIT_RATE) {
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(depositRate) || depositRate <= 0 || depositRate > 1) {
    throw new RangeError("Choose a valid phone price and deposit rule.");
  }
  return Math.max(Math.round(price * depositRate), Math.ceil(price - MAX_FINANCED), 0);
}

export function calculatePlan({ price, duration, frequency = "monthly", series, depositRate = DEPOSIT_RATE, deposit, platform = "credit" }) {
  const numericPrice = Number(price);
  const numericDuration = Number(duration);
  const policy = FINANCE_PLATFORMS[platform];
  if (!policy) throw new RangeError("Choose a financing platform.");
  const factor = FINANCE_DURATIONS.includes(numericDuration) ? 1 + policy.rate * numericDuration : null;
  const paymentsPerMonth = PAYMENTS_PER_MONTH[frequency];

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    throw new TypeError("A positive phone price is required.");
  }
  if (!factor) {
    throw new RangeError("Duration must be one to six months.");
  }
  if (!paymentsPerMonth || !allowedFrequencies(Number(series)).includes(frequency)) {
    throw new RangeError("That repayment schedule is not available for the selected iPhone.");
  }

  if (!Number.isFinite(depositRate) || depositRate <= 0 || depositRate > 1) {
    throw new RangeError("Deposit rate must be greater than zero and no more than one.");
  }
  const requiredDeposit = minimumDeposit(numericPrice, depositRate);
  const selectedDeposit = deposit === undefined ? requiredDeposit : Number(deposit);
  if (!Number.isInteger(selectedDeposit) || selectedDeposit < requiredDeposit || selectedDeposit > numericPrice) {
    throw new RangeError(`Increase your deposit to at least ₦${requiredDeposit.toLocaleString('en-NG')}. Your remaining balance cannot exceed ₦200,000.`);
  }
  const balance = numericPrice - selectedDeposit;
  const balanceRepayment = balance * factor;
  const additionalCost = balanceRepayment - balance;
  const repayments = numericDuration * paymentsPerMonth;
  const installment = balanceRepayment / repayments;

  return {
    depositRate,
    factor,
    minimumDeposit: requiredDeposit,
    deposit: selectedDeposit,
    balance,
    rate: policy.rate,
    processingFee: PROCESSING_FEE,
    totalPayable: selectedDeposit + balanceRepayment + PROCESSING_FEE,
    balanceRepayment,
    additionalCost,
    repayments,
    installment
  };
}
