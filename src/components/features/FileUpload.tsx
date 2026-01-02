import { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, Loader2, Shield, Sparkles } from 'lucide-react';
import { useTransactionStore } from '@/store/transaction-store';
// Embed demo data directly into the bundle at build time
import demoCSV from '@/../test/sample-transactions.csv?raw';

export function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const { loadCSV, isLoading, error } = useTransactionStore();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.csv')) {
        loadCSV(file);
      }
    },
    [loadCSV]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        loadCSV(file);
      }
    },
    [loadCSV]
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center w-full p-10
          rounded-2xl cursor-pointer overflow-hidden
          transition-all duration-500 ease-out
          ${
            isDragging
              ? 'card-gold scale-[1.02] shadow-[0_0_60px_rgba(201,169,98,0.15)]'
              : 'card-glass hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)]'
          }
          ${isLoading ? 'pointer-events-none' : ''}
        `}
      >
        {/* Animated border gradient */}
        <div
          className={`
            absolute inset-0 opacity-0 transition-opacity duration-500
            ${isDragging ? 'opacity-100' : ''}
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5" />
        </div>

        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-6 animate-fade-in">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-gold animate-spin" />
              <div className="absolute inset-0 blur-xl bg-gold/20 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-xl font-medium text-foreground mb-2">
                Processing your transactions
              </p>
              <p className="text-sm text-silver">This will only take a moment...</p>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center gap-6">
            {/* Icon */}
            <div
              className={`
                relative p-6 rounded-2xl transition-all duration-500
                ${isDragging ? 'bg-gold/20 scale-110' : 'bg-midnight-lighter'}
              `}
            >
              {isDragging ? (
                <FileText className="w-12 h-12 text-gold" />
              ) : (
                <Upload className="w-12 h-12 text-gold-muted" />
              )}
              {/* Glow effect */}
              <div
                className={`
                  absolute inset-0 rounded-2xl blur-xl transition-opacity duration-500
                  ${isDragging ? 'opacity-100 bg-gold/30' : 'opacity-0'}
                `}
              />
            </div>

            {/* Text */}
            <div className="text-center">
              <p className="text-display-md text-foreground mb-2">
                {isDragging ? 'Release to upload' : 'Drop your statement'}
              </p>
              <p className="text-silver">
                or{' '}
                <span className="text-gold hover:text-gold-light transition-colors">
                  click to browse
                </span>
              </p>
            </div>

            {/* Supported formats */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-silver uppercase tracking-wider">Tested with</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-midnight-lighter border border-border">
                  <span className="text-base">🇬🇧</span>
                  <span className="text-xs text-platinum font-medium">UK</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-midnight-lighter border border-border">
                  <span className="text-base">🇲🇽</span>
                  <span className="text-xs text-platinum font-medium">Mexico</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </label>

      {error && (
        <div className="flex items-center gap-3 p-5 mt-6 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Try Demo button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={() => {
            const blob = new Blob([demoCSV], { type: 'text/csv' });
            const file = new File([blob], 'demo-transactions.csv', { type: 'text/csv' });
            loadCSV(file);
          }}
          disabled={isLoading}
          className="group flex items-center gap-2.5 px-6 py-3 text-sm bg-gradient-to-r from-gold/10 to-gold/5 hover:from-gold/20 hover:to-gold/10 border border-gold/20 hover:border-gold/40 rounded-full text-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
          <span className="font-medium">Try with demo data</span>
        </button>
      </div>

      {/* Privacy notice */}
      <div className="flex items-center justify-center gap-2 mt-6 text-silver">
        <Shield className="w-4 h-4 text-emerald-500/70" />
        <p className="text-xs">100% private &mdash; your data never leaves your browser</p>
      </div>
    </div>
  );
}
