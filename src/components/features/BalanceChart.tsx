import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { Transaction } from '@/types/transaction';
import { formatCurrency } from '@/lib/stats';

interface BalanceChartProps {
  transactions: Transaction[];
  height?: number;
}

interface BalanceDataPoint {
  date: string;
  dateLabel: string;
  balance: number;
  spending: number;
  payment: number;
}

export function BalanceChart({ transactions, height = 280 }: BalanceChartProps) {
  const data = useMemo(() => {
    if (transactions.length === 0) return [];

    // Sort all transactions by date
    const sorted = [...transactions].sort(
      (a, b) => a.parsedDate.getTime() - b.parsedDate.getTime()
    );

    // Group by day and calculate running balance
    const dailyData = new Map<string, { spending: number; payment: number }>();

    for (const t of sorted) {
      const dateKey = t.parsedDate.toISOString().split('T')[0];
      const existing = dailyData.get(dateKey) || { spending: 0, payment: 0 };

      if (t.isPayment) {
        existing.payment += t.absoluteAmount;
      } else if (!t.isRefund) {
        existing.spending += t.absoluteAmount;
      } else {
        // Refunds reduce spending
        existing.spending -= t.absoluteAmount;
      }

      dailyData.set(dateKey, existing);
    }

    // Convert to array with running balance
    let runningBalance = 0;
    const result: BalanceDataPoint[] = [];

    const sortedDates = Array.from(dailyData.keys()).sort();

    for (const date of sortedDates) {
      const day = dailyData.get(date)!;
      runningBalance += day.spending - day.payment;

      const dateObj = new Date(date);
      result.push({
        date,
        dateLabel: dateObj.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
        }),
        balance: Math.round(runningBalance * 100) / 100,
        spending: Math.round(day.spending * 100) / 100,
        payment: Math.round(day.payment * 100) / 100,
      });
    }

    return result;
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-silver" style={{ height }}>
        No transaction data
      </div>
    );
  }

  // Find payment dates for markers
  const paymentDates = data.filter(d => d.payment > 0);

  // Calculate totals
  const totalSpending = data.reduce((sum, d) => sum + d.spending, 0);
  const totalPayments = data.reduce((sum, d) => sum + d.payment, 0);
  const currentBalance = data[data.length - 1]?.balance || 0;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-silver uppercase tracking-wider mb-1">Total Billed</p>
          <p className="text-lg font-semibold text-foreground">{formatCurrency(totalSpending)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-silver uppercase tracking-wider mb-1">Total Paid</p>
          <p className="text-lg font-semibold text-emerald-400">{formatCurrency(totalPayments)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-silver uppercase tracking-wider mb-1">Balance</p>
          <p
            className={`text-lg font-semibold ${currentBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}
          >
            {formatCurrency(Math.abs(currentBalance))}
            {currentBalance < 0 && ' Credit'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="dateLabel"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={value => `£${(value / 1000).toFixed(0)}k`}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a2d47',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: '12px',
              padding: '12px 16px',
            }}
            labelStyle={{ color: '#e5e7eb', marginBottom: '8px', fontWeight: 500 }}
            formatter={(value, name) => {
              const labels: Record<string, string> = {
                balance: 'Balance',
                spending: 'Spent',
                payment: 'Paid',
              };
              return [formatCurrency(Number(value) || 0), labels[name as string] || name];
            }}
          />
          <ReferenceLine y={0} stroke="#374151" strokeDasharray="3 3" />
          {/* Payment markers */}
          {paymentDates.map((d, i) => (
            <ReferenceLine
              key={i}
              x={d.dateLabel}
              stroke="#10b981"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
          ))}
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#balanceGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-silver">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-amber-500" />
          <span>Balance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-dashed border-emerald-500 rounded-sm" />
          <span>Payment Date</span>
        </div>
      </div>
    </div>
  );
}
