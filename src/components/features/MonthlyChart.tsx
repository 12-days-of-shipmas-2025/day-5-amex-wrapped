import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { MonthlySpending } from '@/types/transaction';
import { formatCurrency, getCurrencySymbol } from '@/lib/stats';

interface MonthlyChartProps {
  data: MonthlySpending[];
  height?: number;
}

export function MonthlyChart({ data, height = 320 }: MonthlyChartProps) {
  if (data.length === 0) {
    return <p className="text-silver text-center py-12 font-light">No spending data available</p>;
  }

  // Calculate stats
  const maxSpending = Math.max(...data.map(d => d.total));
  const avgSpending = data.reduce((sum, d) => sum + d.total, 0) / data.length;
  const maxMonth = data.find(d => d.total === maxSpending);

  return (
    <div className="relative" style={{ height }}>
      {/* Chart */}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c9a962" stopOpacity={0.4} />
              <stop offset="50%" stopColor="#c9a962" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#c9a962" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="goldStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b7a4d" />
              <stop offset="50%" stopColor="#c9a962" />
              <stop offset="100%" stopColor="#dfc98a" />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="1 6" stroke="rgba(201, 169, 98, 0.1)" vertical={false} />

          <XAxis
            dataKey="monthLabel"
            tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            dy={12}
            interval={0}
          />

          <YAxis
            tickFormatter={value => {
              const symbol = getCurrencySymbol();
              if (value >= 1000) return `${symbol}${(value / 1000).toFixed(0)}k`;
              return `${symbol}${value}`;
            }}
            tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            width={55}
            tickCount={5}
          />

          {/* Average line */}
          <ReferenceLine
            y={avgSpending}
            stroke="#8b7a4d"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />

          <Tooltip
            formatter={value => [formatCurrency(Number(value)), 'Spent']}
            contentStyle={{
              backgroundColor: 'rgba(12, 25, 41, 0.95)',
              border: '1px solid rgba(201, 169, 98, 0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
            labelStyle={{
              color: '#c9a962',
              fontWeight: 600,
              marginBottom: 6,
              fontSize: 13,
              letterSpacing: '0.02em',
            }}
            itemStyle={{
              color: '#f4f3f1',
              fontSize: 15,
              fontWeight: 500,
            }}
            cursor={{ stroke: 'rgba(201, 169, 98, 0.3)', strokeWidth: 1 }}
          />

          <Area
            type="monotone"
            dataKey="total"
            stroke="url(#goldStroke)"
            strokeWidth={2.5}
            fill="url(#goldGradient)"
            dot={false}
            activeDot={{
              r: 6,
              fill: '#c9a962',
              stroke: '#0c1929',
              strokeWidth: 3,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Peak month indicator */}
      {maxMonth && (
        <div className="absolute top-4 right-4 text-right">
          <p className="text-label mb-1">Peak Month</p>
          <p className="text-lg font-semibold text-foreground">{maxMonth.monthLabel}</p>
          <p className="text-sm text-gold">{formatCurrency(maxMonth.total)}</p>
        </div>
      )}
    </div>
  );
}
