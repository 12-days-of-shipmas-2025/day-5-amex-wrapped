import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import type { Transaction } from '@/types/transaction';
import { formatCurrency } from '@/lib/stats';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Globe,
  RefreshCw,
  CreditCard,
  X,
} from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
}

type FilterType = 'all' | 'purchases' | 'refunds' | 'foreign' | 'payments';

interface FilterChip {
  id: FilterType;
  label: string;
  icon: React.ReactNode;
  count: (transactions: Transaction[]) => number;
}

const columnHelper = createColumnHelper<Transaction>();

const columns = [
  columnHelper.accessor('parsedDate', {
    header: 'Date',
    cell: info =>
      info.getValue().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    sortingFn: 'datetime',
  }),
  columnHelper.accessor('merchantName', {
    header: 'Merchant',
    cell: info => <span className="font-medium text-platinum">{info.getValue()}</span>,
  }),
  columnHelper.accessor('mainCategory', {
    header: 'Category',
    cell: info => <span className="badge-category">{info.getValue()}</span>,
  }),
  columnHelper.accessor('absoluteAmount', {
    header: 'Amount',
    cell: info => {
      const isRefund = info.row.original.isRefund;
      return (
        <span className={`font-semibold ${isRefund ? 'text-emerald-400' : 'text-foreground'}`}>
          {isRefund ? '+' : ''}
          {formatCurrency(info.getValue())}
        </span>
      );
    },
    sortingFn: 'basic',
  }),
];

const filterChips: FilterChip[] = [
  {
    id: 'all',
    label: 'All',
    icon: null,
    count: t => t.length,
  },
  {
    id: 'purchases',
    label: 'Purchases',
    icon: <CreditCard className="w-3.5 h-3.5" />,
    count: t => t.filter(tx => !tx.isRefund && !tx.isPayment).length,
  },
  {
    id: 'refunds',
    label: 'Refunds',
    icon: <RefreshCw className="w-3.5 h-3.5" />,
    count: t => t.filter(tx => tx.isRefund).length,
  },
  {
    id: 'foreign',
    label: 'Foreign',
    icon: <Globe className="w-3.5 h-3.5" />,
    count: t => t.filter(tx => tx.foreignCurrency).length,
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: <CreditCard className="w-3.5 h-3.5" />,
    count: t => t.filter(tx => tx.isPayment).length,
  },
];

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'parsedDate', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredData = useMemo(() => {
    let filtered = transactions;

    // Apply type filter
    switch (activeFilter) {
      case 'purchases':
        filtered = filtered.filter(t => !t.isRefund && !t.isPayment);
        break;
      case 'refunds':
        filtered = filtered.filter(t => t.isRefund);
        break;
      case 'foreign':
        filtered = filtered.filter(t => t.foreignCurrency);
        break;
      case 'payments':
        filtered = filtered.filter(t => t.isPayment);
        break;
    }

    // Apply search filter
    if (globalFilter) {
      const search = globalFilter.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.merchantName.toLowerCase().includes(search) ||
          t.mainCategory.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [transactions, globalFilter, activeFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="input-luxury w-full !pl-12"
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-silver" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {filterChips.map(chip => {
            const count = chip.count(transactions);
            const isActive = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${
                    isActive
                      ? 'bg-gold text-midnight'
                      : 'bg-midnight-lighter text-silver hover:text-platinum hover:bg-midnight-lighter/80'
                  }
                `}
              >
                {chip.icon}
                <span>{chip.label}</span>
                <span
                  className={`
                    px-1.5 py-0.5 rounded-full text-xs
                    ${isActive ? 'bg-midnight/20' : 'bg-white/10'}
                  `}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="card-glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-luxury">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="cursor-pointer select-none hover:text-gold-light transition-colors"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-silver">
          Showing{' '}
          <span className="text-platinum font-medium">
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="text-platinum font-medium">
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              filteredData.length
            )}
          </span>{' '}
          of <span className="text-platinum font-medium">{filteredData.length}</span> transactions
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2.5 rounded-lg card-glass hover:bg-gold/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-gold" />
          </button>
          <span className="px-4 py-2 rounded-lg bg-midnight-lighter text-platinum text-sm font-medium">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2.5 rounded-lg card-glass hover:bg-gold/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4 text-gold" />
          </button>
        </div>
      </div>
    </div>
  );
}
