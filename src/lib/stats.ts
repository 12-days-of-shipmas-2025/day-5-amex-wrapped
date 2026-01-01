import type {
  Transaction,
  WrappedStats,
  CategoryTotal,
  MerchantTotal,
  MonthlySpending,
} from '@/types/transaction';

/**
 * Format a date as YYYY-MM for grouping
 */
function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Format a month key as a readable label
 */
function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

/**
 * Calculate category totals from transactions (net: spending minus refunds)
 */
export function calculateCategoryTotals(transactions: Transaction[]): CategoryTotal[] {
  const categoryMap = new Map<string, { total: number; count: number }>();

  // Calculate net spending per category (charges minus refunds)
  for (const t of transactions) {
    if (t.isPayment) continue; // Skip payments
    const existing = categoryMap.get(t.mainCategory) || { total: 0, count: 0 };
    const amount = t.isRefund ? -t.absoluteAmount : t.absoluteAmount;
    categoryMap.set(t.mainCategory, {
      total: existing.total + amount,
      count: existing.count + 1,
    });
  }

  // Calculate total net spending for percentages
  const totalNetSpent = Array.from(categoryMap.values()).reduce(
    (sum, data) => sum + Math.max(0, data.total),
    0
  );

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      total: Math.round(Math.max(0, data.total) * 100) / 100,
      count: data.count,
      percentage:
        totalNetSpent > 0 ? Math.round((Math.max(0, data.total) / totalNetSpent) * 1000) / 10 : 0,
    }))
    .filter(c => c.total > 0) // Only show categories with net positive spending
    .sort((a, b) => b.total - a.total);
}

/**
 * Calculate merchant totals from transactions (net: spending minus refunds)
 */
export function calculateMerchantTotals(transactions: Transaction[]): MerchantTotal[] {
  const merchantMap = new Map<string, { total: number; chargeCount: number }>();

  // Calculate net spending per merchant (charges minus refunds)
  for (const t of transactions) {
    if (t.isPayment) continue; // Skip payments
    const existing = merchantMap.get(t.merchantName) || { total: 0, chargeCount: 0 };
    const amount = t.isRefund ? -t.absoluteAmount : t.absoluteAmount;
    merchantMap.set(t.merchantName, {
      total: existing.total + amount,
      chargeCount: t.isRefund ? existing.chargeCount : existing.chargeCount + 1,
    });
  }

  return Array.from(merchantMap.entries())
    .map(([merchantName, data]) => ({
      merchantName,
      total: Math.round(Math.max(0, data.total) * 100) / 100,
      count: data.chargeCount,
      averageTransaction:
        data.chargeCount > 0
          ? Math.round((Math.max(0, data.total) / data.chargeCount) * 100) / 100
          : 0,
    }))
    .filter(m => m.total > 0) // Only show merchants with net positive spending
    .sort((a, b) => b.total - a.total);
}

/**
 * Calculate monthly spending totals (net: spending minus refunds)
 */
