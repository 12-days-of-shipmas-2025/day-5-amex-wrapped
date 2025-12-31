import Papa from 'papaparse';
import type { AmexTransaction, Transaction, ForeignCurrencyInfo } from '@/types/transaction';

/**
 * Currency name to code mapping
 */
const CURRENCY_CODES: Record<string, string> = {
  'UNITED STATES DOLLAR': 'USD',
  'EUROPEAN UNION EURO': 'EUR',
  'JAPANESE YEN': 'JPY',
  'BRITISH POUND': 'GBP',
  'AUSTRALIAN DOLLAR': 'AUD',
  'CANADIAN DOLLAR': 'CAD',
  'SWISS FRANC': 'CHF',
  'CHINESE YUAN': 'CNY',
  'HONG KONG DOLLAR': 'HKD',
  'SINGAPORE DOLLAR': 'SGD',
  'THAI BAHT': 'THB',
  'INDIAN RUPEE': 'INR',
  'MEXICAN PESO': 'MXN',
  'SOUTH AFRICAN RAND': 'ZAR',
  'NEW ZEALAND DOLLAR': 'NZD',
  'SWEDISH KRONA': 'SEK',
  'NORWEGIAN KRONE': 'NOK',
  'DANISH KRONE': 'DKK',
  'POLISH ZLOTY': 'PLN',
  'CZECH KORUNA': 'CZK',
  'HUNGARIAN FORINT': 'HUF',
  'TURKISH LIRA': 'TRY',
  'ISRAELI SHEKEL': 'ILS',
  'UNITED ARAB EMIRATES DIRHAM': 'AED',
  'SAUDI RIYAL': 'SAR',
  'BRAZILIAN REAL': 'BRL',
  'COSTA RICA COLON': 'CRC',
};

/**
 * Parse a UK date string (DD/MM/YYYY) to a Date object
 */
export function parseUKDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Extract a clean merchant name from the description
 */
export function extractMerchantName(description: string): string {
  // Remove location suffix (everything after multiple spaces)
  let name = description.split(/\s{2,}/)[0];

  // Remove common suffixes like reference numbers
  name = name.replace(/\*[\w\d]+$/, '').trim();

  // Clean up common patterns
  name = name
    .replace(/^AMZNMKTPLACE/, 'Amazon Marketplace')
    .replace(/^AMAZON\.CO\.UK/, 'Amazon')
    .replace(/^PADDLE\.NET\*/, '')
    .replace(/^SP /, '')
    .replace(/\d+$/, '')
    .trim();

  return name || description;
}

/**
 * Parse the main category from the full category string
 */
export function parseMainCategory(category: string): string {
  const parts = category.split('-');
  return parts[0]?.trim() || 'Other';
}

/**
 * Parse the sub category from the full category string
 */
export function parseSubCategory(category: string): string {
  const parts = category.split('-');
  return parts[1]?.trim() || '';
}

/**
 * Parse foreign currency info from Extended Details field
 * Example: "Foreign Spend Amount: 7.18 UNITED STATES DOLLAR Commission Amount: 0.16 Currency Exchange Rate: 1.3345"
 */
export function parseForeignCurrency(extendedDetails: string): ForeignCurrencyInfo | null {
  if (!extendedDetails || !extendedDetails.includes('Foreign Spend Amount:')) {
    return null;
  }

  try {
    // Parse foreign amount and currency
    // Handle both "7.18" and "93,44" (European) number formats
    const foreignMatch = extendedDetails.match(
      /Foreign Spend Amount:\s*([\d,.]+)\s+([A-Z\s]+?)(?:\s+Commission|$)/i
    );
    if (!foreignMatch) return null;

    // Parse the amount (handle European comma format)
    const foreignAmountStr = foreignMatch[1].replace(',', '.');
    const foreignAmount = parseFloat(foreignAmountStr);
    const currency = foreignMatch[2].trim();

    // Parse commission
    const commissionMatch = extendedDetails.match(/Commission Amount:\s*([\d,.]+)/i);
    const commission = commissionMatch ? parseFloat(commissionMatch[1].replace(',', '.')) : 0;

    // Parse exchange rate
    const rateMatch = extendedDetails.match(/Currency Exchange Rate:\s*([\d,.]+)/i);
    const exchangeRate = rateMatch ? parseFloat(rateMatch[1].replace(',', '.')) : 0;

    // Get currency code
    const currencyCode = CURRENCY_CODES[currency] || currency.substring(0, 3).toUpperCase();

    return {
      foreignAmount,
      currency,
      currencyCode,
      commission,
      exchangeRate,
    };
  } catch {
    return null;
  }
}

/**
 * Generate a unique ID for a transaction
 */
function generateId(transaction: AmexTransaction, index: number): string {
  // Use reference if available, otherwise create from date + index
  if (transaction.reference) {
    return transaction.reference.replace(/'/g, '');
  }
  return `${transaction.date}-${index}`;
}

/**
 * Transform raw Amex transaction to enriched Transaction
 */
export function transformTransaction(raw: AmexTransaction, index: number): Transaction {
  const parsedDate = parseUKDate(raw.date);
  const amount = typeof raw.amount === 'string' ? parseFloat(raw.amount) : raw.amount;

  return {
    ...raw,
    amount,
    id: generateId(raw, index),
    parsedDate,
    absoluteAmount: Math.abs(amount),
    isRefund: amount < 0,
    mainCategory: parseMainCategory(raw.category),
    subCategory: parseSubCategory(raw.category),
    merchantName: extractMerchantName(raw.description),
    foreignCurrency: parseForeignCurrency(raw.extendedDetails),
  };
}

/**
 * Parse Amex UK CSV file content
 */
export function parseAmexCSV(csvContent: string): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim(),
      complete: results => {
        if (results.errors.length > 0) {
          const criticalErrors = results.errors.filter(e => e.type === 'Quotes');
          if (criticalErrors.length > 0) {
            reject(new Error(`CSV parsing error: ${criticalErrors[0].message}`));
            return;
          }
        }

        try {
          const transactions = results.data
            .map((row, index) => {
              // Map CSV columns to our internal structure
              const rawTransaction: AmexTransaction = {
                date: row['Date'] || '',
                description: row['Description'] || '',
                amount: parseFloat(row['Amount']) || 0,
                extendedDetails: row['Extended Details'] || '',
                appearsOnStatement: row['Appears On Your Statement As'] || '',
                address: row['Address'] || '',
                townCity: row['Town/City'] || '',
                postcode: row['Postcode'] || '',
                country: row['Country'] || '',
                reference: row['Reference'] || '',
                category: row['Category'] || 'Other',
              };

              return transformTransaction(rawTransaction, index);
            })
            .filter(t => t.date && !isNaN(t.parsedDate.getTime()));

          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      },
      error: (error: Error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}

/**
 * Validate that the CSV has the expected Amex UK format
 */
export function validateAmexCSV(headers: string[]): boolean {
  const requiredHeaders = ['Date', 'Description', 'Amount', 'Category'];
  return requiredHeaders.every(h => headers.includes(h));
}
