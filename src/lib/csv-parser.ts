import Papa from 'papaparse';
import type { AmexTransaction, Transaction, ForeignCurrencyInfo } from '@/types/transaction';

/**
 * Detected CSV format type
 */
export type AmexFormat = 'uk' | 'mexico';

/**
 * Result of parsing with detected format info
 */
export interface ParseResult {
  transactions: Transaction[];
  format: AmexFormat;
  currency: string;
  currencyLocale: string;
}

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
  'SERBIAN DINAR': 'RSD',
  'QATARI RIAL': 'QAR',
  'QATARI RIYAL': 'QAR',
  'MALAYSIAN RINGGIT': 'MYR',
  'PHILIPPINE PESO': 'PHP',
  'INDONESIAN RUPIAH': 'IDR',
  'KOREAN WON': 'KRW',
  'SOUTH KOREAN WON': 'KRW',
  'TAIWANESE DOLLAR': 'TWD',
  'VIETNAMESE DONG': 'VND',
  'EGYPTIAN POUND': 'EGP',
  'MOROCCAN DIRHAM': 'MAD',
  'ICELANDIC KRONA': 'ISK',
  'CROATIAN KUNA': 'HRK',
  'ROMANIAN LEU': 'RON',
  'BULGARIAN LEV': 'BGN',
};

/**
 * Parse a UK date string (DD/MM/YYYY) to a Date object
 */
export function parseUKDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Parse a Mexico date string (DD MMM YYYY) to a Date object
 * Example: "29 Dec 2025"
 */
export function parseMexicoDate(dateStr: string): Date {
  const months: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };
  const parts = dateStr.trim().split(' ');
  if (parts.length !== 3) return new Date(NaN);

  const day = parseInt(parts[0], 10);
  const month = months[parts[1]];
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || month === undefined || isNaN(year)) return new Date(NaN);
  return new Date(year, month, day);
}

/**
 * Detect CSV format based on headers
 */
export function detectAmexFormat(headers: string[]): AmexFormat | null {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase());

  // UK format headers
  if (normalizedHeaders.includes('date') && normalizedHeaders.includes('category')) {
    return 'uk';
  }

  // Mexico format headers (Spanish)
  if (normalizedHeaders.includes('fecha') && normalizedHeaders.includes('importe')) {
    return 'mexico';
  }

  return null;
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

    // Parse the amount (remove thousands separator commas)
    const foreignAmountStr = foreignMatch[1].replace(/,/g, '');
    const foreignAmount = parseFloat(foreignAmountStr);
    const currency = foreignMatch[2].trim();

    // Parse commission (remove thousands separator commas)
    const commissionMatch = extendedDetails.match(/Commission Amount:\s*([\d,.]+)/i);
    const commission = commissionMatch ? parseFloat(commissionMatch[1].replace(/,/g, '')) : 0;

    // Parse exchange rate (remove thousands separator commas)
    const rateMatch = extendedDetails.match(/Currency Exchange Rate:\s*([\d,.]+)/i);
    const exchangeRate = rateMatch ? parseFloat(rateMatch[1].replace(/,/g, '')) : 0;

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
/**
 * Check if a transaction is a payment to the card (not a purchase)
 */
function isPaymentTransaction(description: string): boolean {
  const paymentPatterns = [
    /^PAYMENT RECEIVED/i,
    /^PAYMENT - THANK YOU/i,
    /^DIRECT DEBIT PAYMENT/i,
    /^GRACIAS POR SU PAGO/i, // Mexico: "Thank you for your payment"
  ];
  return paymentPatterns.some(pattern => pattern.test(description));
}

/**
 * Auto-categorize transactions based on merchant description
 * Used for formats that don't include category (like Mexico)
 */