export function calculateMonthlySpending(transactions: Transaction[]): MonthlySpending[] {
  const monthMap = new Map<string, { total: number; count: number }>();

  // Calculate net spending per month (charges minus refunds)
  for (const t of transactions) {
    if (t.isPayment) continue; // Skip payments
    const monthKey = getMonthKey(t.parsedDate);
    const existing = monthMap.get(monthKey) || { total: 0, count: 0 };
    const amount = t.isRefund ? -t.absoluteAmount : t.absoluteAmount;
    monthMap.set(monthKey, {
      total: existing.total + amount,
      count: existing.count + 1,
    });
  }

  return Array.from(monthMap.entries())
    .map(([month, data]) => ({
      month,
      monthLabel: getMonthLabel(month),
      total: Math.round(Math.max(0, data.total) * 100) / 100, // Don't show negative months
      count: data.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Calculate foreign currency spending stats
 */
export function calculateForeignSpend(transactions: Transaction[]) {
  const foreignTransactions = transactions.filter(t => t.foreignCurrency && !t.isRefund);

  if (foreignTransactions.length === 0) {
    return {
      totalGBP: 0,
      totalCommission: 0,
      transactionCount: 0,
      byCurrency: [],
    };
  }

  const totalGBP = foreignTransactions.reduce((sum, t) => sum + t.absoluteAmount, 0);
  const totalCommission = foreignTransactions.reduce(
    (sum, t) => sum + (t.foreignCurrency?.commission || 0),
    0
  );

  // Group by currency
  const currencyMap = new Map<
    string,
    { currency: string; totalForeign: number; totalGBP: number; count: number }
  >();

  for (const t of foreignTransactions) {
    const fc = t.foreignCurrency!;
    const existing = currencyMap.get(fc.currencyCode) || {
      currency: fc.currency,
      totalForeign: 0,
      totalGBP: 0,
      count: 0,
    };
    currencyMap.set(fc.currencyCode, {
      currency: fc.currency,
      totalForeign: existing.totalForeign + fc.foreignAmount,
      totalGBP: existing.totalGBP + t.absoluteAmount,
      count: existing.count + 1,
    });
  }

  const byCurrency = Array.from(currencyMap.entries())
    .map(([currencyCode, data]) => ({
      currencyCode,
      currency: data.currency,
      totalForeign: Math.round(data.totalForeign * 100) / 100,
      totalGBP: Math.round(data.totalGBP * 100) / 100,
      transactionCount: data.count,
    }))
    .sort((a, b) => b.totalGBP - a.totalGBP);

  return {
    totalGBP: Math.round(totalGBP * 100) / 100,
    totalCommission: Math.round(totalCommission * 100) / 100,
    transactionCount: foreignTransactions.length,
    byCurrency,
  };
}

/**
 * Calculate all wrapped statistics from transactions
 */
export function calculateWrappedStats(transactions: Transaction[]): WrappedStats {
  if (transactions.length === 0) {
    return {
      totalSpent: 0,
      totalRefunds: 0,
      netSpending: 0,
      transactionCount: 0,
      averageTransaction: 0,
      biggestPurchase: null,
      mostFrequentMerchant: null,
      topCategories: [],
      topMerchants: [],
      monthlySpending: [],
      uniqueMerchants: 0,
      dateRange: { start: null, end: null },
      foreignSpend: {
        totalGBP: 0,
        totalCommission: 0,
        transactionCount: 0,
        byCurrency: [],
      },
    };
  }

  // Exclude payments from all calculations
  const purchaseTransactions = transactions.filter(t => !t.isPayment);
  const charges = purchaseTransactions.filter(t => !t.isRefund);
  const refunds = purchaseTransactions.filter(t => t.isRefund);

  const totalSpent = charges.reduce((sum, t) => sum + t.absoluteAmount, 0);
  const totalRefunds = refunds.reduce((sum, t) => sum + t.absoluteAmount, 0);

  const topCategories = calculateCategoryTotals(purchaseTransactions);
  const topMerchants = calculateMerchantTotals(purchaseTransactions);
  const monthlySpending = calculateMonthlySpending(purchaseTransactions);

  // Find biggest purchase
  const biggestPurchase = charges.reduce(
    (max, t) => (t.absoluteAmount > (max?.absoluteAmount || 0) ? t : max),
    null as Transaction | null
  );

  // Find most frequent merchant
  const mostFrequentMerchant =
    topMerchants.reduce(
      (max, m) => (m.count > (max?.count || 0) ? m : max),
      null as MerchantTotal | null
    ) || null;

  // Get unique merchants (excluding payments)
  const uniqueMerchants = new Set(purchaseTransactions.map(t => t.merchantName)).size;

  // Get date range
  const sortedByDate = [...transactions].sort(
    (a, b) => a.parsedDate.getTime() - b.parsedDate.getTime()
  );

  return {
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalRefunds: Math.round(totalRefunds * 100) / 100,
    netSpending: Math.round((totalSpent - totalRefunds) * 100) / 100,
    transactionCount: purchaseTransactions.length,
    averageTransaction:
      charges.length > 0 ? Math.round((totalSpent / charges.length) * 100) / 100 : 0,
    biggestPurchase,
    mostFrequentMerchant,
    topCategories: topCategories.slice(0, 10),
    topMerchants: topMerchants.slice(0, 10),
    monthlySpending,
    uniqueMerchants,
    dateRange: {
      start: sortedByDate[0]?.parsedDate || null,
      end: sortedByDate[sortedByDate.length - 1]?.parsedDate || null,
    },
    foreignSpend: calculateForeignSpend(purchaseTransactions),
  };
}

// Currency configuration (set when CSV is loaded)
let currentCurrency = 'GBP';
let currentLocale = 'en-GB';

/**
 * Set the currency configuration for formatting
 */
export function setCurrencyConfig(currency: string, locale: string): void {
  currentCurrency = currency;
  currentLocale = locale;
}

/**
 * Get the current currency code
 */
export function getCurrentCurrency(): string {
  return currentCurrency;
}

/**
 * Get the currency symbol for the current currency
 */
export function getCurrencySymbol(): string {
  const symbols: Record<string, string> = {
    GBP: '£',
    MXN: '$',
    USD: '$',
    EUR: '€',
  };
  return symbols[currentCurrency] || '$';
}

/**
 * Format currency for display (uses detected currency from CSV)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(currentLocale, {
    style: 'currency',
    currency: currentCurrency,
    minimumFractionDigits: currentCurrency === 'MXN' ? 0 : 2,
    maximumFractionDigits: currentCurrency === 'MXN' ? 0 : 2,
  }).format(amount);
}

/**
 * Format a large number with K/M suffix
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
