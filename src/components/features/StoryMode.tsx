import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { WrappedStats } from '@/types/transaction';
import { formatCurrency } from '@/lib/stats';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Music,
  VolumeX,
  Play,
  Pause,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Tooltip,
} from 'recharts';

interface StoryModeProps {
  stats: WrappedStats;
  onClose: () => void;
  preloadedAudio?: HTMLAudioElement | null;
  preloadedAudioUrl?: string | null;
  isAudioPreloaded?: boolean;
  audioBlobForExport?: Blob | null;
}

interface Slide {
  id: string;
  background: string;
  render: (stats: WrappedStats) => React.ReactNode;
}

interface ExportProgress {
  stage: string;
  progress: number;
}

// Premium color palette for charts
const CHART_COLORS = {
  gold: '#D4AF37',
  goldLight: '#E5C76B',
  goldDark: '#B8960C',
  platinum: '#E5E4E2',
  silver: '#A8A9AD',
  navy: '#1a2d47',
  navyLight: '#2a4a6d',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  violet: '#8b5cf6',
  cyan: '#06b6d4',
};

// Category colors for pie chart
const CATEGORY_CHART_COLORS = [
  CHART_COLORS.gold,
  CHART_COLORS.emerald,
  CHART_COLORS.amber,
  CHART_COLORS.violet,
  CHART_COLORS.cyan,
  CHART_COLORS.rose,
  CHART_COLORS.silver,
];

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
            {formatCurrency(stats.netSpending)}
          </h1>
          <p className="text-xl text-platinum/80 animate-fade-in-delayed font-light">
            across <span className="text-gold font-medium">{stats.transactionCount}</span>{' '}
            transactions
          </p>
          {stats.totalRefunds > 0 && (
            <p className="text-sm text-silver/60 animate-fade-in-delayed mt-4">
              after {formatCurrency(stats.totalRefunds)} in refunds
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'monthly-chart',
      background: 'from-[#0c1929] via-[#132238] to-[#1a2d47]',
      render: stats => {
        const monthlyData = stats.monthlySpending.map(m => ({
          name: m.monthLabel.split(' ')[0].slice(0, 3), // "Jan"
          amount: m.total,
          isMax: m.total === Math.max(...stats.monthlySpending.map(x => x.total)),
        }));
        const maxMonth = stats.monthlySpending.reduce((a, b) => (a.total > b.total ? a : b));
        return (
          <div className="text-center w-full">
            <p className="text-lg text-gold/80 mb-4 animate-fade-in tracking-widest uppercase">
              Your spending journey
            </p>
            <div className="h-64 w-full animate-fade-in-delayed mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#A8A9AD', fontSize: 11 }}
                  />
                  <YAxis hide />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {monthlyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isMax ? CHART_COLORS.gold : CHART_COLORS.navyLight}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xl text-platinum/80 font-light">
              <span className="text-gold font-medium">{maxMonth.monthLabel}</span> was your biggest
              month
            </p>
            <p className="text-2xl text-gold font-medium mt-2">{formatCurrency(maxMonth.total)}</p>
          </div>
        );
      },
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
      id: 'category-breakdown',
      background: 'from-[#0c1929] via-[#132238] to-[#1a2d47]',
      render: stats => {
        const pieData = stats.topCategories.slice(0, 6).map((cat, i) => ({
          name: cat.category,
          value: cat.total,
          percentage: cat.percentage,
          color: CATEGORY_CHART_COLORS[i % CATEGORY_CHART_COLORS.length],
        }));
        return (
          <div className="text-center w-full">
            <p className="text-lg text-gold/80 mb-4 animate-fade-in tracking-widest uppercase">
              Where it all went
            </p>
            <div className="h-56 w-full animate-fade-in-delayed mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card/95 backdrop-blur border border-gold/20 rounded-lg px-3 py-2">
                            <p className="text-platinum text-sm font-medium">{data.name}</p>
                            <p className="text-gold text-sm">{formatCurrency(data.value)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 animate-fade-in-delayed">
              {pieData.slice(0, 4).map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm text-platinum/80">{cat.name}</span>
                  <span className="text-sm text-silver/60">{cat.percentage}%</span>
                </div>
              ))}
            </div>
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
    {
      id: 'top-merchants-chart',
      background: 'from-[#0c1929] via-[#132238] to-[#1a2d47]',
      render: stats => {
        const merchantData = stats.topMerchants.slice(0, 5).map((m, i) => ({
          name: m.merchantName.length > 15 ? m.merchantName.slice(0, 15) + '...' : m.merchantName,
          fullName: m.merchantName,
          amount: m.total,
          visits: m.count,
          isTop: i === 0,
        }));
        const maxAmount = Math.max(...merchantData.map(m => m.amount));
        return (
          <div className="text-center w-full">
            <p className="text-lg text-gold/80 mb-6 animate-fade-in tracking-widest uppercase">
              Your top merchants
            </p>
            <div className="space-y-3 animate-fade-in-delayed">
              {merchantData.map((merchant, i) => (
                <div key={i} className="text-left">
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className={`text-sm ${merchant.isTop ? 'text-gold' : 'text-platinum/80'} truncate max-w-[60%]`}
                    >
                      {merchant.fullName}
                    </span>
                    <span
                      className={`text-sm font-medium ${merchant.isTop ? 'text-gold' : 'text-platinum'}`}
                    >
                      {formatCurrency(merchant.amount)}
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        merchant.isTop ? 'bg-gold' : 'bg-gradient-to-r from-gold/40 to-gold/20'
                      }`}
                      style={{ width: `${(merchant.amount / maxAmount) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-silver/50 mt-0.5">
                    {merchant.visits} {merchant.visits === 1 ? 'visit' : 'visits'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      },
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

// Crossfade duration in seconds
const CROSSFADE_DURATION = 2;
const SLIDE_AUTO_ADVANCE_MS = 3000; // 3 seconds per slide = 1 bar at 80 BPM (synced to music)
const MANUAL_RESUME_DELAY_MS = 10000; // Resume auto-play after 10 seconds of no interaction

export function StoryMode({
  stats,
  onClose,
  preloadedAudio,
  preloadedAudioUrl,
  isAudioPreloaded = false,
  audioBlobForExport,
}: StoryModeProps) {
  const slides = useMemo(() => getSlides(stats), [stats]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreloadingAudio, setIsPreloadingAudio] = useState(!isAudioPreloaded); // Skip if already preloaded
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isReady, setIsReady] = useState(false); // Show play button until ready
  const [isAutoPlaying, setIsAutoPlaying] = useState(false); // Auto-advance slides
  const [, setIsManualMode] = useState(false); // User took manual control
  const [isRecordingVisible, setIsRecordingVisible] = useState(false); // Show portrait recording view
  const [recordingSlide, setRecordingSlide] = useState(0); // Current recording slide
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null); // Separate ref for capturing - excludes UI overlays
  const recordingRef = useRef<HTMLDivElement>(null); // Ref for visible recording viewport
  const audioRef = useRef<HTMLAudioElement | null>(preloadedAudio || null);
  const audioUrlRef = useRef<string | null>(preloadedAudioUrl || null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const manualResumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Use preloaded audio if available
  useEffect(() => {
    if (preloadedAudio && isAudioPreloaded) {
      audioRef.current = preloadedAudio;
      audioUrlRef.current = preloadedAudioUrl || null;
      setIsPreloadingAudio(false);

      // Set up audio event handlers
      preloadedAudio.onended = () => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
      };
      preloadedAudio.onpause = () => setIsPlaying(false);
      preloadedAudio.onplay = () => setIsPlaying(true);
    }
  }, [preloadedAudio, preloadedAudioUrl, isAudioPreloaded]);

  // Handle manual interaction - pause auto-play and start resume timer
  const handleManualInteraction = useCallback(() => {
    // Clear any existing resume timer
    if (manualResumeTimerRef.current) {
      clearTimeout(manualResumeTimerRef.current);
    }

    // Enter manual mode and pause auto-play
    setIsManualMode(true);
    setIsAutoPlaying(false);

    // Start 10-second timer to resume auto-play
    manualResumeTimerRef.current = setTimeout(() => {
      setIsManualMode(false);
      setIsAutoPlaying(true);
    }, MANUAL_RESUME_DELAY_MS);
  }, []);

  const goToSlide = useCallback(
    (index: number, isManual = false) => {
      if (isAnimating || isExporting) return;
      if (index < 0 || index >= slides.length) return;

      // If manual navigation, trigger manual mode handling
      if (isManual) {
        handleManualInteraction();
      }

      setIsAnimating(true);
      setCurrentSlide(index);
      setTimeout(() => setIsAnimating(false), 500);
    },
    [isAnimating, isExporting, slides.length, handleManualInteraction]
  );

  const nextSlide = useCallback(
    (isManual = false) => {
      if (currentSlide < slides.length - 1) {
        goToSlide(currentSlide + 1, isManual);
      }
    },
    [currentSlide, slides.length, goToSlide]
  );

  const prevSlide = useCallback(
    (isManual = false) => {
      if (currentSlide > 0) {
        goToSlide(currentSlide - 1, isManual);
      }
    },
    [currentSlide, goToSlide]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isExporting) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide(true); // Manual navigation
      } else if (e.key === 'ArrowLeft') {
        prevSlide(true); // Manual navigation
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, onClose, isExporting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      if (manualResumeTimerRef.current) {
        clearTimeout(manualResumeTimerRef.current);
      }
    };
  }, []);

  // Auto-advance slides when auto-playing
  useEffect(() => {
    if (!isAutoPlaying || isExporting) return;

    autoPlayTimerRef.current = setTimeout(() => {
      if (currentSlide < slides.length - 1) {
        setCurrentSlide(prev => prev + 1);
      } else {
        // Reached the end, stop auto-play
        setIsAutoPlaying(false);
      }
    }, SLIDE_AUTO_ADVANCE_MS);

    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
    };
  }, [isAutoPlaying, currentSlide, slides.length, isExporting]);

  // Setup crossfade looping for audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;

    const checkForCrossfade = () => {
      if (!audio) return;
      const timeRemaining = audio.duration - audio.currentTime;

      if (timeRemaining <= CROSSFADE_DURATION && timeRemaining > 0) {
        // Start fading out
        const fadeStep = audio.volume / (CROSSFADE_DURATION * 20);

        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

        fadeIntervalRef.current = setInterval(() => {
          if (!audioRef.current) return;

          if (audioRef.current.volume > fadeStep) {
            audioRef.current.volume -= fadeStep;
          } else {
            // Reset to beginning with fade in
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 0;

            // Fade back in
            const fadeInInterval = setInterval(() => {
              if (!audioRef.current) {
                clearInterval(fadeInInterval);
                return;
              }
              if (audioRef.current.volume < 0.95) {
                audioRef.current.volume = Math.min(1, audioRef.current.volume + fadeStep);
              } else {
                audioRef.current.volume = 1;
                clearInterval(fadeInInterval);
              }
            }, 50);

            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
          }
        }, 50);
      }
    };

    const interval = setInterval(checkForCrossfade, 100);
    return () => {
      clearInterval(interval);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    };
  }, [isPlaying]);

  // Generate a unique seed from the user's stats for reproducible music
  const musicSeed = useMemo(() => {
    const seedParts = [
      stats.netSpending,
      stats.transactionCount,
      stats.uniqueMerchants,
      stats.dateRange.start?.getTime() || 0,
      stats.biggestPurchase?.absoluteAmount || 0,
    ];
    // Create a simple hash from the stats
    return seedParts.reduce((acc, val) => acc * 31 + Math.floor(val), 0);
  }, [stats]);

  // Fallback: Preload audio on mount if not already preloaded by parent
  useEffect(() => {
    // Skip if audio was already preloaded by parent component
    if (isAudioPreloaded && preloadedAudio) return;

    let cancelled = false;

    const preloadAudio = async () => {
      try {
        const { generateLofiAudio, SECONDS_PER_BAR } = await import('@/lib/music-generator');
        // Generate enough music for all slides + some buffer for looping
        const slideDuration = slides.length * SECONDS_PER_BAR;
        const audioDuration = Math.max(60, slideDuration + 12); // At least 60s, or slides + 4 bars buffer
        const audioBlob = await generateLofiAudio(audioDuration, { seed: musicSeed });

        if (cancelled) return;

        const url = URL.createObjectURL(audioBlob);
        audioUrlRef.current = url;

        const audio = new Audio(url);
        audio.loop = false; // We handle looping with crossfade
        audio.preload = 'auto';
        audioRef.current = audio;

        audio.onended = () => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
          }
        };
        audio.onpause = () => setIsPlaying(false);
        audio.onplay = () => setIsPlaying(true);

        // Preload the audio data
        await new Promise<void>(resolve => {
          audio.addEventListener('canplaythrough', () => resolve(), { once: true });
          audio.load();
        });

        if (!cancelled) {
          setIsPreloadingAudio(false);
        }
      } catch (error) {
        console.error('Failed to preload audio:', error);
        if (!cancelled) {
          setIsPreloadingAudio(false);
        }
      }
    };

    preloadAudio();

    return () => {
      cancelled = true;
    };
  }, [musicSeed, slides.length, isAudioPreloaded, preloadedAudio]);

  const handleToggleAudio = useCallback(async () => {
    if (isLoadingAudio) return;

    // If already playing, pause
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // If we have audio loaded, play it
    if (audioRef.current && audioUrlRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    // Generate new audio with seed based on user's stats
    setIsLoadingAudio(true);
    try {
      const { generateLofiAudio } = await import('@/lib/music-generator');
      const audioBlob = await generateLofiAudio(60, { seed: musicSeed }); // 60 seconds of music

      // Create audio element
      const url = URL.createObjectURL(audioBlob);
      audioUrlRef.current = url;

      const audio = new Audio(url);
      audio.loop = false; // We handle looping manually with crossfade
      audioRef.current = audio;

      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);

      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to generate audio:', error);
    } finally {
      setIsLoadingAudio(false);
    }
  }, [isPlaying, isLoadingAudio, musicSeed]);

  // Start the wrapped experience with music and auto-play
  const handleStartExperience = useCallback(async () => {
    setIsReady(true);
    setIsAutoPlaying(true);

    // Play the preloaded audio
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Failed to play audio:', error);
      }
    }
  }, []);

  // Toggle auto-play (pause/resume)
  const handleToggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => !prev);
  }, []);

  const handleExport = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    setIsRecordingVisible(true);
    setRecordingSlide(0);
    setExportProgress({ stage: 'Preparing...', progress: 0 });

    try {
      // Dynamically import the heavy libraries
      const [
        {
          exportToVideo,
          captureElement,
          downloadBlob,
          SLIDE_DURATION_SECONDS,
          ANIMATION_DURATION_MS,
          ANIMATION_SETTLE_MS,
        },
        { generateLofiAudio },
      ] = await Promise.all([import('@/lib/video-export'), import('@/lib/music-generator')]);

      const totalDuration = slides.length * SLIDE_DURATION_SECONDS;

      // Use preloaded audio blob if available, otherwise generate new
      let audioBlob: Blob;
      if (audioBlobForExport) {
        setExportProgress({ stage: 'Using preloaded audio...', progress: 15 });
        audioBlob = audioBlobForExport;
      } else {
        setExportProgress({ stage: 'Generating music...', progress: 5 });
        audioBlob = await generateLofiAudio(totalDuration, {
          seed: musicSeed,
          onProgress: progress => {
            setExportProgress({ stage: 'Generating music...', progress: 5 + progress * 0.15 });
          },
        });
      }

      setExportProgress({ stage: 'Recording slides...', progress: 20 });

      // Optimized frame capture for smooth animations:
      // - Capture at 12fps during animation phase (~800ms = 10 frames)
      // - Use single frame for remaining static content
      const frames: Array<{ dataUrl: string; duration: number }> = [];
      const animationDurationSec = ANIMATION_DURATION_MS / 1000;
      const targetFps = 12; // Balance between smoothness and speed
      const frameInterval = 1000 / targetFps;
      const animationFrames = Math.ceil(ANIMATION_DURATION_MS / frameInterval);
      const frameDuration = frameInterval / 1000; // Duration in seconds

      for (let i = 0; i < slides.length; i++) {
        // Update visible recording slide
        setRecordingSlide(i);

        // Wait for React to render and CSS animations to initialize
        await new Promise(resolve => setTimeout(resolve, ANIMATION_SETTLE_MS));

        // Capture animation frames for smooth playback
        for (let frame = 0; frame < animationFrames; frame++) {
          if (recordingRef.current) {
            const dataUrl = await captureElement(recordingRef.current);
            frames.push({ dataUrl, duration: frameDuration });
          }
          // Wait for next frame timing
          await new Promise(resolve => setTimeout(resolve, frameInterval));
        }

        // Capture final static frame for remaining duration
        const staticDuration = SLIDE_DURATION_SECONDS - animationDurationSec;
        if (staticDuration > 0 && recordingRef.current) {
          const dataUrl = await captureElement(recordingRef.current);
          frames.push({ dataUrl, duration: staticDuration });
        }

        setExportProgress({
          stage: `Recording slide ${i + 1}/${slides.length}...`,
          progress: 20 + ((i + 1) / slides.length) * 30,
        });
      }

      // Encode video
      setExportProgress({ stage: 'Encoding video...', progress: 50 });
      const videoBlob = await exportToVideo(frames, audioBlob, (stage, progress) => {
        setExportProgress({ stage, progress: 50 + progress * 0.5 });
      });

      // Download
      const year = stats.dateRange.start?.getFullYear() || new Date().getFullYear();
      downloadBlob(videoBlob, `amex-wrapped-${year}.mp4`);

      setExportProgress({ stage: 'Complete!', progress: 100 });
      setTimeout(() => {
        setIsExporting(false);
        setIsRecordingVisible(false);
        setExportProgress(null);
      }, 1500);
    } catch (error) {
      console.error('Export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setExportProgress({
        stage: `Export failed: ${errorMessage.slice(0, 50)}`,
        progress: 0,
      });
      setTimeout(() => {
        setIsExporting(false);
        setIsRecordingVisible(false);
        setExportProgress(null);
      }, 5000);
    }
  }, [isExporting, slides, stats, musicSeed, audioBlobForExport]);

  const slide = slides[currentSlide];
  const year = stats.dateRange.start?.getFullYear() || new Date().getFullYear();

  // Show intro screen with play button
  if (!isReady) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#0c1929] via-[#132238] to-[#1a2d47]">
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

        {/* Intro content */}
        <div className="h-full flex flex-col items-center justify-center px-8 relative z-10">
          <p className="text-lg text-gold/80 mb-4 tracking-widest uppercase animate-fade-in">
            Your Year with Amex
          </p>
          <h1 className="font-display text-8xl sm:text-[10rem] font-medium text-gold-gradient mb-6 animate-scale-in">
            {year}
          </h1>
          <p className="text-xl text-platinum/60 mb-12 animate-fade-in-delayed font-light">
            Wrapped
          </p>

          {/* Play button */}
          <button
            onClick={handleStartExperience}
            disabled={isPreloadingAudio}
            className="group relative animate-fade-in-delayed"
          >
            <div
              className={`absolute inset-0 rounded-full blur-xl transition-all ${
                isPreloadingAudio ? 'bg-white/10' : 'bg-gold/20 group-hover:bg-gold/30'
              }`}
            />
            <div
              className={`relative flex items-center justify-center w-24 h-24 rounded-full border-2 shadow-2xl transition-all ${
                isPreloadingAudio
                  ? 'bg-gradient-to-br from-silver/30 to-silver/20 border-silver/30'
                  : 'bg-gradient-to-br from-gold to-gold-dark border-gold/50 group-hover:scale-105'
              }`}
            >
              {isPreloadingAudio ? (
                <Loader2 className="w-10 h-10 text-platinum/60 animate-spin" />
              ) : (
                <Play className="w-10 h-10 text-[#0c1929] ml-1" fill="currentColor" />
              )}
            </div>
          </button>

          <p className="text-sm text-silver/50 mt-8 animate-fade-in-delayed">
            {isPreloadingAudio ? 'Generating your soundtrack...' : 'Tap to begin your journey'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={slideContainerRef} className="fixed inset-0 z-50">
      {/* Capturable content - only this part gets exported to video */}
      <div
        ref={captureRef}
        className={`absolute inset-0 bg-gradient-to-br ${slide.background} transition-all duration-700`}
      >
        {/* Grain overlay */}
        <div className="absolute inset-0 grain-overlay pointer-events-none" />

        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />

        {/* Slide content */}
        <div className="h-full flex items-center justify-center px-8 relative z-10">
          <div key={slide.id} className="max-w-2xl">
            {slide.render(stats)}
          </div>
        </div>
      </div>

      {/* UI Layer - NOT captured in export */}
      {/* Export progress overlay */}
      {isExporting && exportProgress && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="bg-card border border-gold/20 rounded-2xl p-8 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 text-gold animate-spin" />
              <span className="text-lg text-foreground font-medium">{exportProgress.stage}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gold transition-all duration-300 ease-out"
                style={{ width: `${exportProgress.progress}%` }}
              />
            </div>
            <p className="text-sm text-silver mt-3 text-center">
              {Math.round(exportProgress.progress)}%
            </p>
          </div>
        </div>
      )}

      {/* Close and Export buttons */}
      <div className="absolute top-6 right-6 flex gap-2 z-20">
        {/* Auto-play toggle */}
        <button
          onClick={handleToggleAutoPlay}
          disabled={isExporting}
          className={`p-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isAutoPlaying
              ? 'bg-gold/20 hover:bg-gold/30 border border-gold/30'
              : 'bg-white/5 hover:bg-white/10 border border-white/10'
          }`}
          title={isAutoPlaying ? 'Pause slideshow' : 'Resume slideshow'}
        >
          {isAutoPlaying ? (
            <Pause className="w-5 h-5 text-gold" />
          ) : (
            <Play className="w-5 h-5 text-platinum" />
          )}
        </button>
        {/* Music toggle */}
        <button
          onClick={handleToggleAudio}
          disabled={isExporting}
          className={`p-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isPlaying
              ? 'bg-emerald-500/30 hover:bg-emerald-500/40 border border-emerald-500/50'
              : 'bg-white/5 hover:bg-white/10 border border-white/10'
          }`}
          title={isPlaying ? 'Mute music' : 'Play music'}
        >
          {isLoadingAudio ? (
            <Loader2 className="w-5 h-5 text-platinum animate-spin" />
          ) : isPlaying ? (
            <Music className="w-5 h-5 text-emerald-400" />
          ) : (
            <VolumeX className="w-5 h-5 text-platinum" />
          )}
        </button>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="p-3 rounded-full bg-gold/20 hover:bg-gold/30 border border-gold/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export to Instagram Story (MP4)"
        >
          <Download className="w-5 h-5 text-gold" />
        </button>
        <button
          onClick={onClose}
          disabled={isExporting}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-5 h-5 text-platinum" />
        </button>
      </div>

      {/* Progress dots */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index, true)}
            disabled={isExporting}
            className={`h-1.5 rounded-full transition-all duration-300 disabled:cursor-not-allowed ${
              index === currentSlide
                ? 'bg-gold w-8'
                : index < currentSlide
                  ? 'bg-gold/50 w-1.5'
                  : 'bg-white/20 w-1.5 hover:bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4 z-20">
        <button
          onClick={() => prevSlide(true)}
          disabled={currentSlide === 0 || isExporting}
          className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-platinum" />
        </button>
        <button
          onClick={() => nextSlide(true)}
          disabled={currentSlide === slides.length - 1 || isExporting}
          className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-5 h-5 text-platinum" />
        </button>
      </div>

      {/* Click to advance - behind other elements */}
      {!isExporting && (
        <div
          className="absolute inset-0 flex z-0"
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x > rect.width / 2) {
              nextSlide(true);
            } else {
              prevSlide(true);
            }
          }}
        />
      )}

      {/* Recording viewport - visible 9:16 portrait during export (90% of viewport height) */}
      {isRecordingVisible && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          {/* Recording frame with 9:16 aspect ratio - 90% of viewport height */}
          <div
            className="relative"
            style={{
              height: '90vh',
              width: 'calc(90vh * 9 / 16)', // Maintain 9:16 aspect ratio
              maxWidth: '90vw',
            }}
          >
            {/* The actual capture area - scaled to fit display */}
            <div
              ref={recordingRef}
              className={`absolute top-0 left-0 bg-gradient-to-br ${slides[recordingSlide]?.background || 'from-[#0c1929] to-[#1a2d47]'}`}
              style={{
                width: '1080px',
                height: '1920px',
                transform: `scale(${Math.min((window.innerHeight * 0.9) / 1920, (window.innerWidth * 0.9) / 1080)})`,
                transformOrigin: 'top left',
              }}
            >
              {/* Grain overlay */}
              <div className="absolute inset-0 grain-overlay pointer-events-none" />
              {/* Vignette */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
              {/* Slide content - key forces animation restart on slide change */}
              <div className="h-full flex items-center justify-center px-16 relative z-10">
                <div key={`recording-${recordingSlide}`} className="max-w-3xl w-full">
                  {slides[recordingSlide]?.render(stats)}
                </div>
              </div>
            </div>

            {/* Recording indicator */}
            <div className="absolute -top-10 left-0 right-0 flex items-center justify-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-white font-medium">Recording</span>
            </div>
          </div>

          {/* Progress info - positioned at bottom */}
          <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-4">
            <div className="bg-card/90 backdrop-blur border border-gold/20 rounded-xl px-6 py-4 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="w-5 h-5 text-gold animate-spin" />
                <span className="text-sm text-foreground font-medium">{exportProgress?.stage}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gold transition-all duration-300"
                  style={{ width: `${exportProgress?.progress || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
