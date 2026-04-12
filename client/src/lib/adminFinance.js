const currencyFormatterCache = new Map();

const getFormatter = (currency = "USD") => {
  if (!currencyFormatterCache.has(currency)) {
    currencyFormatterCache.set(
      currency,
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      })
    );
  }
  return currencyFormatterCache.get(currency);
};

export const formatCurrency = (value, currency = "USD") => {
  const numeric = Number(value) || 0;
  return getFormatter(currency).format(numeric);
};

export const formatNumber = (value, fractionDigits = 2) => {
  const numeric = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(numeric);
};

export const formatDate = (value, fallback = "-") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export const formatDateTime = (value, fallback = "-") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const parseMonthKey = (monthKey) => {
  if (!monthKey || !/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)) return null;
  const year = Number(monthKey.slice(0, 4));
  const month = Number(monthKey.slice(5, 7));
  return { year, month };
};

export const getDaysInMonth = (monthKey) => {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return 0;
  return new Date(parsed.year, parsed.month, 0).getDate();
};

export const getMonthEndDate = (monthKey) => {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return null;
  const day = new Date(parsed.year, parsed.month, 0).getDate();
  return new Date(parsed.year, parsed.month - 1, day, 23, 59, 59, 999);
};

export const clampRatio = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(value, 1));
};

export const getOwnershipRatio = ({ paidAmount, sharePrice }) => {
  const price = Number(sharePrice) || 0;
  if (price <= 0) return 0;
  return clampRatio((Number(paidAmount) || 0) / price);
};

export const getSharePaymentMetrics = ({ paidAmount, sharePrice }) => {
  const price = Number(sharePrice) || 0;
  const paid = Number(paidAmount) || 0;
  const clampedPaid = Math.min(Math.max(paid, 0), price);
  const remaining = Math.max(price - clampedPaid, 0);
  const ratio = getOwnershipRatio({ paidAmount: clampedPaid, sharePrice: price });

  return {
    sharePrice: price,
    paidAmount: clampedPaid,
    remainingAmount: remaining,
    ratio,
    ownershipPercentage: Number((ratio * 100).toFixed(2)),
    isFullyPaid: remaining <= 0,
  };
};

export const sumPaymentsUntilDate = (payments = [], date) => {
  const cutoff = date ? new Date(date) : null;
  const cutoffTime = cutoff && !Number.isNaN(cutoff.getTime()) ? cutoff.getTime() : null;

  return payments.reduce((sum, payment) => {
    const paidAt = payment?.paidAt ? new Date(payment.paidAt).getTime() : null;
    if (cutoffTime !== null && (paidAt === null || paidAt > cutoffTime)) {
      return sum;
    }
    return sum + (Number(payment?.amount) || 0);
  }, 0);
};

export const calculateDailyShareProfitPreview = ({
  monthlyProfit,
  totalShares,
  daysInMonth,
  totalPaid,
  sharePrice,
}) => {
  const parsedMonthlyProfit = Number(monthlyProfit) || 0;
  const parsedTotalShares = Number(totalShares) || 0;
  const parsedDays = Number(daysInMonth) || 0;
  const parsedPrice = Number(sharePrice) || 0;

  if (!parsedMonthlyProfit || parsedTotalShares <= 0 || parsedDays <= 0 || parsedPrice <= 0) {
    return {
      dailyProfitPerShare: 0,
      userRatio: 0,
      companyRatio: 1,
      userProfit: 0,
      companyProfit: 0,
    };
  }

  const dailyProfitPerShare = parsedMonthlyProfit / parsedTotalShares / parsedDays;
  const userRatio = clampRatio((Number(totalPaid) || 0) / parsedPrice);
  const companyRatio = Math.max(1 - userRatio, 0);

  return {
    dailyProfitPerShare,
    userRatio,
    companyRatio,
    userProfit: dailyProfitPerShare * userRatio,
    companyProfit: dailyProfitPerShare * companyRatio,
  };
};

export const toMonthKeyFromDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const calculateExpenseLineTotal = ({ quantity, unitCost }) => {
  const qty = Number(quantity) || 0;
  const price = Number(unitCost) || 0;
  return Math.round((qty * price + Number.EPSILON) * 100) / 100;
};

export const calculateExpenseTotal = (lineItems = []) => {
  const total = lineItems.reduce(
    (sum, line) => sum + calculateExpenseLineTotal({ quantity: line.quantity, unitCost: line.unitCost }),
    0
  );

  return Math.round((total + Number.EPSILON) * 100) / 100;
};
