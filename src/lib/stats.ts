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
 * Calculate category totals from transactions
 */
export function calculateCategoryTotals(transactions: Transaction[]): CategoryTotal[] {
  const categoryMap = new Map<string, { total: number; count: number }>();

  // Only count charges (positive amounts), not refunds
  const charges = transactions.filter(t => !t.isRefund);
  const totalSpent = charges.reduce((sum, t) => sum + t.absoluteAmount, 0);

  for (const t of charges) {
    const existing = categoryMap.get(t.mainCategory) || { total: 0, count: 0 };
    categoryMap.set(t.mainCategory, {
      total: existing.total + t.absoluteAmount,
      count: existing.count + 1,
    });
  }

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
      percentage: totalSpent > 0 ? Math.round((data.total / totalSpent) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Calculate merchant totals from transactions
 */
export function calculateMerchantTotals(transactions: Transaction[]): MerchantTotal[] {
  const merchantMap = new Map<string, { total: number; count: number }>();

  // Only count charges (positive amounts), not refunds
  const charges = transactions.filter(t => !t.isRefund);

  for (const t of charges) {
    const existing = merchantMap.get(t.merchantName) || { total: 0, count: 0 };
    merchantMap.set(t.merchantName, {
      total: existing.total + t.absoluteAmount,
      count: existing.count + 1,
    });
  }

  return Array.from(merchantMap.entries())
    .map(([merchantName, data]) => ({
      merchantName,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
      averageTransaction: Math.round((data.total / data.count) * 100) / 100,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Calculate monthly spending totals
 */
export function calculateMonthlySpending(transactions: Transaction[]): MonthlySpending[] {
  const monthMap = new Map<string, { total: number; count: number }>();

  // Only count charges (positive amounts), not refunds
  const charges = transactions.filter(t => !t.isRefund);

  for (const t of charges) {
    const monthKey = getMonthKey(t.parsedDate);
    const existing = monthMap.get(monthKey) || { total: 0, count: 0 };
    monthMap.set(monthKey, {
      total: existing.total + t.absoluteAmount,
      count: existing.count + 1,
    });
  }

  return Array.from(monthMap.entries())
    .map(([month, data]) => ({
      month,
      monthLabel: getMonthLabel(month),
      total: Math.round(data.total * 100) / 100,
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

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
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
