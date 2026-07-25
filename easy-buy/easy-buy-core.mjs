export const DEPOSIT_RATE = 0.4;
export const DURATION_FACTORS = Object.freeze({ 1: 1.2, 2: 1.4, 3: 1.6 });
export const PAYMENTS_PER_MONTH = Object.freeze({ monthly: 1, weekly: 4, biweekly: 2 });

export function allowedFrequencies(series) {
  return series === 11 || series === 12
    ? ["monthly", "weekly", "biweekly"]
    : ["monthly"];
}

export function calculatePlan({ price, duration, frequency = "monthly", series, depositRate = DEPOSIT_RATE }) {
  const numericPrice = Number(price);
  const numericDuration = Number(duration);
  const factor = DURATION_FACTORS[numericDuration];
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
