import React from 'react';
import { Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full py-6 border-b border-brand-gray bg-brand-black/90 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-brand-gold w-6 h-6" />
          <h1 className="text-2xl font-serif font-bold tracking-widest text-white">
            VOGUE<span className="text-brand-gold">AI</span>
          </h1>
        </div>
        <nav>
          <span className="text-xs uppercase tracking-widest text-gray-400">Personal Stylist</span>
        </nav>
      </div>
    </header>
  );
};