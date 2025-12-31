import { useTransactionStore } from '@/store/transaction-store';
import { formatCurrency } from '@/lib/stats';
import { StatCard } from './StatCard';
import { MonthlyChart } from './MonthlyChart';
import { BalanceChart } from './BalanceChart';
import { TransactionTable } from './TransactionTable';
import { X, Play, TrendingUp, Calendar, Globe } from 'lucide-react';
import { useState } from 'react';
import { StoryMode } from './StoryMode';

export function WrappedDashboard() {
  const { stats, transactions, clearData } = useTransactionStore();
  const [showStory, setShowStory] = useState(false);

  if (!stats) return null;

  const dateRangeStr =
    stats.dateRange.start && stats.dateRange.end
      ? `${stats.dateRange.start.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} — ${stats.dateRange.end.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
      : '';

  if (showStory) {
    return <StoryMode stats={stats} onClose={() => setShowStory(false)} />;
  }

  return (
    <div className="min-h-screen pb-20 grain-overlay">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-medium text-foreground tracking-tight">
              Your <span className="text-gold-gradient">Amex</span> Wrapped
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-3.5 h-3.5 text-gold-muted" />
              <p className="text-sm text-silver">{dateRangeStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowStory(true)} className="btn-gold flex items-center gap-2">
              <Play className="w-4 h-4" />
              <span>View Story</span>
            </button>
            <button onClick={clearData} className="btn-ghost flex items-center gap-2">
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-10">
        {/* Hero Section */}
        <section className="mb-16 animate-fade-up">
          <div className="card-glass rounded-2xl p-8 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative">
              {/* Total spent header */}
              <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-6">
                <div>
                  <p className="text-label mb-3">Total Spent</p>
                  <h2 className="text-display-xl text-gold-gradient">
                    {formatCurrency(stats.totalSpent)}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-silver">
                  <TrendingUp className="w-4 h-4 text-gold-muted" />
                  <span className="text-sm">{stats.transactionCount} transactions</span>
                </div>
              </div>

              {/* Chart */}
              <div className="mt-4">
                <p className="text-label mb-4">Monthly Spending</p>
                <MonthlyChart data={stats.monthlySpending} height={320} />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16 animate-fade-up stagger-1">
          <StatCard
            label="Average Transaction"
            value={formatCurrency(stats.averageTransaction)}
            icon="receipt"
          />
          <StatCard
            label="Unique Merchants"
            value={stats.uniqueMerchants.toString()}
            icon="store"
          />
          <StatCard
            label="Refunds Received"
            value={formatCurrency(stats.totalRefunds)}
            icon="refresh"
          />
          <StatCard
            label="Net Spending"
            value={formatCurrency(stats.netSpending)}
            icon="wallet"
            highlight
          />
        </section>

        {/* Highlights Row */}
        <section className="grid md:grid-cols-2 gap-6 mb-16">
          {/* Biggest Purchase */}
          {stats.biggestPurchase && (
            <div className="card-glass rounded-2xl p-6 animate-fade-up stagger-2">
              <div className="flex items-start justify-between mb-4">
                <p className="text-label">Biggest Single Purchase</p>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <span className="text-lg">💎</span>
                </div>
              </div>
              <p className="text-display-lg text-gold-gradient mb-2">
                {formatCurrency(stats.biggestPurchase.absoluteAmount)}
              </p>
              <p className="text-platinum font-medium mb-1">{stats.biggestPurchase.merchantName}</p>
              <p className="text-sm text-silver">
                {stats.biggestPurchase.parsedDate.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          )}

          {/* Most Frequent Merchant */}
          {stats.mostFrequentMerchant && (
            <div className="card-glass rounded-2xl p-6 animate-fade-up stagger-3">
              <div className="flex items-start justify-between mb-4">
                <p className="text-label">Your Favourite Merchant</p>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <span className="text-lg">❤️</span>
                </div>
              </div>
              <p className="text-display-lg text-foreground mb-2 leading-tight">
                {stats.mostFrequentMerchant.merchantName}
              </p>
              <p className="text-platinum">
                <span className="text-gold font-semibold">{stats.mostFrequentMerchant.count}</span>{' '}
                {stats.mostFrequentMerchant.count === 1 ? 'visit' : 'visits'} totaling{' '}
                <span className="text-gold font-semibold">
                  {formatCurrency(stats.mostFrequentMerchant.total)}
                </span>
              </p>
            </div>
          )}
        </section>

        {/* Foreign Currency Spending */}
        {stats.foreignSpend.transactionCount > 0 && (
          <section className="mb-16 animate-fade-up stagger-4">
            <div className="card-glass rounded-2xl p-8 overflow-hidden relative">
              {/* Background decoration */}
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-label">International Spending</p>
                    <p className="text-sm text-silver">
                      {stats.foreignSpend.transactionCount} foreign{' '}
                      {stats.foreignSpend.transactionCount === 1 ? 'transaction' : 'transactions'}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <p className="text-sm text-silver mb-1">Total Foreign Spend (in GBP)</p>
                    <p className="text-display-lg text-gold-gradient">
                      {formatCurrency(stats.foreignSpend.totalGBP)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-silver mb-1">FX Commission Paid</p>
                    <p className="text-display-md text-foreground">
                      {formatCurrency(stats.foreignSpend.totalCommission)}
                    </p>
                  </div>
                </div>

                {/* Currency breakdown */}
                {stats.foreignSpend.byCurrency.length > 0 && (
                  <div>
                    <p className="text-label mb-4">Currencies Used</p>
                    <div className="grid gap-3">
                      {stats.foreignSpend.byCurrency.slice(0, 5).map(currency => (
                        <div
                          key={currency.currencyCode}
                          className="flex items-center justify-between p-4 rounded-xl bg-midnight-lighter/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                              <span className="text-sm font-mono font-semibold text-gold">
                                {currency.currencyCode}
                              </span>
                            </div>
                            <div>
                              <p className="text-foreground font-medium">{currency.currency}</p>
                              <p className="text-xs text-silver">
                                {currency.transactionCount}{' '}
                                {currency.transactionCount === 1 ? 'transaction' : 'transactions'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-foreground font-semibold">
                              {formatCurrency(currency.totalGBP)}
                            </p>
                            <p className="text-xs text-silver font-mono">
                              {currency.totalForeign.toLocaleString('en-GB', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{' '}
                              {currency.currencyCode}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Top Categories */}
        {stats.topCategories.length > 0 && (
          <section className="mb-16 animate-fade-up stagger-4">
            <p className="text-label mb-6">Spending by Category</p>
            <div className="grid gap-3">
              {stats.topCategories.slice(0, 5).map((category, index) => (
                <div
                  key={category.category}
                  className="card-glass rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium truncate">{category.category}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-midnight-lighter overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-muted to-gold"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-semibold">
                      {formatCurrency(category.total)}
                    </p>
                    <p className="text-xs text-silver">{category.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Balance Over Time */}
        <section className="mb-16 animate-fade-up stagger-5">
          <div className="card-glass rounded-2xl p-6">
            <p className="text-label mb-6">Balance Over Time</p>
            <BalanceChart transactions={transactions} height={280} />
          </div>
        </section>

        {/* Transaction Table */}
        <section className="animate-fade-up stagger-6">
          <p className="text-label mb-6">All Transactions</p>
          <TransactionTable transactions={transactions} />
        </section>
      </main>
    </div>
  );
}
