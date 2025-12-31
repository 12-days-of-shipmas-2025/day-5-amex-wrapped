/**
 * Raw transaction data from Amex UK CSV export
 */
export interface AmexTransaction {
  /** Transaction date in DD/MM/YYYY format */
  date: string;
  /** Merchant description with location */
  description: string;
  /** Transaction amount (positive = charge, negative = refund) */
  amount: number;
  /** Extended details including FX info, ticket details */
  extendedDetails: string;
  /** Statement description (usually same as description) */
  appearsOnStatement: string;
  /** Merchant street address */
  address: string;
  /** Merchant city */
  townCity: string;
  /** Merchant postal code */
  postcode: string;
  /** Merchant country */
  country: string;
  /** Transaction reference ID */
  reference: string;
  /** Amex category (e.g., "Entertainment-Restaurants") */
  category: string;
}

/**
 * Foreign currency transaction details
 */
export interface ForeignCurrencyInfo {
  /** Original amount in foreign currency */
  foreignAmount: number;
  /** Currency name (e.g., "UNITED STATES DOLLAR", "EUROPEAN UNION EURO") */
  currency: string;
  /** Currency code (e.g., "USD", "EUR") */
  currencyCode: string;
  /** Commission/FX fee charged */
  commission: number;
  /** Exchange rate used */
  exchangeRate: number;
}

/**
 * Parsed transaction with computed fields
 */
export interface Transaction extends AmexTransaction {
  /** Unique ID for React keys */
  id: string;
  /** Parsed date object */
  parsedDate: Date;
  /** Absolute amount for calculations */
  absoluteAmount: number;
  /** Is this a refund/credit? */
  isRefund: boolean;
  /** Main category (before hyphen) */
  mainCategory: string;
  /** Sub category (after hyphen) */
  subCategory: string;
  /** Extracted merchant name (cleaned) */
  merchantName: string;
  /** Foreign currency info if applicable */
  foreignCurrency: ForeignCurrencyInfo | null;
}

/**
 * Category totals for wrapped visualizations
 */
export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

/**
 * Merchant totals for top merchants
 */
export interface MerchantTotal {
  merchantName: string;
  total: number;
  count: number;
  averageTransaction: number;
}

/**
 * Monthly spending data
 */
export interface MonthlySpending {
  month: string; // YYYY-MM format
  monthLabel: string; // "Jan 2025" format
  total: number;
  count: number;
}

/**
 * Wrapped summary statistics
 */
export interface WrappedStats {
  /** Total amount spent (excluding refunds) */
  totalSpent: number;
  /** Total refunds received */
  totalRefunds: number;
  /** Net spending (spent - refunds) */
  netSpending: number;
  /** Total number of transactions */
  transactionCount: number;
  /** Average transaction amount */
  averageTransaction: number;
  /** Biggest single purchase */
  biggestPurchase: Transaction | null;
  /** Most frequent merchant */
  mostFrequentMerchant: MerchantTotal | null;
  /** Top categories by spending */
  topCategories: CategoryTotal[];
  /** Top merchants by spending */
  topMerchants: MerchantTotal[];
  /** Monthly spending breakdown */
  monthlySpending: MonthlySpending[];
  /** Number of unique merchants */
  uniqueMerchants: number;
  /** Date range of transactions */
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  /** Foreign currency spending stats */
  foreignSpend: {
    /** Total GBP spent on foreign transactions */
    totalGBP: number;
    /** Total FX commission paid */
    totalCommission: number;
    /** Number of foreign transactions */
    transactionCount: number;
    /** Breakdown by currency */
    byCurrency: {
      currencyCode: string;
      currency: string;
      totalForeign: number;
      totalGBP: number;
      transactionCount: number;
    }[];
  };
}

/**
 * CSV column mapping for Amex UK format
 */
export const AMEX_CSV_COLUMNS = {
  date: 'Date',
  description: 'Description',
  amount: 'Amount',
  extendedDetails: 'Extended Details',
  appearsOnStatement: 'Appears On Your Statement As',
  address: 'Address',
  townCity: 'Town/City',
  postcode: 'Postcode',
  country: 'Country',
  reference: 'Reference',
  category: 'Category',
} as const;

/**
 * Main category colors for charts
 */
export const CATEGORY_COLORS: Record<string, string> = {
  'Business Services': '#3b82f6', // blue
  'General Purchases': '#10b981', // green
  Entertainment: '#f59e0b', // amber
  Travel: '#8b5cf6', // purple
  Other: '#6b7280', // gray
};
