'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { HelpCircle, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  variant?: 'home' | 'default';
  onHowItWorksClick?: () => void;
}

export function Header({ variant = 'default', onHowItWorksClick }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-2xl bg-white/50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <h1 className="text-xl sm:text-2xl font-extrabold cursor-pointer hover:opacity-80 transition-opacity">
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent tracking-tight">
                GigScope
              </span>
            </h1>
          </Link>
          
          {variant === 'home' && onHowItWorksClick && (
            <button
              onClick={onHowItWorksClick}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden xs:inline">Jak to działa?</span>
              <span className="xs:hidden">Info</span>
            </button>
          )}

          {variant === 'default' && (
            <Button
              onClick={() => router.push('/')}
              variant="ghost"
              size="sm"
              className="!px-2 sm:!px-4"
            >
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Strona główna</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
