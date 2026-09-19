export const DEPOSIT_RATE = 0.4;
export const FINANCE_PLATFORMS = Object.freeze({
  credit: Object.freeze({ label: "Credit-check plan", rate: 0.075, creditCheck: true }),
  noCredit: Object.freeze({ label: "No credit-check plan", rate: 0.20, creditCheck: false })
});
// Legacy callers explicitly retain the no-credit plan; new journey offers both.
export const DURATION_FACTORS = Object.freeze({ 1: 1.2, 2: 1.4, 3: 1.6 });
export const PAYMENTS_PER_MONTH = Object.freeze({ monthly: 1, weekly: 4, biweekly: 2 });

export function allowedFrequencies(series) {
  return series === 11 || series === 12
    ? ["monthly", "weekly", "biweekly"]
    : ["monthly"];
}

export function calculatePlan({ price, duration, frequency = "monthly", series, depositRate = DEPOSIT_RATE, platform = "noCredit" }) {
  const numericPrice = Number(price);
  const numericDuration = Number(duration);
  const policy = FINANCE_PLATFORMS[platform];
  if (!policy) throw new RangeError("Choose a financing platform.");
  const factor = [1,2,3].includes(numericDuration) ? 1 + policy.rate * numericDuration : null;
  const paymentsPerMonth = PAYMENTS_PER_MONTH[frequency];

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    throw new TypeError("A positive phone price is required.");
  }
  if (!factor) {
    throw new RangeError("Duration must be 1, 2 or 3 months.");
  }
  if (!paymentsPerMonth || !allowedFrequencies(Number(series)).includes(frequency)) {
    throw new RangeError("That repayment schedule is not available for the selected iPhone.");
  }

  if (!Number.isFinite(depositRate) || depositRate <= 0 || depositRate > 1) {
    throw new RangeError("Deposit rate must be greater than zero and no more than one.");
  }
  const deposit = numericPrice * depositRate;
  const balance = Math.max(0, numericPrice - deposit);
  const balanceRepayment = balance * factor;
  const additionalCost = balanceRepayment - balance;
  const repayments = numericDuration * paymentsPerMonth;
  const installment = balanceRepayment / repayments;

  return {
    depositRate,
    factor,
    deposit,
    balance,
    balanceRepayment,
    additionalCost,
    repayments,
    installment
  };
}
