import { useState, useEffect, useCallback, useMemo } from 'react';
import type { WrappedStats } from '@/types/transaction';
import { formatCurrency } from '@/lib/stats';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface StoryModeProps {
  stats: WrappedStats;
  onClose: () => void;
}

interface Slide {
  id: string;
  background: string;
  render: (stats: WrappedStats) => React.ReactNode;
}

function getSlides(stats: WrappedStats): Slide[] {
  const slides: Slide[] = [
    {
      id: 'intro',
      background: 'from-[#0c1929] via-[#132238] to-[#1a2d47]',
      render: stats => (
        <div className="text-center">
          <p className="text-lg text-gold/80 mb-6 animate-fade-in tracking-widest uppercase">
            Your Year with Amex
          </p>
          <h1 className="font-display text-7xl sm:text-9xl font-medium text-gold-gradient mb-8 animate-scale-in">
            {stats.dateRange.start?.getFullYear() || new Date().getFullYear()}
          </h1>
          <p className="text-2xl text-platinum/80 animate-fade-in-delayed font-light tracking-wide">
            Wrapped
          </p>
        </div>
      ),
    },
    {
      id: 'total-spent',
      background: 'from-[#0c1929] via-[#1a2d47] to-[#0c1929]',
      render: stats => (
        <div className="text-center">
          <p className="text-lg text-gold/80 mb-6 animate-fade-in tracking-widest uppercase">
            This year, you spent
          </p>
          <h1 className="font-display text-6xl sm:text-8xl font-medium text-gold-gradient mb-8 animate-scale-in">
            {formatCurrency(stats.totalSpent)}
          </h1>
          <p className="text-xl text-platinum/80 animate-fade-in-delayed font-light">
            across <span className="text-gold font-medium">{stats.transactionCount}</span>{' '}
            transactions
          </p>
        </div>
      ),
    },
    {
      id: 'biggest-purchase',
      background: 'from-[#1a1a0c] via-[#2d2810] to-[#1a1a0c]',
      render: stats => (
        <div className="text-center">
          <p className="text-lg text-gold/80 mb-6 animate-fade-in tracking-widest uppercase">
            Your biggest splurge
          </p>
          <h1 className="font-display text-6xl sm:text-8xl font-medium text-gold-gradient mb-6 animate-scale-in">
            {stats.biggestPurchase ? formatCurrency(stats.biggestPurchase.absoluteAmount) : '£0'}
          </h1>
          <p className="text-xl text-platinum mb-3 animate-fade-in-delayed font-light">
            {stats.biggestPurchase?.merchantName || 'No purchases'}
          </p>
          <p className="text-sm text-silver/60 animate-fade-in-delayed">
            {stats.biggestPurchase?.parsedDate.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
      ),
    },
    {
      id: 'favorite-merchant',
      background: 'from-[#0c1929] via-[#132238] to-[#1a2d47]',
      render: stats => (
        <div className="text-center">
          <p className="text-lg text-gold/80 mb-6 animate-fade-in tracking-widest uppercase">
            Your favourite place
          </p>
          <h1 className="font-display text-4xl sm:text-6xl font-medium text-foreground mb-6 animate-scale-in leading-tight">
            {stats.mostFrequentMerchant?.merchantName || 'Unknown'}
          </h1>
          <p className="text-xl text-platinum/80 animate-fade-in-delayed font-light mb-2">
            <span className="text-gold font-medium">{stats.mostFrequentMerchant?.count || 0}</span>{' '}
            {stats.mostFrequentMerchant?.count === 1 ? 'visit' : 'visits'}
          </p>
          <p className="text-lg text-silver/60 animate-fade-in-delayed font-light">
            {stats.mostFrequentMerchant ? formatCurrency(stats.mostFrequentMerchant.total) : '£0'}{' '}
            spent
          </p>
        </div>
      ),
    },
    {
      id: 'top-category',
      background: 'from-[#1a1a0c] via-[#2d2810] to-[#1a1a0c]',
      render: stats => {
        const topCategory = stats.topCategories[0];
        return (
          <div className="text-center">
            <p className="text-lg text-gold/80 mb-6 animate-fade-in tracking-widest uppercase">
              You loved spending on
            </p>
            <h1 className="font-display text-4xl sm:text-6xl font-medium text-gold-gradient mb-6 animate-scale-in">
              {topCategory?.category || 'Various'}
            </h1>
            <p className="text-xl text-platinum/80 animate-fade-in-delayed font-light mb-2">
              {topCategory ? formatCurrency(topCategory.total) : '£0'}
            </p>
            <p className="text-lg text-silver/60 animate-fade-in-delayed font-light">
              {topCategory?.percentage || 0}% of your spending
            </p>
          </div>
        );
      },
    },
    {
      id: 'average',
      background: 'from-[#0c1929] via-[#132238] to-[#1a2d47]',
      render: stats => (
        <div className="text-center">
          <p className="text-lg text-gold/80 mb-6 animate-fade-in tracking-widest uppercase">
            On average, you spent
          </p>
          <h1 className="font-display text-6xl sm:text-8xl font-medium text-gold-gradient mb-8 animate-scale-in">
            {formatCurrency(stats.averageTransaction)}
          </h1>
          <p className="text-xl text-platinum/80 animate-fade-in-delayed font-light">
            per transaction
          </p>
        </div>
      ),
    },
    {
      id: 'merchants',
      background: 'from-[#1a1a0c] via-[#2d2810] to-[#1a1a0c]',
      render: stats => (
        <div className="text-center">
          <p className="text-lg text-gold/80 mb-6 animate-fade-in tracking-widest uppercase">
            You visited
          </p>
          <h1 className="font-display text-8xl sm:text-[10rem] font-medium text-gold-gradient mb-8 animate-scale-in">
            {stats.uniqueMerchants}
          </h1>
          <p className="text-xl text-platinum/80 animate-fade-in-delayed font-light">
            different merchants
          </p>
        </div>
      ),
    },
  ];

  // Add foreign spend slide if there are foreign transactions
  if (stats.foreignSpend.transactionCount > 0) {
    slides.push({
      id: 'foreign-spend',
      background: 'from-[#0c1929] via-[#0c2129] to-[#0c1929]',
      render: stats => {
        const topCurrency = stats.foreignSpend.byCurrency[0];
        return (
          <div className="text-center">
            <p className="text-lg text-blue-400/80 mb-6 animate-fade-in tracking-widest uppercase">
              You went international
            </p>
            <h1 className="font-display text-6xl sm:text-8xl font-medium text-blue-400 mb-6 animate-scale-in">
              {formatCurrency(stats.foreignSpend.totalGBP)}
            </h1>
            <p className="text-xl text-platinum/80 animate-fade-in-delayed font-light mb-4">
              spent in{' '}
              <span className="text-blue-400 font-medium">
                {stats.foreignSpend.byCurrency.length}
              </span>{' '}
              {stats.foreignSpend.byCurrency.length === 1 ? 'currency' : 'currencies'}
            </p>
            {topCurrency && (
              <p className="text-lg text-silver/60 animate-fade-in-delayed font-light">
                Mostly {topCurrency.currency.toLowerCase()} ({topCurrency.currencyCode})
              </p>
            )}
          </div>
        );
      },
    });
  }

  // Add refunds slide
  slides.push({
    id: 'refunds',
    background: 'from-[#0c1929] via-[#0f2918] to-[#0c1929]',
    render: stats => (
      <div className="text-center">
        <p className="text-lg text-emerald-400/80 mb-6 animate-fade-in tracking-widest uppercase">
          You got back
        </p>
        <h1 className="font-display text-6xl sm:text-8xl font-medium text-emerald-400 mb-8 animate-scale-in">
          {formatCurrency(stats.totalRefunds)}
        </h1>
        <p className="text-xl text-platinum/80 animate-fade-in-delayed font-light">in refunds</p>
      </div>
    ),
  });

  // Add outro slide
  slides.push({
    id: 'outro',
    background: 'from-[#0c1929] via-[#132238] to-[#1a2d47]',
    render: stats => (
      <div className="text-center">
        <p className="text-lg text-gold/80 mb-6 animate-fade-in tracking-widest uppercase">
          That's your
        </p>
        <h1 className="font-display text-5xl sm:text-7xl font-medium text-gold-gradient mb-6 animate-scale-in">
          Amex Wrapped
        </h1>
        <p className="text-3xl text-platinum/60 animate-fade-in-delayed mb-10 font-light">
          {stats.dateRange.start?.getFullYear() || new Date().getFullYear()}
        </p>
        <div className="animate-fade-in-delayed">
          <p className="text-sm text-silver/60 uppercase tracking-widest mb-2">Net spending</p>
          <p className="text-2xl text-gold font-medium">{formatCurrency(stats.netSpending)}</p>
        </div>
      </div>
    ),
  });

  return slides;
}

export function StoryMode({ stats, onClose }: StoryModeProps) {
  const slides = useMemo(() => getSlides(stats), [stats]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goToSlide = useCallback(
    (index: number) => {
      if (isAnimating) return;
      if (index < 0 || index >= slides.length) return;

      setIsAnimating(true);
      setCurrentSlide(index);
      setTimeout(() => setIsAnimating(false), 500);
    },
    [isAnimating, slides.length]
  );

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    }
  }, [currentSlide, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }, [currentSlide, goToSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, onClose]);

  const slide = slides[currentSlide];

  return (
    <div
      className={`fixed inset-0 z-50 bg-gradient-to-br ${slide.background} transition-all duration-700`}
    >
      {/* Grain overlay */}
      <div className="absolute inset-0 grain-overlay pointer-events-none" />

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all z-20"
      >
        <X className="w-5 h-5 text-platinum" />
      </button>

      {/* Progress dots */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-gold w-8'
                : index < currentSlide
                  ? 'bg-gold/50 w-1.5'
                  : 'bg-white/20 w-1.5 hover:bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Slide content */}
      <div className="h-full flex items-center justify-center px-8 relative z-10">
        <div key={slide.id} className="max-w-2xl">
          {slide.render(stats)}
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4 z-20">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-platinum" />
        </button>
        <button
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-5 h-5 text-platinum" />
        </button>
      </div>

      {/* Click to advance - behind other elements */}
      <div
        className="absolute inset-0 flex z-0"
        onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x > rect.width / 2) {
            nextSlide();
          } else {
            prevSlide();
          }
        }}
      />
    </div>
  );
}
