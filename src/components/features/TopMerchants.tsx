import type { MerchantTotal } from '@/types/transaction';
import { formatCurrency } from '@/lib/stats';

interface TopMerchantsProps {
  merchants: MerchantTotal[];
}

export function TopMerchants({ merchants }: TopMerchantsProps) {
  if (merchants.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No merchants found</p>;
  }

  const maxTotal = merchants[0]?.total || 1;

  return (
    <div className="space-y-3">
      {merchants.slice(0, 10).map((merchant, index) => (
        <div
          key={merchant.merchantName}
          className="relative p-4 rounded-xl bg-secondary/30 border border-border overflow-hidden"
        >
          {/* Progress bar background */}
          <div
            className="absolute inset-0 bg-primary/10"
            style={{ width: `${(merchant.total / maxTotal) * 100}%` }}
          />

          {/* Content */}
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 text-sm font-bold rounded-full bg-primary/20 text-primary">
                {index + 1}
              </span>
              <div>
                <p className="font-medium text-foreground">{merchant.merchantName}</p>
                <p className="text-sm text-muted-foreground">
                  {merchant.count} transaction{merchant.count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-foreground">{formatCurrency(merchant.total)}</p>
              <p className="text-sm text-muted-foreground">
                avg {formatCurrency(merchant.averageTransaction)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
