import { create } from 'zustand';
import type { Transaction, WrappedStats } from '@/types/transaction';
import { parseAmexCSV, type AmexFormat } from '@/lib/csv-parser';
import { calculateWrappedStats, setCurrencyConfig } from '@/lib/stats';

interface TransactionState {
  // Data
  transactions: Transaction[];
  stats: WrappedStats | null;
  fileName: string | null;
  format: AmexFormat | null;
  currency: string;
  currencyLocale: string;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Actions
  loadCSV: (file: File) => Promise<void>;
  clearData: () => void;
}

export const useTransactionStore = create<TransactionState>(set => ({
  // Initial state
  transactions: [],
  stats: null,
  fileName: null,
  format: null,
  currency: 'GBP',
  currencyLocale: 'en-GB',
  isLoading: false,
  error: null,

  // Load and parse CSV file
  loadCSV: async (file: File) => {
    set({ isLoading: true, error: null });

    try {
      const content = await file.text();
      const result = await parseAmexCSV(content);

      if (result.transactions.length === 0) {
        throw new Error('No valid transactions found in the CSV file');
      }

      // Set the currency config for formatting
      setCurrencyConfig(result.currency, result.currencyLocale);

      const stats = calculateWrappedStats(result.transactions);

      set({
        transactions: result.transactions,
        stats,
        fileName: file.name,
        format: result.format,
        currency: result.currency,
        currencyLocale: result.currencyLocale,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to parse CSV file',
      });
    }
  },

  // Clear all data
  clearData: () => {
    // Reset currency to default
    setCurrencyConfig('GBP', 'en-GB');
    set({
      transactions: [],
      stats: null,
      fileName: null,
      format: null,
      currency: 'GBP',
      currencyLocale: 'en-GB',
      isLoading: false,
      error: null,
    });
  },
}));