function autoCategorizeMerchant(description: string): string {
  const desc = description.toUpperCase();

  // Restaurants & Food
  if (
    /UBER EATS|RAPPI|DIDI FOOD|REST(?:AURANT)?|CAFE|COFFEE|STARBUCKS|MCDONALD|BURGER|PIZZA|TACO|SUSHI|BAR |CANTINA/.test(
      desc
    )
  ) {
    return 'Restaurant-Restaurants';
  }

  // Groceries
  if (
    /WALMART|SUPERMARKET|SUPERCENTER|SORIANA|CHEDRAUI|COSTCO|SAM'S|BODEGA|OXXO|7-ELEVEN|MERCADO/.test(
      desc
    )
  ) {
    return 'Merchandise & Supplies-Groceries';
  }

  // Transportation
  if (/UBER(?! EATS)|DIDI|CABIFY|TAXI|GASOLINA|GAS STATION|PEMEX|ESTACION/.test(desc)) {
    return 'Transportation-Travel';
  }

  // Entertainment & Streaming
  if (
    /NETFLIX|SPOTIFY|DISNEY|PRIME VIDEO|HBO|APPLE.*MUSIC|YOUTUBE|CINEPOLIS|CINEMEX|TICKETMASTER/.test(
      desc
    )
  ) {
    return 'Entertainment-Entertainment';
  }

  // Shopping & Retail
  if (
    /AMAZON|MERCADOLIBRE|LIVERPOOL|PALACIO|ZARA|H&M|NIKE|ADIDAS|SHEIN|AMERICAN EAGLE/.test(desc)
  ) {
    return 'Merchandise & Supplies-Retail';
  }

  // Technology & Software
  if (/PAYPAL|APPLE|GOOGLE|MICROSOFT|ADOBE|CANVA|DROPBOX|NOTION|SLACK/.test(desc)) {
    return 'Business Services-Technology';
  }

  // Travel & Hotels
  if (/MARRIOTT|HILTON|HOTEL|AIRBNB|BOOKING|EXPEDIA|AEROMEXICO|VOLARIS|VIVA/.test(desc)) {
    return 'Travel-Travel';
  }

  // Utilities & Services
  if (/CFE|TELMEX|IZZI|TOTALPLAY|MEGACABLE|STARLINK|NETFLIX|INTERNET/.test(desc)) {
    return 'Utilities-Services';
  }

  // Default
  return 'Other-Other';
}

export function transformTransaction(raw: AmexTransaction, index: number): Transaction {
  const parsedDate = parseUKDate(raw.date);
  const amount = typeof raw.amount === 'string' ? parseFloat(raw.amount) : raw.amount;
  const isPayment = isPaymentTransaction(raw.description);

  return {
    ...raw,
    amount,
    id: generateId(raw, index),
    parsedDate,
    absoluteAmount: Math.abs(amount),
    isRefund: amount < 0 && !isPayment,
    isPayment,
    mainCategory: parseMainCategory(raw.category),
    subCategory: parseSubCategory(raw.category),
    merchantName: extractMerchantName(raw.description),
    foreignCurrency: parseForeignCurrency(raw.extendedDetails),
  };
}

/**
 * Transform Mexico format transaction to enriched Transaction
 */
export function transformMexicoTransaction(
  row: Record<string, string>,
  index: number
): Transaction {
  const dateStr = row['Fecha'] || row['Fecha de Compra'] || '';
  const parsedDate = parseMexicoDate(dateStr);
  const description = row['Descripción'] || '';
  const amount = parseFloat(row['Importe']) || 0;
  const isPayment = isPaymentTransaction(description);

  // Auto-categorize since Mexico format doesn't have categories
  const category = autoCategorizeMerchant(description);

  const rawTransaction: AmexTransaction = {
    date: dateStr,
    description,
    amount,
    extendedDetails: '',
    appearsOnStatement: description,
    address: '',
    townCity: '',
    postcode: '',
    country: 'Mexico',
    reference: `MX-${index}`,
    category,
  };

  return {
    ...rawTransaction,
    id: `MX-${index}`,
    parsedDate,
    absoluteAmount: Math.abs(amount),
    isRefund: amount < 0 && !isPayment,
    isPayment,
    mainCategory: parseMainCategory(category),
    subCategory: parseSubCategory(category),
    merchantName: extractMerchantName(description),
    foreignCurrency: null,
  };
}

/**
 * Parse Amex CSV file content (auto-detects UK or Mexico format)
 */
export function parseAmexCSV(csvContent: string): Promise<ParseResult> {
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
          // Detect format from headers
          const headers = results.meta.fields || [];
          const format = detectAmexFormat(headers);

          if (!format) {
            reject(
              new Error('Unrecognized CSV format. Please upload an Amex UK or Mexico statement.')
            );
            return;
          }

          let transactions: Transaction[];

          if (format === 'mexico') {
            // Parse Mexico format
            transactions = results.data
              .map((row, index) => transformMexicoTransaction(row, index))
              .filter(t => t.date && !isNaN(t.parsedDate.getTime()));

            resolve({
              transactions,
              format: 'mexico',
              currency: 'MXN',
              currencyLocale: 'es-MX',
            });
          } else {
            // Parse UK format
            transactions = results.data
              .map((row, index) => {
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

            resolve({
              transactions,
              format: 'uk',
              currency: 'GBP',
              currencyLocale: 'en-GB',
            });
          }
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
