import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { CategoryTotal } from '@/types/transaction';
import { formatCurrency } from '@/lib/stats';

interface CategoryChartProps {
  categories: CategoryTotal[];
}

const COLORS = [
  '#006fcf', // Amex Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#84cc16', // Lime
];

export function CategoryChart({ categories }: CategoryChartProps) {
  if (categories.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No data available</p>;
  }

  const data = categories.map((cat, index) => ({
    name: cat.category,
    value: cat.total,
    percentage: cat.percentage,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={50}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={value => formatCurrency(Number(value))}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={50}
            formatter={value => {
              const item = data.find(d => d.name === value);
              return (
                <span className="text-sm text-foreground">
                  {value} ({item?.percentage ?? 0}%)
                </span>
              );
            }}
            wrapperStyle={{ paddingTop: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
