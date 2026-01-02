import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { WrappedStats } from '@/types/transaction';
import { formatCurrency } from '@/lib/stats';
import { Fireworks } from './Fireworks';
import { X, ChevronLeft, ChevronRight, Sparkles, Trophy, TrendingUp, Star } from 'lucide-react';

interface YearRecapProps {
  stats: WrappedStats;
  onClose: () => void;
}

interface Milestone {
  month: number; // 0-11
  type: 'biggest_purchase' | 'most_spent_month' | 'milestone' | 'first_transaction' | 'new_year';
  title: string;
  subtitle: string;
  value?: string;
  icon: React.ReactNode;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function YearRecap({ stats, onClose }: YearRecapProps) {
  const [currentMonth, setCurrentMonth] = useState(0);
  const [fireworkTrigger, setFireworkTrigger] = useState(0);
  const [visitedMilestones, setVisitedMilestones] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const lastMilestoneRef = useRef<string | null>(null);

  // Calculate milestones from stats
  const milestones = useMemo(() => {
    const result: Milestone[] = [];

    // New Year celebration at month 0
    result.push({
      month: 0,
      type: 'new_year',
      title: 'Happy New Year!',
      subtitle: `Welcome to ${stats.dateRange.start?.getFullYear() || 2025}`,
      icon: <Sparkles className="w-6 h-6 text-gold" />,
    });

    // First transaction month
    if (stats.dateRange.start) {
      const firstMonth = stats.dateRange.start.getMonth();
      result.push({
        month: firstMonth,
        type: 'first_transaction',
        title: 'First Transaction',
        subtitle: 'Your journey begins',
        icon: <Star className="w-6 h-6 text-emerald-400" />,
      });
    }

    // Biggest purchase
    if (stats.biggestPurchase) {
      const purchaseMonth = stats.biggestPurchase.parsedDate.getMonth();
      result.push({
        month: purchaseMonth,
        type: 'biggest_purchase',
        title: 'Biggest Splurge!',
        subtitle: stats.biggestPurchase.merchantName,
        value: formatCurrency(stats.biggestPurchase.absoluteAmount),
        icon: <Trophy className="w-6 h-6 text-amber-400" />,
      });
    }

    // Most spent month
    if (stats.monthlySpending.length > 0) {
      const maxMonth = stats.monthlySpending.reduce((a, b) => (a.total > b.total ? a : b));
      const monthIndex = stats.monthlySpending.indexOf(maxMonth);
      result.push({
        month: monthIndex,
        type: 'most_spent_month',
        title: 'Biggest Month!',
        subtitle: `You went all out in ${maxMonth.monthLabel}`,
        value: formatCurrency(maxMonth.total),
        icon: <TrendingUp className="w-6 h-6 text-rose-400" />,
      });
    }

    // Add spending milestones (every 25% of total)
    const totalSpent = stats.netSpending;
    let runningTotal = 0;
    const milestoneThresholds = [0.25, 0.5, 0.75, 1.0];
    let thresholdIndex = 0;

    stats.monthlySpending.forEach((month, idx) => {
      runningTotal += month.total;
      while (
        thresholdIndex < milestoneThresholds.length &&
        runningTotal >= totalSpent * milestoneThresholds[thresholdIndex]
      ) {
        const percentage = Math.round(milestoneThresholds[thresholdIndex] * 100);
        result.push({
          month: idx,
          type: 'milestone',
          title: `${percentage}% Spent!`,
          subtitle: `${formatCurrency(runningTotal)} of your yearly total`,
          icon: <Sparkles className="w-6 h-6 text-violet-400" />,
        });
        thresholdIndex++;
      }
    });

    // End of year
    result.push({
      month: 11,
      type: 'new_year',
      title: 'Year Complete!',
      subtitle: `Total: ${formatCurrency(stats.netSpending)}`,
      icon: <Sparkles className="w-6 h-6 text-gold" />,
    });

    return result.sort((a, b) => a.month - b.month);
  }, [stats]);

  // Get milestones for current month
  const currentMilestones = useMemo(() => {
    return milestones.filter(m => m.month === currentMonth);
  }, [milestones, currentMonth]);

  // Get monthly spending for current month
  const currentMonthData = useMemo(() => {
    return stats.monthlySpending[currentMonth];
  }, [stats.monthlySpending, currentMonth]);

  // Calculate cumulative spending up to current month
  const cumulativeSpending = useMemo(() => {
    return stats.monthlySpending.slice(0, currentMonth + 1).reduce((sum, m) => sum + m.total, 0);
  }, [stats.monthlySpending, currentMonth]);

  // Handle milestone visits
  useEffect(() => {
    currentMilestones.forEach(milestone => {
      const key = `${milestone.month}-${milestone.type}`;
      if (!visitedMilestones.has(key) && lastMilestoneRef.current !== key) {
        lastMilestoneRef.current = key;
        setVisitedMilestones(prev => new Set([...prev, key]));
        // Trigger fireworks!
        setFireworkTrigger(t => t + 1);
      }
    });
  }, [currentMilestones, visitedMilestones]);

  // Handle timeline drag
  const handleTimelineInteraction = useCallback((clientX: number) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const month = Math.round(percentage * 11);
    setCurrentMonth(month);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleTimelineInteraction(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleTimelineInteraction(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleTimelineInteraction(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      handleTimelineInteraction(e.touches[0].clientX);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentMonth(m => Math.min(11, m + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentMonth(m => Math.max(0, m - 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Get spending bar height for each month
  const maxSpending = Math.max(...stats.monthlySpending.map(m => m.total));

  return (
    <div
      className="fixed inset-0 z-50 bg-gradient-to-b from-[#0a0a1a] via-[#0c1929] to-[#0a0a1a]"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* Fireworks */}
      <Fireworks trigger={fireworkTrigger} intensity="high" />

      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
              opacity: Math.random() * 0.5 + 0.2,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20">
        <div>
          <h1 className="font-display text-3xl text-gold-gradient mb-1">
            {stats.dateRange.start?.getFullYear() || 2025} Recap
          </h1>
          <p className="text-silver text-sm">Drag the timeline to explore your year</p>
        </div>
        <button
          onClick={onClose}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        >
          <X className="w-5 h-5 text-platinum" />
        </button>
      </div>

      {/* Main content */}
      <div className="h-full flex flex-col justify-center px-8 pt-24 pb-48">
        {/* Current month display */}
        <div className="text-center mb-8">
          <p className="text-6xl font-display text-gold-gradient mb-2">
            {MONTH_NAMES[currentMonth]}
          </p>
          {currentMonthData && (
            <p className="text-2xl text-platinum">{formatCurrency(currentMonthData.total)} spent</p>
          )}
        </div>

        {/* Milestones */}
        {currentMilestones.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {currentMilestones.map((milestone, i) => (
              <div
                key={`${milestone.month}-${milestone.type}-${i}`}
                className="card-glass rounded-2xl p-6 text-center animate-scale-in max-w-xs"
              >
                <div className="flex justify-center mb-3">{milestone.icon}</div>
                <p className="text-xl font-display text-gold mb-1">{milestone.title}</p>
                <p className="text-silver text-sm mb-2">{milestone.subtitle}</p>
                {milestone.value && (
                  <p className="text-2xl font-display text-platinum">{milestone.value}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Cumulative total */}
        <div className="text-center mb-4">
          <p className="text-sm text-silver">Cumulative spending</p>
          <p className="text-xl text-platinum">{formatCurrency(cumulativeSpending)}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/50 to-transparent">
        {/* Navigation buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setCurrentMonth(m => Math.max(0, m - 1))}
            disabled={currentMonth === 0}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-platinum" />
          </button>
          <button
            onClick={() => setCurrentMonth(m => Math.min(11, m + 1))}
            disabled={currentMonth === 11}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-5 h-5 text-platinum" />
          </button>
        </div>

        {/* Month bars */}
        <div
          ref={timelineRef}
          className="relative h-32 flex items-end justify-between gap-1 cursor-pointer select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {stats.monthlySpending.map((month, idx) => {
            const height = maxSpending > 0 ? (month.total / maxSpending) * 100 : 0;
            const isActive = idx === currentMonth;
            const hasMilestone = milestones.some(m => m.month === idx);

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-2"
                onClick={() => setCurrentMonth(idx)}
              >
                {/* Milestone indicator */}
                {hasMilestone && <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />}

                {/* Bar */}
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-t from-gold to-gold-light'
                      : idx < currentMonth
                        ? 'bg-gradient-to-t from-gold/40 to-gold/20'
                        : 'bg-white/10 hover:bg-white/20'
                  }`}
                  style={{ height: `${Math.max(height, 5)}%` }}
                />

                {/* Month label */}
                <p
                  className={`text-xs transition-colors ${
                    isActive ? 'text-gold font-semibold' : 'text-silver'
                  }`}
                >
                  {MONTH_NAMES[idx].slice(0, 3)}
                </p>
              </div>
            );
          })}

          {/* Current position indicator */}
          <div
            className="absolute bottom-16 h-0.5 bg-gold/50 transition-all duration-300"
            style={{
              left: 0,
              width: `${((currentMonth + 0.5) / 12) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
