import { createFileRoute } from '@tanstack/react-router';
import { useTransactionStore } from '@/store/transaction-store';
import { FileUpload } from '@/components/features/FileUpload';
import { WrappedDashboard } from '@/components/features/WrappedDashboard';
import { MessageCircle } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { transactions } = useTransactionStore();
  const hasData = transactions.length > 0;

  if (hasData) {
    return <WrappedDashboard />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-12 pb-28 grain-overlay">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center mb-10 max-w-2xl animate-fade-up">
        {/* Main heading */}
        <h1 className="text-display-xl mb-4">
          <span className="text-foreground">Amex</span>{' '}
          <span className="text-gold-gradient">Wrapped</span>
        </h1>

        <p className="text-lg text-silver font-light leading-relaxed max-w-md mx-auto">
          Your spending year in review. Beautiful visualizations of your Amex transactions.
        </p>
      </div>

      {/* File upload */}
      <div className="relative z-10 animate-fade-up stagger-1">
        <FileUpload />
      </div>

      {/* How it works - compact inline version */}
      <div className="mt-10 animate-fade-up stagger-2">
        <div className="flex flex-col items-center justify-center gap-3 text-sm text-silver">
          <span className="text-xs text-silver/60 uppercase tracking-wider">How to get CSV:</span>
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <span className="flex items-center gap-1.5 text-xs sm:text-sm">
              <span className="w-5 h-5 rounded-full bg-gold/10 text-gold text-xs flex items-center justify-center font-medium shrink-0">
                1
              </span>
              Amex Login
            </span>
            <span className="text-silver/30">→</span>
            <span className="flex items-center gap-1.5 text-xs sm:text-sm">
              <span className="w-5 h-5 rounded-full bg-gold/10 text-gold text-xs flex items-center justify-center font-medium shrink-0">
                2
              </span>
              Statements
            </span>
            <span className="text-silver/30">→</span>
            <span className="flex items-center gap-1.5 text-xs sm:text-sm">
              <span className="w-5 h-5 rounded-full bg-gold/10 text-gold text-xs flex items-center justify-center font-medium shrink-0">
                3
              </span>
              CSV
            </span>
          </div>
        </div>
      </div>

      {/* Support notice */}
      <div className="mt-6 animate-fade-up stagger-3">
        <p className="text-xs text-silver/60 text-center flex items-center justify-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" />
          Different format not working? Chat with us for support
        </p>
      </div>
    </div>
  );
}
