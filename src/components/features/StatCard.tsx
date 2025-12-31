import { Receipt, Store, RefreshCw, Wallet } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: 'receipt' | 'store' | 'refresh' | 'wallet';
  highlight?: boolean;
}

const icons = {
  receipt: Receipt,
  store: Store,
  refresh: RefreshCw,
  wallet: Wallet,
};

export function StatCard({ label, value, icon, highlight = false }: StatCardProps) {
  const Icon = icons[icon];

  return (
    <div
      className={`
        relative overflow-hidden p-5 rounded-xl
        ${highlight ? 'card-gold' : 'card-glass'}
        transition-all duration-300 hover:scale-[1.02]
        group
      `}
    >
      {/* Subtle shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-gold/10">
            <Icon className="w-3.5 h-3.5 text-gold" />
          </div>
          <span className="text-label">{label}</span>
        </div>
        <p
          className={`text-2xl font-semibold ${highlight ? 'text-gold-gradient' : 'text-foreground'}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
