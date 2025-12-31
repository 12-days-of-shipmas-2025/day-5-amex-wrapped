import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">Amex Wrapped</h1>
        <p className="text-lg text-muted-foreground mb-8">Your spending year in review</p>
        <div className="max-w-md mx-auto p-8 border border-border rounded-xl bg-secondary/50 cursor-pointer hover:bg-secondary/70 transition-colors">
          <div className="flex flex-col items-center gap-4">
            <svg
              className="w-12 h-12 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-secondary-foreground">Drop your Amex CSV file here to get started</p>
            <p className="text-sm text-muted-foreground">
              Your data stays in your browser - nothing is uploaded
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
