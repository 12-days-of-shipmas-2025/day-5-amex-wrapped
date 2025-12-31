import { create } from 'zustand';
import type { Transaction, WrappedStats } from '@/types/transaction';
import { parseAmexCSV } from '@/lib/csv-parser';
import { calculateWrappedStats } from '@/lib/stats';

interface TransactionState {
  // Data
  transactions: Transaction[];
  stats: WrappedStats | null;
  fileName: string | null;

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
  isLoading: false,
  error: null,

  // Load and parse CSV file
  loadCSV: async (file: File) => {
    set({ isLoading: true, error: null });

    try {
      const content = await file.text();
      const transactions = await parseAmexCSV(content);

      if (transactions.length === 0) {
        throw new Error('No valid transactions found in the CSV file');
      }

      const stats = calculateWrappedStats(transactions);

      set({
        transactions,
        stats,
        fileName: file.name,
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
    set({
      transactions: [],
      stats: null,
      fileName: null,
      isLoading: false,
      error: null,
    });
  },
}));
