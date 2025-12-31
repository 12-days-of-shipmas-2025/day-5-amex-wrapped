import { createFileRoute } from '@tanstack/react-router';
import { useTransactionStore } from '@/store/transaction-store';
import { FileUpload } from '@/components/features/FileUpload';
import { WrappedDashboard } from '@/components/features/WrappedDashboard';
import { Shield } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col grain-overlay">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        </div>

        <div className="relative text-center mb-16 max-w-2xl animate-fade-up">
          {/* Privacy badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full card-glass">
            <Shield className="w-4 h-4 text-gold" />
            <span className="text-sm text-platinum">
              100% Private — Your data stays in your browser
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-display-xl mb-6">
            <span className="text-foreground">Amex</span>{' '}
            <span className="text-gold-gradient">Wrapped</span>
          </h1>

          <p className="text-xl text-silver font-light leading-relaxed max-w-lg mx-auto">
            Your spending year in review. Beautiful visualizations of your American Express
            transactions.
          </p>
        </div>

        {/* File upload */}
        <div className="relative z-10 animate-fade-up stagger-1">
          <FileUpload />
        </div>

        {/* How it works */}
        <div className="mt-20 max-w-3xl mx-auto w-full animate-fade-up stagger-2">
          <p className="text-label text-center mb-8">How to get your CSV</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: 1, text: 'Sign in to Amex UK' },
              { step: 2, text: 'Go to Statements & Activity' },
              { step: 3, text: 'Download as CSV' },
            ].map(({ step, text }) => (
              <div
                key={step}
                className="card-glass p-6 rounded-xl text-center group hover:scale-[1.02] transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-gold/20 transition-colors">
                  <span className="text-gold font-semibold">{step}</span>
                </div>
                <p className="text-platinum font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative py-8 text-center border-t border-border">
        <div className="flex items-center justify-center gap-2 text-silver">
          <Shield className="w-4 h-4 text-gold-muted" />
          <p className="text-sm">Made with privacy in mind. No data ever leaves your browser.</p>
        </div>
      </footer>
    </div>
  );
}
