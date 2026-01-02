import { createRootRoute, Outlet } from '@tanstack/react-router';
import { MessageCircle } from 'lucide-react';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      {/* Chat button - links to humanwritten.ai */}
      <a
        href="https://humanwritten.ai?chat=open"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-gold text-midnight shadow-lg hover:bg-gold-light transition-all hover:scale-105"
        aria-label="Chat with us"
      >
        <MessageCircle className="w-5 h-5" />
      </a>
    </div>
  );
}
